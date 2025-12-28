"""
Summary model - stores LLM-generated summaries.
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, CHAR
import uuid

from .base import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type - uses PostgreSQL UUID or SQLite CHAR(32)."""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value).hex
            else:
                return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


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
