# Deploy This Whole Project (Free Tier)

Step-by-step guide to deploy **Frontend**, **API Gateway**, **Upstream Services**, and **Redis** for free.

---

## What You’ll Deploy

| # | Component      | Where (free)        | Purpose                          |
|---|----------------|---------------------|----------------------------------|
| 1 | **Redis**      | Upstash             | Rate limiting + load balancer    |
| 2 | **Service 1**  | Render (Web Service)| Upstream server 1                |
| 3 | **Service 2**  | Render (Web Service)| Upstream server 2                |
| 4 | **API Gateway**| Render (Web Service)| Auth, rate limit, load balance   |
| 5 | **Frontend**   | Vercel              | Next.js playground               |

**Order:** 1 → 2 & 3 → 4 → 5 (each step gives you URLs for the next).

---

## Step 1: Redis (Upstash)

1. Go to **[upstash.com](https://upstash.com)** → Sign up (free).
2. **Create Database** → choose a region → Create.
3. Open the database → copy **Redis URL** (looks like `rediss://default:xxxxx@xxx.upstash.io:6379`).
4. Save it somewhere; you’ll need it for the **API Gateway** in Step 4.

---

## Step 2: Deploy Upstream Service 1 (Render)

1. Go to **[render.com](https://render.com)** → Sign up (free).
2. **Dashboard** → **New +** → **Web Service**.
3. Connect your **GitHub** (or Git) repo and select the **api-gateway** repository.
4. Configure:
   - **Name:** `api-gateway-service-1` (or any name).
   - **Region:** Choose closest to you.
   - **Root Directory:** `backend/upstream_services/service_1`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Create Web Service**. Wait for the first deploy to finish.
6. Copy the service URL (e.g. `https://api-gateway-service-1-xxxx.onrender.com`). You’ll use it in Step 4.

---

## Step 3: Deploy Upstream Service 2 (Render)

1. **New +** → **Web Service** again.
2. Same repo, but:
   - **Name:** `api-gateway-service-2`
   - **Root Directory:** `backend/upstream_services/service_2`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Create Web Service** → wait for deploy.
4. Copy the service URL (e.g. `https://api-gateway-service-2-xxxx.onrender.com`).

---

## Step 4: Deploy API Gateway (Render)

1. **New +** → **Web Service**.
2. Same repo:
   - **Name:** `api-gateway`
   - **Root Directory:** `backend/gateway`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment** (Add Environment Variable):
   - **Key:** `REDIS_URL`  
     **Value:** your Upstash Redis URL from Step 1.
   - **Key:** `UPSTREAM_URLS`  
     **Value:** Service 1 and Service 2 URLs, comma-separated, **no spaces**  
     Example: `https://api-gateway-service-1-xxxx.onrender.com,https://api-gateway-service-2-xxxx.onrender.com`
4. **Create Web Service** → wait for deploy.
5. Copy the **gateway URL** (e.g. `https://api-gateway-xxxx.onrender.com`). You’ll use it in Step 5.

---

## Step 5: Deploy Frontend (Vercel)

1. Go to **[vercel.com](https://vercel.com)** → Sign up (free, e.g. with GitHub).
2. **Add New** → **Project** → Import your **api-gateway** repo.
3. Configure:
   - **Root Directory:** click **Edit** → set to `frontend` (so only the Next.js app is built).
   - **Framework Preset:** Next.js (auto-detected).
4. **Environment Variables** → Add:
   - **Name:** `NEXT_PUBLIC_API_GATEWAY_URL`
   - **Value:** your API Gateway URL from Step 4 (e.g. `https://api-gateway-xxxx.onrender.com`)
   - (No spaces; use `https://`)
5. **Deploy**. Wait for the build to finish.
6. Open the Vercel URL (e.g. `https://your-project.vercel.app`). Open **/api-gateway** to use the playground.

---

## Checklist

- [ ] **Step 1:** Upstash Redis created → Redis URL copied.
- [ ] **Step 2:** Render Web Service for `backend/upstream_services/service_1` → Service 1 URL copied.
- [ ] **Step 3:** Render Web Service for `backend/upstream_services/service_2` → Service 2 URL copied.
- [ ] **Step 4:** Render Web Service for `backend/gateway` with `REDIS_URL` and `UPSTREAM_URLS` → Gateway URL copied.
- [ ] **Step 5:** Vercel project with root `frontend` and `NEXT_PUBLIC_API_GATEWAY_URL` → Frontend deployed.

---

## After Deployment

- **Playground:** `https://your-app.vercel.app/api-gateway`
- **Gateway API docs:** `https://api-gateway-xxxx.onrender.com/docs`
- **Rate limit:** 3 requests per 30 seconds per user (enforced by the gateway).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Playground says "Backend not configured" | Set `NEXT_PUBLIC_API_GATEWAY_URL` in Vercel and redeploy. |
| 502 from gateway | Check Render logs for the gateway; ensure `UPSTREAM_URLS` is correct and both services are running. |
| 429 Too many requests | Normal: rate limit. Wait ~30 seconds or use a different username when logging in. |
| CORS errors | The gateway already has CORS enabled for all origins; if you restricted it, allow your Vercel domain. |

---

## Local development (no deploy)

See the “Local development” section in this repo’s main README or run:

**Bash / Git Bash / WSL:**
- **Redis:** `docker compose up -d`
- **Gateway:** `cd backend/gateway && uvicorn main:app --reload --port 8000`
- **Service 1:** `cd backend/upstream_services/service_1 && uvicorn main:app --reload --port 7001`
- **Service 2:** `cd backend/upstream_services/service_2 && uvicorn main:app --reload --port 7002`
- **Frontend:** `cd frontend && echo "NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000" > .env.local && npm run dev`

**PowerShell (Windows):** Use `;` instead of `&&` to avoid "The token '&&' is not a valid statement separator":
- **Redis:** `docker compose up -d`
- **Gateway:** `cd backend/gateway; uvicorn main:app --reload --port 8000`
- **Service 1:** `cd backend/upstream_services/service_1; uvicorn main:app --reload --port 7001`
- **Service 2:** `cd backend/upstream_services/service_2; uvicorn main:app --reload --port 7002`
- **Frontend:** `cd frontend; npm run dev` (set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` in `frontend\.env.local` first if needed)

Then open **http://localhost:3000/api-gateway**.
