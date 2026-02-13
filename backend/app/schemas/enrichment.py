from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class JobOut(BaseModel):
    id: UUID
    org_id: str
    filename: str
    status: str
    total: int
    processed: int
    failed: int

    model_config = {"from_attributes": True}


class CompanyOut(BaseModel):
    id: UUID
    job_id: UUID
    domain: str
    industry: str | None
    company_size: str | None
    revenue_range: str | None
    status: Literal["queued", "processing", "done", "failed"]
    error: str | None

    model_config = {"from_attributes": True}
