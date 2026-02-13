import time
from uuid import UUID

from sqlalchemy import select

from app.db.models import Company, Job
from app.db.session import SessionLocal
from app.services.explorium_client import ExploriumClient


def process_job_companies(job_id: str) -> None:
    job_uuid = UUID(job_id)

    db = SessionLocal()
    try:
        job = db.scalar(select(Job).where(Job.id == job_uuid))
        if job is None:
            return

        job.status = "running"
        db.commit()

        company_ids = db.scalars(select(Company.id).where(Company.job_id == job_uuid)).all()
    finally:
        db.close()

    for company_id in company_ids:
        process_company(str(company_id))


def process_company(company_id: str) -> None:
    company_uuid = UUID(company_id)
    db = SessionLocal()
    try:
        company = db.scalar(select(Company).where(Company.id == company_uuid))
        if company is None:
            return

        company.status = "processing"
        db.commit()

        client = ExploriumClient()
        max_attempts = 3

        for attempt in range(1, max_attempts + 1):
            try:
                data = client.enrich(company.domain)
                company.industry = data["industry"]
                company.company_size = data["company_size"]
                company.revenue_range = data["revenue_range"]
                company.status = "done"
                company.error = None
                db.commit()
                _update_job_counters(db, company.job_id, failed=False)
                return
            except Exception as exc:
                if attempt == max_attempts:
                    company.status = "failed"
                    company.error = str(exc)[:500]
                    db.commit()
                    _update_job_counters(db, company.job_id, failed=True)
                else:
                    time.sleep(2 * attempt)
    finally:
        db.close()


def _update_job_counters(db, job_id: UUID, failed: bool) -> None:
    job = db.scalar(select(Job).where(Job.id == job_id))
    if job is None:
        return

    job.processed += 1
    if failed:
        job.failed += 1

    if job.processed >= job.total:
        job.status = "failed" if job.failed else "done"
    else:
        job.status = "running"

    db.commit()
