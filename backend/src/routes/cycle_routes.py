"""
Cycle Management API Routes.

Handles creation, listing, and retrieval of collection/summarization cycles.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from datetime import datetime
import logging

from ..database import get_db
from ..models import Cycle, CollectedData, Summary
from ..models.cycle import CycleStatus
from ..schemas import (
    CycleCreate,
    CycleResponse,
    CycleListResponse,
    CycleDetailResponse,
    CollectedDataSummary,
    SummarySummary,
)
from ..services.collection_orchestrator import CollectionOrchestrator
from ..services.summary_service import SummaryService

router = APIRouter()
logger = logging.getLogger(__name__)


def serialize_for_json(obj):
    """
    Recursively convert datetime objects to ISO format strings for JSON serialization.

    Args:
        obj: Any object (dict, list, datetime, or primitive)

    Returns:
        JSON-serializable version of the object
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    else:
        return obj


@router.post("/", response_model=CycleResponse, status_code=201)
async def create_cycle(
    cycle_data: CycleCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create and execute a new collection + summarization cycle.

    This endpoint:
    1. Creates a cycle record
    2. Collects data from specified sources (async)
    3. Generates AI summary
    4. Stores everything in database

    The cycle runs asynchronously - check status via GET /cycles/{id}
    """
    logger.info(f"Creating new cycle: {cycle_data.name}")

    # Create cycle record
    cycle = Cycle(
        name=cycle_data.name,
        status=CycleStatus.PENDING,
        config_snapshot={
            "sources": [s.model_dump() for s in cycle_data.sources],
            "timeframe_days": cycle_data.timeframe_days,
            "llm_provider": cycle_data.llm_provider,
            "llm_model": cycle_data.llm_model,
            "custom_prompt": cycle_data.custom_prompt,
        },
    )

    db.add(cycle)
    await db.commit()
    await db.refresh(cycle)

    # Execute collection and summarization in background
    # Note: In production, use Celery/background tasks instead of inline execution
    try:
        await _execute_cycle(cycle.id, cycle_data, db)
    except Exception as e:
        logger.error(f"Cycle execution failed: {e}", exc_info=True)
        # Rollback any pending transaction to clean session state
        await db.rollback()
        # Fetch fresh cycle instance
        result = await db.execute(select(Cycle).where(Cycle.id == cycle.id))
        cycle = result.scalar_one()
        # Update to failed status
        cycle.status = CycleStatus.FAILED
        cycle.error_message = str(e)
        cycle.completed_at = datetime.now()
        await db.commit()
        await db.refresh(cycle)

    return CycleResponse.model_validate(cycle)


async def _execute_cycle(
    cycle_id,
    cycle_data: CycleCreate,
    db: AsyncSession,
):
    """Execute collection and summarization for a cycle."""
    # Update status to collecting
    result = await db.execute(select(Cycle).where(Cycle.id == cycle_id))
    cycle = result.scalar_one()
    cycle.status = CycleStatus.COLLECTING
    cycle.started_at = datetime.now()
    await db.commit()

    # Collect data from all sources
    orchestrator = CollectionOrchestrator()

    sources_config = [
        {
            "source_type": s.source_type,
            "credential_ref": s.credential_ref,
            "collect_spec": s.collect_spec,
        }
        for s in cycle_data.sources
    ]

    collected_results = await orchestrator.collect_multiple(sources_config, cycle_data.timeframe_days)

    # Store collected data
    successful_collections = 0
    failed_collections = 0

    for i, result in enumerate(collected_results):
        if result.get("error"):
            failed_collections += 1
            source_type = result.get('source_type', 'unknown')
            error = result.get('error')
            logger.error(
                f"Cycle {cycle_id}: Collection from {source_type} FAILED\n"
                f"  Error: {error}\n"
                f"  Source config: {cycle_data.sources[i].collect_spec if i < len(cycle_data.sources) else 'N/A'}"
            )
            continue

        successful_collections += 1
        source_type = result["metadata"]["source_type"]
        item_count = result["item_count"]
        logger.info(
            f"Cycle {cycle_id}: Collection from {source_type} succeeded - {item_count} items collected"
        )

        # Serialize datetime objects to ISO strings for JSON storage
        serialized_data = serialize_for_json(result["data"])

        # Get source name (convert list to comma-separated string if needed)
        source_name = result["source_info"].get("subreddits") or result["source_info"].get("channels") or "unknown"
        if isinstance(source_name, list):
            source_name = ", ".join(source_name)

        collected_data = CollectedData(
            cycle_id=cycle_id,
            source_type=source_type,
            source_name=source_name,
            data=serialized_data,
            data_size_bytes=len(str(serialized_data)),
            item_count=item_count,
            collection_time_ms=result["metadata"]["collection_time_ms"],
        )
        db.add(collected_data)

    logger.info(
        f"Cycle {cycle_id}: Collection summary - "
        f"{successful_collections} succeeded, {failed_collections} failed"
    )

    await db.commit()

    # Check if any data was collected
    total_items = sum(r.get("item_count", 0) for r in collected_results if not r.get("error"))

    if total_items == 0:
        logger.warning(f"Cycle {cycle_id}: No data collected from any source. Skipping summarization.")
        cycle.status = CycleStatus.FAILED
        cycle.error_message = "No data collected from any source. Check collection logs and source configurations."
        cycle.completed_at = datetime.now()
        await db.commit()
        return

    logger.info(f"Cycle {cycle_id}: Collected {total_items} items total. Proceeding to summarization.")

    # Update status to summarizing
    cycle.status = CycleStatus.SUMMARIZING
    await db.commit()

    # Generate summary
    summary_service = SummaryService(
        llm_provider=cycle_data.llm_provider,
        model=cycle_data.llm_model,
    )

    summary_result = await summary_service.summarize(
        collected_data=collected_results,
        custom_prompt=cycle_data.custom_prompt,
    )

    # Store summary
    summary = Summary(
        cycle_id=cycle_id,
        summary_text=summary_result["summary_text"],
        summary_word_count=summary_result["summary_word_count"],
        llm_provider=summary_result["llm_provider"],
        model_name=summary_result["model_name"],
        input_tokens=summary_result["input_tokens"],
        output_tokens=summary_result["output_tokens"],
        cost_usd=summary_result["cost_usd"],
        generation_time_ms=summary_result["generation_time_ms"],
    )
    db.add(summary)

    # Update cycle to completed
    cycle.status = CycleStatus.COMPLETED
    cycle.completed_at = datetime.now()
    await db.commit()

    logger.info(f"Cycle {cycle_id} completed successfully with {total_items} items")


@router.get("/", response_model=CycleListResponse)
async def list_cycles(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all cycles with pagination.

    Query parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - status: Filter by status (pending, collecting, summarizing, completed, failed)
    """
    # Build query
    query = select(Cycle)

    if status:
        query = query.where(Cycle.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.order_by(desc(Cycle.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    cycles = result.scalars().all()

    # Enrich cycles with summary and item count
    enriched_cycles = []
    for cycle in cycles:
        # Get summary for this cycle
        summary_result = await db.execute(
            select(Summary).where(Summary.cycle_id == cycle.id)
        )
        summary = summary_result.scalar_one_or_none()

        # Get total item count from collected data
        item_count_result = await db.execute(
            select(func.sum(CollectedData.item_count))
            .where(CollectedData.cycle_id == cycle.id)
        )
        total_items = item_count_result.scalar() or 0

        # Create response with enriched data
        cycle_dict = {
            "id": cycle.id,
            "name": cycle.name,
            "status": cycle.status,
            "created_at": cycle.created_at,
            "started_at": cycle.started_at,
            "completed_at": cycle.completed_at,
            "error_message": cycle.error_message,
            "config_snapshot": cycle.config_snapshot,
            "summary_text": summary.summary_text if summary else None,
            "item_count": total_items,
        }
        enriched_cycles.append(CycleResponse(**cycle_dict))

    return CycleListResponse(
        cycles=enriched_cycles,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{cycle_id}", response_model=CycleDetailResponse)
async def get_cycle(
    cycle_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific cycle.

    Includes:
    - Cycle metadata
    - Collected data summary
    - Full summary text
    """
    # Get cycle
    result = await db.execute(select(Cycle).where(Cycle.id == cycle_id))
    cycle = result.scalar_one_or_none()

    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    # Get collected data
    result = await db.execute(
        select(CollectedData).where(CollectedData.cycle_id == cycle_id)
    )
    collected_data = result.scalars().all()

    # Get summary
    result = await db.execute(
        select(Summary).where(Summary.cycle_id == cycle_id)
    )
    summary = result.scalar_one_or_none()

    # Build response
    return CycleDetailResponse(
        cycle=CycleResponse.model_validate(cycle),
        collected_data=[
            CollectedDataSummary(
                source_type=cd.source_type,
                source_name=cd.source_name,
                item_count=cd.item_count,
                data_size_bytes=cd.data_size_bytes,
                collection_time_ms=cd.collection_time_ms,
                data=cd.data,  # Include raw collected data
            )
            for cd in collected_data
        ],
        summary=SummarySummary.model_validate(summary) if summary else None,
        summary_text=summary.summary_text if summary else None,
    )


@router.delete("/{cycle_id}", status_code=204)
async def delete_cycle(
    cycle_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a cycle and all associated data.

    This cascades to collected_data and summaries tables.
    """
    result = await db.execute(select(Cycle).where(Cycle.id == cycle_id))
    cycle = result.scalar_one_or_none()

    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    await db.delete(cycle)
    await db.commit()

    logger.info(f"Deleted cycle {cycle_id}")
