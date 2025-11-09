from minio import Minio
import os
from minio.error import S3Error

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY","minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY","minioadmin")
BUCKET = os.getenv("MINIO_BUCKET","files")

client = Minio(
    endpoint = MINIO_ENDPOINT,
    access_key = MINIO_ACCESS_KEY,
    secret_key = MINIO_SECRET_KEY,
    secure = False
)

if not client.bucket_exists(BUCKET):
    client.make_bucket(BUCKET)
    
    
