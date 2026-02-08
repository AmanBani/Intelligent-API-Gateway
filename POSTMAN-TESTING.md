# Testing API Gateway with Postman

This guide walks you through testing all API Gateway endpoints and verifying they return data correctly.

---

## Prerequisites

- **Gateway** running: `http://localhost:8000` (from `backend/gateway`: `uvicorn main:app --reload`)
- **Upstream services** running: Service 1 on **7001**, Service 2 on **7002**
- **Redis** running (e.g. `docker compose up -d`)

---

## Base URL

| Service        | Base URL              |
|----------------|------------------------|
| API Gateway    | `http://localhost:8000` |

Use the gateway URL for all tests below (the gateway proxies to upstreams).

---

## 1. Get a JWT (Login) — no auth required

Most endpoints require a **Bearer token**. Get one by calling the login endpoint.

**Request:**

- **Method:** `POST`
- **URL:** `http://localhost:8000/login?username=testuser`
- **Headers:** None required
- **Body:** None

**Example:**

```
POST http://localhost:8000/login?username=testuser
```

**Expected response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

- Copy the `access_token` value; you will use it in the **Authorization** header for other requests.
- For **admin-only** endpoints, use: `POST http://localhost:8000/login?username=admin` and use that token.

---

## 2. API Gateway endpoints (with token)

### 2.1 Admin status (admin only)

Returns gateway and upstream health/status. **Only works when the token was created with `username=admin`.**

**Request:**

- **Method:** `GET`
- **URL:** `http://localhost:8000/admin/status`
- **Headers:**
  - `Authorization`: `Bearer <your_access_token>`
  - Use the token from **login with `username=admin`**.

**Expected response (200):**

```json
{
  "status": "ok",
  "data": {
    "http://localhost:7001": { ... },
    "http://localhost:7002": { ... }
  }
}
```

If you use a non-admin token: **403 Forbidden** with message that only admins can access.

---

### 2.2 Proxied upstream APIs (any valid user)

The gateway forwards requests to the upstream services (7001, 7002). Use the **same base URL** (`http://localhost:8000`) and add the path. You must send a valid **Bearer** token.

**Headers for all proxied requests:**

- `Authorization`: `Bearer <your_access_token>` (from login with any username, e.g. `testuser`)

---

#### GET /hello (proxied)

- **Method:** `GET`
- **URL:** `http://localhost:8000/hello`

**Expected response (200):**

```json
{
  "service": "Service 1",
  "message": "Hello from Serivices"
}
```

or (depending on load balancer):

```json
{
  "service": "Service 2",
  "message": "Hello from Services 2"
}
```

Call multiple times to see responses from different upstreams (load balancing).

---

#### GET /health (proxied)

- **Method:** `GET`
- **URL:** `http://localhost:8000/health`

**Expected response (200):**

```json
{
  "status": "ok"
}
```

---

## 3. Rate limiting (per user)

- Limit: **3 requests per 30 seconds** per user (user = `sub` in JWT).
- After the 4th request within the same 30s window, you get **429** and a message about rate limit.
- Wait ~30 seconds or use a different username (new token) to get more requests.

---

## 4. Quick checklist

| # | Request | Auth | Expected |
|---|---------|------|----------|
| 1 | `POST /login?username=testuser` | None | 200, `access_token` in body |
| 2 | `POST /login?username=admin` | None | 200, admin `access_token` |
| 3 | `GET /admin/status` | Bearer (admin token) | 200, `status`, `data` with upstreams |
| 4 | `GET /hello` | Bearer (any token) | 200, `service`, `message` |
| 5 | `GET /health` | Bearer (any token) | 200, `status: "ok"` |

---

## 5. Common issues

| Symptom | Cause | Fix |
|--------|--------|-----|
| 401 Missing or invalid auth | No or wrong `Authorization` header | Add `Authorization: Bearer <token>` |
| 403 Only admins can access | Non-admin token for `/admin/status` | Login with `?username=admin` and use that token |
| 429 rate limit | More than 3 requests in 30s for same user | Wait 30s or login with another username |
| 502 No upstream available | Upstreams (7001, 7002) or Redis down | Start upstream services and Redis |
| 502 Upstream error | Upstream not running or unreachable | Start service_1 and service_2 on 7001 and 7002 |

---

## 6. Import the Postman collection (optional)

A pre-built collection is in the project:

1. Open Postman → **Import** → **Upload Files**.
2. Select `api-gateway-postman-collection.json` from the project root.
3. After import, set collection variables (or use defaults):
   - `base_url`: `http://localhost:8000`
   - `token`: (leave empty; run **Login (user)** or **Login (admin)** first, then copy token into this variable for other requests).

You can also use the **Authorization** tab on the collection to set **Bearer Token** to `{{token}}` so all requests use it automatically after you set `token` once.
