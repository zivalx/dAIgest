"""
CollectedData model - stores raw data from connectors library.
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from .base import Base, GUID


class CollectedData(Base):
    """
    Raw collected data from a single source during a cycle.

    Data column contains the raw output from connectors library (Pydantic model as dict).
    """
    __tablename__ = "collected_data"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    cycle_id = Column(GUID(), ForeignKey("cycles.id", ondelete="CASCADE"), nullable=False)

    # Source identification
    source_type = Column(String(50), nullable=False)  # "reddit", "youtube", etc.
    source_name = Column(String(255), nullable=True)  # subreddit name, channel name, etc.

    # Data storage
    data = Column(JSON, nullable=False)  # Raw connector output
    data_size_bytes = Column(Integer, nullable=True)  # Size tracking for monitoring

    # Collection metrics
    item_count = Column(Integer, nullable=True)  # Number of items collected
    collection_time_ms = Column(Integer, nullable=True)  # Collection duration

    # Timestamp
    collected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    cycle = relationship("Cycle", back_populates="collected_data")

    __table_args__ = (
        Index("idx_cycle_id", "cycle_id"),
        Index("idx_source_type", "source_type"),
    )

    def __repr__(self):
        return f"<CollectedData(id={self.id}, source_type={self.source_type}, source_name={self.source_name})>"
