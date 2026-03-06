from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.osi_routes import router as osi_router

app = FastAPI(
    title="OSI System Architecture Simulator",
    version="1.0",
    description="Simulates how data is transformed across the 7 OSI layers",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(osi_router, prefix="/osi", tags=["OSI"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "osi-simulator"}
