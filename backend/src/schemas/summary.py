"""
Summary-related Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class SummaryResponse(BaseModel):
    """Summary response."""
    id: UUID
    cycle_id: UUID
    summary_text: str
    summary_word_count: Optional[int]
    llm_provider: Optional[str]
    model_name: Optional[str]
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    cost_usd: Optional[float]
    generation_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
