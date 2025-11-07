from fastapi import FastAPI
import random

app = FastAPI()


@app.get("/hello")
def say_hello():
    return {
        "service":"Service 2",
        "message":"Hello from Services 2",
     }

@app.get("/health")
def health():
    if random.random() < 0.2:
        return {"status":"unhealthy"}, 500
    return {"status":"ok"}
    
    