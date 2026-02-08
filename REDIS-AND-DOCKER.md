# Running Redis and Docker for API Gateway

The API gateway uses **Redis** on port **6380** for rate limiting and load balancer health state.

---

## Option 1: Redis with Docker (recommended)

### Prerequisites

- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) installed and running.

### Start Redis

From the project root:

```powershell
cd "d:\asus desktop\Software\practise projects\api-gateway"
docker compose up -d
```

- Redis will listen on **localhost:6380** (matching the gateway config).
- To view logs: `docker compose logs -f redis`
- To stop: `docker compose down`

### Verify Redis is running

```powershell
docker compose ps
```

Or test with Redis CLI (if installed) or from another container:

```powershell
docker compose exec redis redis-cli ping
```

You should see: `PONG`.

---

## Option 2: Redis without Docker (Windows)

### Install Redis on Windows

1. **WSL2 (recommended)**  
   - Install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) and a Linux distro.  
   - Inside WSL: `sudo apt update && sudo apt install redis-server`  
   - Start: `redis-server`  
   - By default Redis uses port 6379. Your app expects **6380**, so either:
     - Run: `redis-server --port 6380`, or  
     - Change `REDIS_URL` in the gateway to `redis://localhost:6379` (in `core/rate_limiter.py` and `core/balancer.py`).

2. **Native Windows**  
   - Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases) (older, not officially supported).  
   - Or use [Memurai](https://www.memurai.com/) (Redis-compatible on Windows).  
   - Configure or run the server so it listens on port **6380** (or update the gateway to use 6379 as above).

---

## Check messages / data in Redis

### Option A: Python script (recommended)

From the **project root** (with Redis and gateway env):

```powershell
cd "d:\asus desktop\Software\practise projects\api-gateway"
pip install redis
python backend/gateway/scripts/check_redis.py
```

Or from `backend/gateway`:

```powershell
cd backend\gateway
pip install redis
python scripts/check_redis.py
```

This prints all gateway-related keys:

- **rate_limit:\*** – per-user request count and TTL (resets in Xs)
- **up_health:\*** – upstream health (1 = healthy)
- **up_conn:\*** – active connections per upstream
- **up_fail:\*** – failure count per upstream
- **up_lat:\*** – latency in ms per upstream

### Option B: redis-cli (raw commands)

If Redis is running in Docker:

```powershell
docker compose exec redis redis-cli
```

Then inside the CLI (Redis listens on 6379 inside the container):

```text
KEYS *
GET rate_limit:playground
TTL rate_limit:playground
GET up_health:http://localhost:7001
GET up_conn:http://localhost:7001
```

To connect from the host (e.g. if you have `redis-cli` installed and Redis on port 6380):

```powershell
redis-cli -p 6380
KEYS *
GET rate_limit:playground
```

---

## Quick reference

| Task              | Command (from project root)   |
|-------------------|-------------------------------|
| Start Redis       | `docker compose up -d`         |
| Stop Redis        | `docker compose down`         |
| View logs         | `docker compose logs -f redis`|
| Check status      | `docker compose ps`           |

After Redis is running on 6380, start the gateway and upstream services as described in the main run guide.
