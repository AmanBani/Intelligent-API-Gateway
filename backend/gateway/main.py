import httpx
import itertools

from fastapi import FastAPI, Request,Response, HTTPException
from core.rate_limiter import rate_limiter
from routes.public_routes import router as public_router
from core.auth import verify_token




app = FastAPI(
    title="Intelligent API-Gateway",
    version="1.0",
)

app.include_router(public_router)

upstream_servers = [
    "http://localhost:7001",  
    "http://localhost:7002",  
]


upstream_cycle = itertools.cycle(upstream_servers)


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
    
    upstream = next(upstream_cycle)
    if path == "":
        trarget_url = upstream
    else:
        trarget_url = f"{upstream}/{path.lstrip('/')}"
    

    
    body = await request.body()
    headers = dict(request.headers)
    
    try:
        async with httpx.AsyncClient() as client:
        
            resp = await client.request(
                method=request.method,
                url=trarget_url,
                headers=headers,
                content=body,
                timeout=10.0,
            )
            return Response(
                content = resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers)
            )
            
    except httpx.RequestError as e:
            return Response (
                content= f"Upstream Error : {str(e)}",
                status_code=502
            )
        
    
    



