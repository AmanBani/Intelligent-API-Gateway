from fastapi import FastAPI

app = FastAPI()


@app.get("/hello")
def say_hello():
    return {
        "service":"Service 2",
        "message":"Hello from Services 2",
     }
    
    
    