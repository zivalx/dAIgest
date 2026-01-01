"""
Cycle-related Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID


class CycleSourceSpec(BaseModel):
    """Specification for a single source in a cycle."""
    source_type: str = Field(..., description="Type of source (reddit, youtube, etc.)")
    config_id: Optional[UUID] = Field(None, description="ID of source config to use")
    credential_ref: str = Field(..., description="Credential reference (env var prefix)")
    collect_spec: Dict[str, Any] = Field(..., description="Collection specification")


class CycleCreate(BaseModel):
    """Request to create a new cycle."""
    name: Optional[str] = Field(None, description="User-friendly name for this cycle")
    sources: List[CycleSourceSpec] = Field(..., description="Sources to collect from")
    timeframe_days: int = Field(1, description="Number of days back to collect (1-7)", ge=1, le=7)
    llm_provider: str = Field("openai", description="LLM provider (openai, anthropic)")
    llm_model: str = Field("gpt-4o-mini", description="Model name")
    custom_prompt: Optional[str] = Field(None, description="Custom summarization prompt")


class CycleResponse(BaseModel):
    """Basic cycle information."""
    id: UUID
    name: Optional[str]
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    config_snapshot: Optional[Dict[str, Any]] = None
    summary_text: Optional[str] = None
    item_count: Optional[int] = None

    class Config:
        from_attributes = True


class CycleListResponse(BaseModel):
    """Paginated list of cycles."""
    cycles: List[CycleResponse]
    total: int
    page: int
    page_size: int


class CollectedDataSummary(BaseModel):
    """Summary of collected data for a cycle."""
    source_type: str
    source_name: Optional[str]
    item_count: int
    data_size_bytes: Optional[int]
    collection_time_ms: Optional[int]
    data: Optional[List[Dict[str, Any]]] = None  # Raw collected data


class SummarySummary(BaseModel):
    """Summary information (not full text)."""
    id: UUID
    summary_word_count: Optional[int]
    llm_provider: Optional[str]
    model_name: Optional[str]
    output_tokens: Optional[int]
    cost_usd: Optional[float]
    generation_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class CycleDetailResponse(BaseModel):
    """Detailed cycle information with collected data and summary."""
    cycle: CycleResponse
    collected_data: List[CollectedDataSummary]
    summary: Optional[SummarySummary] = None
    summary_text: Optional[str] = None  # Full summary text
