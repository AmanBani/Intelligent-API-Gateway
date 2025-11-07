from fastapi import APIRouter
from core.auth import create_jwt_token

router = APIRouter()

@router.post("/login")
def login(username: str):
    
    token = create_jwt_token({"sub":username})
    return {"access_token":token, "token_type":"bearer"}

