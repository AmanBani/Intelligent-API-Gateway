from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid, os
from .db import get_bd,Base, engine
from ..models.file import File as FileModel
from .storage import client, BUCKET
from sqlalchemy.orm import Session
import aioredis
import asyncio


Base.metadata.create(bind=engine)

app = FastAPI(title="Distributed File Storage -Demo")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis = None

@app.on_event("startup")
async def startup():
    global redis
    redis = await aioredis.from_url(REDIS_URL)
    
class StartUploadResponse(BaseModel):
    upload_id : str
    chunc_size :int

@app.post("/start-upload", response_model=StartUploadResponse)
async def start_upload(filename: str = Form(...), size: int = Form(...), chunck_size: int = Form(5_000_000), db:Session = Depends(get_bd)):
    upload_id = str(uuid.uuid4())
    
    await redis.hset(f"Upload: {upload_id}", mapping={
        "filename" : filename,
        "size": size,
        "chunk_size": chunck_size,
        "received": 0
    })
    
    await redis.sadd(f"Upload : {upload_id}:chunks", *[])
    return {"upload_id": upload_id, "chunk_size": chunck_size}

@app.post("/upload-chunk")
async def upload_chunk(upload_id: str = Form(...), index: int = Form)
    key = f"uploads/{upload_id}/chunk_{index}"
    date = await chunk.read()
    client.put_object(BUCKET, key,data, )
    
    
@app.post("/complete-upload")
async def complete_upload(upload_id: str = Form(...), db: Session = Depends(get_bd)):
    
    meta = await redis.hgetall(f"Upload : {upload_id}")
    if not meta:
        raise HTTPException(status_code= 404, detail= "Upload Session Not Found")
    
    filename = meta[b"filename"].decode()
    chunk_keys = await redis.smembers(f"Upload : {upload_chunk}:chunks")
    indexes = sorted([int(x.decode()) for x in chunk_keys])
    if not indexes:
        raise HTTPException(status_code=400, detail="No Chunks Uploaded")
    final_key = f"files/{upload_id}/{filename}"
    
    
    