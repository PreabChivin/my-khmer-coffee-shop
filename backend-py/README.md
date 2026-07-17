# BENCHIMIN CAFE — AI & Analytics Microservice (Python / FastAPI)

A **decoupled** Python sidecar to the main Next.js app. It reads the same
Postgres the Prisma app uses (read-only) and exposes three internal endpoints
for advanced analytics, recommendations, and chat moderation — the honest slots
where future Gen-Z AI features will live.

> ⚠️ **This service is NOT deployed by Vercel.** The Next.js app deploys to
> Vercel serverless, which cannot host a long-lived Uvicorn process. Run this
> locally or host it separately (Fly.io / Render / a container). The Next.js
> **bridge** routes (`app/api/ai/*`) fall back gracefully when this service is
> unreachable, so the main app never hard-depends on it.

## What it does NOT do

- Never writes to the database; never touches POS / order-transaction rows.
- Not a trained ML model — the analytics/recommend/moderation logic is
  deliberately transparent heuristics/placeholders that mirror the existing
  production TypeScript implementations, kept honest rather than a fake "AI".

## Architecture

```
Next.js (Vercel)                         Python sidecar (local / separate host)
─────────────────                        ─────────────────────────────────────
app/api/ai/health   ──┐
app/api/ai/predict  ──┤  X-Internal-      GET  /health            (public)
app/api/ai/recommend──┤  Api-Key   ─────► GET  /api/v1/analytics/predict
app/api/ai/moderate ──┘  (shared secret)  POST /api/v1/ai/recommend
   (server-side only,                     POST /api/v1/chat/moderate
    each also auth-gated)                        │
                                                 ▼
                                          Postgres (read-only, shared)
```

Security: every `/api/v1/*` route requires the `X-Internal-Api-Key` header to
equal `API_SECRET` (constant-time compare). The public internet can't reach the
pipeline — only the server-side Next.js bridge, which knows the secret, can.

## Endpoints

| Method | Path                        | Auth        | Purpose |
|--------|-----------------------------|-------------|---------|
| GET    | `/health`                   | public      | Liveness + `db_connected` flag |
| GET    | `/api/v1/whoami`            | api-key     | Handshake smoke test |
| GET    | `/api/v1/analytics/predict` | api-key     | 7-day PAID-revenue moving-average trend |
| POST   | `/api/v1/ai/recommend`      | api-key     | Order-history coffee suggestions (`{user_id, limit}`) |
| POST   | `/api/v1/chat/moderate`     | api-key     | Flags risky chat text (`{text}`) |

## Run locally

```bash
cd backend-py
python -m venv .venv
.venv/Scripts/activate            # Windows  (source .venv/bin/activate on *nix)
pip install -r requirements.txt
cp .env.example .env              # then fill DATABASE_URL + API_SECRET
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs — health: http://localhost:8000/health

Then, in the repo root `.env.local` (or Next.js host env), set:

```
PYTHON_AI_SERVICE_URL=http://localhost:8000
PYTHON_AI_SERVICE_SECRET=<same value as backend-py API_SECRET>
```

With those set, the Next.js `app/api/ai/*` bridge routes proxy to this service.
Without them (e.g. current Vercel prod), the bridge degrades gracefully.
