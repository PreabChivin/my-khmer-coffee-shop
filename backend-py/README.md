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

## One-command local run (recommended)

From the **repo root**, once the venv above exists:

```bash
npm run dev:all
```

This boots Next.js **and** Uvicorn together (prefixed `[next]` / `[uvicorn]`
output, one Ctrl-C stops both). Add the two `PYTHON_AI_SERVICE_*` vars to
`.env.local` first, and the Admin dashboard's **Hybrid AI Service** card
flips from *Offline* to **⚡ ONLINE — Hybrid AI Active** on its own within
~20s (it live-polls `/api/ai/health`). `npm run dev:py` runs just the sidecar.

## Making it ONLINE in production (the only remaining steps)

The Vercel deployment shows **Offline** on purpose: Vercel is serverless and
**cannot** run a long-lived Uvicorn process. Nothing in the code is missing —
to light it up in prod you host this service somewhere persistent and point
Next.js at it:

1. **Deploy `backend-py/` to a host that runs a process** — Fly.io, Render,
   Railway, or any container platform. Command: `uvicorn app.main:app
   --host 0.0.0.0 --port $PORT`.
2. On that host set `DATABASE_URL` (your real `POSTGRES_URL_NON_POOLING`,
   from Vercel → Storage → Postgres → `.env.local` tab) and a strong
   `API_SECRET` (`openssl rand -hex 32`).
3. In **Vercel → Project → Settings → Environment Variables** add
   `PYTHON_AI_SERVICE_URL=https://<your-python-host>` and
   `PYTHON_AI_SERVICE_SECRET=<same value as the host's API_SECRET>`, then
   redeploy.

The dashboard card then flips to ONLINE automatically — no code change.
