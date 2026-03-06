# OSI System Architecture Simulator (Backend 3)

Simulates how data is encapsulated across the 7 OSI layers.

## Run

```bash
cd backend3
pip install -r requirements.txt
uvicorn main:app --reload --port 8003
```

API: http://localhost:8003
- `POST /osi/simulate` - Simulate message through layers
- `GET /osi/layers` - Layer reference info
