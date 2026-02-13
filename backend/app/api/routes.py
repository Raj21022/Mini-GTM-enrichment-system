import csv
from io import StringIO
from uuid import UUID

import redis
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from rq import Queue
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Company, Job
from app.db.session import get_db
from app.schemas.enrichment import CompanyOut, JobOut

router = APIRouter(prefix="/api/v1", tags=["enrichment"])
redis_conn = redis.from_url(settings.redis_url)
queue = Queue("enrichment", connection=redis_conn)


@router.post("/uploads", response_model=JobOut)
async def upload_csv(
    file: UploadFile = File(...),
    org_id: str = Form(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    payload = (await file.read()).decode("utf-8")
    rows = _extract_domains(payload)
    if not rows:
        raise HTTPException(status_code=400, detail="No domains found in CSV")

    job = Job(org_id=org_id, filename=file.filename, status="queued", total=len(rows))
    db.add(job)
    db.flush()

    for domain in rows:
        company = Company(job_id=job.id, domain=domain, status="queued")
        db.add(company)

    db.commit()
    db.refresh(job)

    company_ids = db.scalars(select(Company.id).where(Company.job_id == job.id)).all()
    for company_id in company_ids:
        queue.enqueue("app.workers.tasks.process_company", str(company_id))

    return job


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.scalar(select(Job).where(Job.id == job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/companies", response_model=list[CompanyOut])
def get_companies(job_id: UUID, db: Session = Depends(get_db)):
    job = db.scalar(select(Job).where(Job.id == job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return db.scalars(select(Company).where(Company.job_id == job_id).order_by(Company.domain.asc())).all()


def _extract_domains(csv_text: str) -> list[str]:
    reader = csv.DictReader(StringIO(csv_text))
    if "domain" not in (reader.fieldnames or []):
        return []

    domains: list[str] = []
    for row in reader:
        domain = (row.get("domain") or "").strip().lower()
        if domain:
            domains.append(domain)
    return domains
