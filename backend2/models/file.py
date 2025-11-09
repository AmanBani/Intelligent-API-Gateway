from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..app.db import Base


class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    size = Column(Integer)
    chunk_count = Column(Integer)
    minio_key = Column(String, unique=True, nullable=False)
    owner = Column(String, default="dev")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed = Column(Boolean, default=False)
    
    
