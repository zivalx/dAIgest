"""
Summary model - stores LLM-generated summaries.
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from .base import Base, GUID


class Summary(Base):
    """
    LLM-generated summary for a cycle.

    Tracks cost, token usage, and model information for analytics and cost attribution.
    """
    __tablename__ = "summaries"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    cycle_id = Column(GUID(), ForeignKey("cycles.id", ondelete="CASCADE"), nullable=False)

    # Summary content
    summary_text = Column(Text, nullable=False)
    summary_word_count = Column(Integer, nullable=True)

    # LLM tracking
    llm_provider = Column(String(50), nullable=True)  # "openai", "anthropic", etc.
    model_name = Column(String(100), nullable=True)  # "gpt-4o-mini", "claude-sonnet-4", etc.

    # Token usage
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)

    # Cost tracking
    cost_usd = Column(Numeric(10, 4), nullable=True)  # Cost in USD (4 decimal places)

    # Performance
    generation_time_ms = Column(Integer, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    cycle = relationship("Cycle", back_populates="summaries")

    __table_args__ = (
        Index("idx_summary_cycle_id", "cycle_id"),
        Index("idx_summary_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Summary(id={self.id}, provider={self.llm_provider}, model={self.model_name})>"
