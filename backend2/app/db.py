from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL","")

engine = create_engine(DATABASE_URL, echos= False)
SessionLocal = sessionmaker(autoflush=False, bind=engine)
Base = declarative_base()


def get_bd():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        