import os

# Dynamic: load upstreams from env so deployment can attach to any backend.
# Example: UPSTREAM_URLS=http://localhost:7001,http://localhost:7002
_ENV_UPSTREAMS = os.getenv("UPSTREAM_URLS", "").strip()
if _ENV_UPSTREAMS:
    UPSTREAMS = [u.strip() for u in _ENV_UPSTREAMS.split(",") if u.strip()]
else:
    UPSTREAMS = [
        "http://localhost:7001",
        "http://localhost:7002",
    ]
