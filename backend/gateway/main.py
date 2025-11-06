from fastapi import FastAPI, Request,Response
import httpx
import itertools

app = FastAPI(
    title="Intelligent API-Gateway",
    version="1.0",
)

upstream_servers = [
    "http://localhost:7001",  
    "http://localhost:7002",  
]


upstream_cycle = itertools.cycle(upstream_servers)


@app.api_route("/{path:path}",methods = ["GET","POST","PUT","PATCH","DELETE"])
async def proxy(path: str = "", request: Request=None):
    
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
        
    
    



