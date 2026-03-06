from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message to send through OSI layers")
    protocol: str = Field(default="http", description="Protocol (http, https, smtp)")
    direction: str = Field(default="down", description="Encapsulation direction: down or up")


class LayerInfo(BaseModel):
    layer: int
    name: str
    data: str
    headers_added: dict | None
    description: str


class SimulateResponse(BaseModel):
    layers: list[LayerInfo]
    summary: dict
