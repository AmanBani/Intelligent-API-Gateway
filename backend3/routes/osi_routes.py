from fastapi import APIRouter

from core.osi_simulator import simulate_encapsulation, get_summary
from models.schemas import SimulateRequest, SimulateResponse

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
async def simulate(request: SimulateRequest):
    """Simulate data flow through the 7 OSI layers (encapsulation)."""
    protocol = (request.protocol or "http").lower()
    if protocol not in ("http", "https", "smtp"):
        protocol = "http"

    layers = simulate_encapsulation(request.message, protocol)
    summary = get_summary(layers, request.message)

    return SimulateResponse(layers=layers, summary=summary)


@router.get("/layers")
async def get_layers_info():
    """Reference info for each OSI layer."""
    return {
        "layers": [
            {"layer": 7, "name": "Application", "examples": "HTTP, FTP, SMTP"},
            {"layer": 6, "name": "Presentation", "examples": "SSL/TLS, compression"},
            {"layer": 5, "name": "Session", "examples": "RPC, NetBIOS"},
            {"layer": 4, "name": "Transport", "examples": "TCP, UDP"},
            {"layer": 3, "name": "Network", "examples": "IP, ICMP"},
            {"layer": 2, "name": "Data Link", "examples": "Ethernet, WiFi"},
            {"layer": 1, "name": "Physical", "examples": "Cables, radio"},
        ]
    }
