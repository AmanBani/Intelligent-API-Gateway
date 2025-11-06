import aioredis
import time
from fastapi import Request, HTTPException

REDIS_URL=""

RATE_LIMIT = 3
WINDOW_SIZE = 30


async def get_redis():
    return await aioredis.from_url(REDIS_URL, encodinG="UTG-8",decode_response=True)

async def rate_limmiter(request: Request):
    redis = await get_redis()
    
    client_ip = request.client.host
    key = f"Rate Limmit : {client_ip}"
    
    current = await redis.get(key)
    
    if current is None:
        await redis.set(key,1,ex=WINDOW_SIZE)
        return
    
    current = int(current)
    if current >= RATE_LIMIT:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests , try again in {ttl} seconds"
        )
        
    await redis.incr(key)
    
    
    