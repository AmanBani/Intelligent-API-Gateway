from redis import asyncio as aioredis
from fastapi import Request, HTTPException
from core.auth import verify_token


# Redis connection URL
REDIS_URL = "redis://localhost:6380"

# Limit settings
RATE_LIMIT = 3       # max number of requests
WINDOW_SIZE = 30     # seconds before reset




# 🔹 Create Redis connection
async def get_redis():
    return aioredis.from_url(
        REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


# 🔹 Rate limiter logic
async def rate_limiter(request: Request):
    redis = await get_redis()

    # Identify client (IP-based)
    payload = verify_token(request)
    user = payload.get("sub", request.client.host)
    key = f"rate_limit:{user}"   # clean Redis key, no spaces

    # Check current counter
    current = await redis.get(key)

    if current is None:
        # First request → initialize count and expiry
        await redis.set(key, 1, ex=WINDOW_SIZE)
        return

    current = int(current)

    if current >= RATE_LIMIT:
        # Too many requests → block temporarily
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail=f" Too many requests. Try again in {ttl} seconds."
        )

    # Increment request count
    await redis.incr(key)
