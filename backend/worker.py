import redis
from rq import Worker

from app.core.config import settings


if __name__ == "__main__":
    connection = redis.from_url(settings.redis_url)
    worker = Worker(["enrichment"], connection=connection)
    worker.work()
