import asyncio
import time
import httpx
from redis import asyncio as aioredis
from typing import List, Dict, Optional

from core.config import UPSTREAMS as DEFAULT_UPSTREAMS

##################    CONFIGURATION #############

REDIS_URL = "redis://localhost:6380"    
HEALTH_PATH = "/health"
HEALTH_CHECK_INTERVAL = 5
FAILURE_THRESHOLD = 3
CIRCUIT_BREAKER_TIMEOUT = 15 
CONNECTION_KEY_PREFIX = "up_conn:"        
HEALTH_KEY_PREFIX = "up_health:"         
FAIL_KEY_PREFIX = "up_fail:"             
LATENCY_KEY_PREFIX = "up_lat:" 




async def get_redis():
    return aioredis.from_url(
        REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


async def health_check_worker(upstream: List[str], stop_event: asyncio.Event):
    redis =  await get_redis()
    client = httpx.AsyncClient(timeout=3.0)
    
    async def _check(single_upstream: str):
      key_health = f"{HEALTH_KEY_PREFIX}{single_upstream}"
      key_faliure = f"{FAIL_KEY_PREFIX}{single_upstream}"
      key_lat = f"{LATENCY_KEY_PREFIX}{single_upstream}"
    
      try:
         start = time.time()
         r = await client.get(single_upstream.rstrip("/") + HEALTH_PATH)
         elapsed = (time.time() - start) * 1000.0
         if r.status_code == 200:
             await redis.set(key_health, "1")
             await redis.set(key_faliure,0)
             await redis.set(key_lat, f"{int(elapsed)}")
             return
         else:
             fail = await redis.incr(key_faliure)
             await redis.set(key_health,"0")
             return
    
      except Exception:
         fail = await redis.incr(key_faliure)
         await redis.set(key_health, "0")
         
         if int(fail) >= FAILURE_THRESHOLD:
             await redis.set(key_health, "0", ex=CIRCUIT_BREAKER_TIMEOUT)
             
         return
     
    while not stop_event.is_set():
        tasks = [ _check(u) for u in upstream ]
        await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.sleep(HEALTH_CHECK_INTERVAL)
        
async def select_upstream(upstreams: List[str]) -> Optional[str]:
    redis = await get_redis()
    healthy_upstreams = {}

    for u in upstreams:
        health_key = f"{HEALTH_KEY_PREFIX}{u}"
        conn_key = f"{CONNECTION_KEY_PREFIX}{u}"

        health_val = await redis.get(health_key)
        conn_val = await redis.get(conn_key) or "0"

        # consider healthy only if explicitly marked 1
        if health_val == "1":
            healthy_upstreams[u] = int(conn_val)

    # ✅ only choose among healthy upstreams
    if healthy_upstreams:
        selected = min(healthy_upstreams, key=healthy_upstreams.get)
        print(f"🟢 Selected healthy upstream: {selected}")
        return selected

    # ❌ if no healthy ones, fallback but log warning
    print("⚠️ All upstreams unhealthy! Using fallback...")
    return upstreams[0] if upstreams else None


async def incr_connection(upstream: str):
    redis = await get_redis()
    key = f"{CONNECTION_KEY_PREFIX}{upstream}"
    await redis.incr(key)
    
async def decr_connetion(upstream : str):
    redis = await get_redis()
    key = f"{CONNECTION_KEY_PREFIX}{upstream}"
    
    val = await redis.decr(key)
    if val is None:
        await redis.set(key, 0)
        
async def get_upstream_status(upstream: List[str]):
        redis = await get_redis()
        result = {}
        
        for u in upstream:
            health = await redis.get(f"{HEALTH_KEY_PREFIX}{u}") or "0"
            fail = await redis.get(f"{FAIL_KEY_PREFIX}{u}") or "0"
            lat = await redis.get(f"{LATENCY_KEY_PREFIX}{u}") or "0"
            conn = await redis.get(f"{CONNECTION_KEY_PREFIX}{u}") or "0"
            
            result[u] = {
            "health": int(health),
            "failures": int(fail),
            "latency_ms": int(lat),
            "connections": int(conn),
            }
            
        return result