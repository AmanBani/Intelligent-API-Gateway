from fastapi import FastAPI
import random

app = FastAPI()


@app.get("/hello")
def say_hello():
    return {
        "service":"Service 1",
        "message":"Hello from Serivices" 
        }

@app.get("/health")
def health():
    if random.random() < 0.0:
        return {"status":"unhealthy"}, 500
    return {"status":"ok"}