"""
SourceConfig-related Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID


class SourceConfigCreate(BaseModel):
    """Request to create a source configuration."""
    name: str = Field(..., description="User-friendly name")
    source_type: str = Field(..., description="Type: reddit, youtube, telegram, twitter, gnews, pytrends")
    credential_ref: str = Field(..., description="Credential reference (env var prefix)")
    collect_spec: Dict[str, Any] = Field(..., description="Collection specification")
    enabled: bool = Field(True, description="Whether this config is enabled")


class SourceConfigUpdate(BaseModel):
    """Request to update a source configuration."""
    name: Optional[str] = None
    credential_ref: Optional[str] = None
    collect_spec: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None


class SourceConfigResponse(BaseModel):
    """Source configuration response."""
    id: UUID
    name: str
    source_type: str
    credential_ref: str
    collect_spec: Dict[str, Any]
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
