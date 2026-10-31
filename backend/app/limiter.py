from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url if settings.environment == "production" else "memory://",
    default_limits=["300/minute"],
)
