import asyncio
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from core import balancer, config
from core.auth import verify_token

router = APIRouter()

@router.get("/admin/status")
async def get_gateway_status(request: Request):
    # 🔐 Verify token (non-blocking)
    try:
        payload = await asyncio.to_thread(verify_token, request)
    except HTTPException as e:
        raise e

    # 🔒 Admin-only access
    if payload.get("sub") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access")

    # 🩺 Fetch live upstream data
    status = await balancer.get_upstream_status(config.UPSTREAMS)

    # 🚀 Return live JSON
    return JSONResponse(
        content={"status": "ok", "data": status},
        headers={"Cache-Control": "no-store"}
    )
