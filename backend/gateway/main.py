import httpx
import itertools

from fastapi import FastAPI, Request,Response, HTTPException
from core.rate_limiter import rate_limiter
from routes.public_routes import router as public_router
from core.auth import verify_token
from core import balancer

import asyncio
from typing import List, Dict, Optional

from routes.admin_routes import router as admin_router
from core.config import UPSTREAMS as upstream_servers



app = FastAPI(
    title="Intelligent API-Gateway",
    version="1.0",
)

app.include_router(public_router)
app.include_router(admin_router)





upstream_cycle = itertools.cycle(upstream_servers)

_health_worker_stop: Optional[asyncio.Event] = None
_health_worker_task: Optional[asyncio.Task] = None


@app.on_event("startup")
async def startup_event():
    global _health_worker_stop, _health_worker_task
    _health_worker_stop = asyncio.Event()
    _health_worker_task = asyncio.create_task(balancer.health_check_worker(upstream_servers, _health_worker_stop))
    print("HEALTH CHECKING WORKER STARTED")


@app.on_event("shutdown")
async def shutdowm_event():
    global _health_worker_stop, _health_worker_task
    if _health_worker_stop:
        _health_worker_stop.set()
    if _health_worker_task:
        await _health_worker_task
    print("HEALTH CHECK WORKER STOPPED")

@app.api_route("/{path:path}",methods = ["GET","POST","PUT","PATCH","DELETE"])
async def proxy(path: str = "", request: Request=None):
    
    # JWT Authtentication
    try:
        user_paylod = verify_token(request)
    except HTTPException as e:
        return Response(content=e.detail, status_code=e.status_code)
    
    # Rate Limiter
    try:
        await rate_limiter(request)
    except HTTPException as e:
        return Response(content=e.detail, status_code=e.status_code)
    
    upstream = await balancer.select_upstream(upstream_servers)
    if not upstream:
        return Response(content="No upstream avilable", status_code=502)
    
    if path == "":
        target_url = upstream
    else:
        target_url = f"{upstream}/{path.lstrip('/')}"
    

    
    body = await request.body()
    headers = dict(request.headers)
    
    await balancer.incr_connection(upstream)

    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=await request.body(),
                timeout=15.0
            )
        return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))
    except httpx.RequestError as e:
     
        redis = await balancer.get_redis()
        await redis.incr(f"{balancer.FAIL_KEY_PREFIX}{upstream}")
        return Response(content=f"Upstream error: {e}", status_code=502)
    
    finally:
        
        try:
            await balancer.decr_connection(upstream)
        except Exception:
            pass
        
    
    



