from fastapi import FastAPI

app = FastAPI()


@app.get("/hello")
def say_hello():
    return {
        "service":"Service 1",
        "message":"Hello from Serivices" 
        }
    