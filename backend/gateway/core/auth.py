import jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException


SECRET_KEY = "amanbani1308"
ALGORITHIM = "HS256"


TOKEN_EXPEIRY_TIME = 30


def create_jwt_token(data : dict):
    to_encode = data.copy()
    expire = datetime.utcnow()+ timedelta(minutes=TOKEN_EXPEIRY_TIME)
    to_encode.update({"exp":expire})
    
    encode_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHIM)
    return encode_jwt


def verify_token(request: Request):
    auth_header =  request.headers.get("Authorization")
    
    
    if not auth_header or not auth_header.startswith("Bearer"):
        raise HTTPException(status_code=401, detail="Missing or Invalid Authoe")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHIM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")