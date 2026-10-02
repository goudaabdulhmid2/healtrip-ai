# HealTrip AI Patient Decision Assistant

A healthcare navigation prototype for finding mock doctors and hospitals. It is not a diagnosis, booking, or real-time availability service. Provider records are synthetic assessment data.

## Architecture

```text
React + Vite → NestJS POST /chat → AgentService → LLMProvider (OpenRouter)
                                       ↓ tool request
                           AgentToolRegistry (allow-list)
                             ↙                 ↘
                     DoctorsService       HospitalsService
                             ↘                 ↙
                               Prisma → PostgreSQL
```

The backend owns safety checks, tool validation, database access, and structured provider facts. The model can request only `search_doctors` and `search_hospitals`; tools return selected fields without database IDs or free-text summaries. Hospital service filters require **all** requested services. The agent loop is bounded.

## Local setup

Requirements: Node.js, npm, and Docker Compose.

1. Start PostgreSQL from the repository root:

   ```bash
   docker compose up -d postgres
   ```

   PostgreSQL is available on host port **5433** (container port 5432).

2. Create `backend/.env` from `backend/.env.example`. Keep the database URL on port `5433`, set `OPENROUTER_API_KEY`, and set `CORS_ORIGIN` to the frontend origin if it differs from the default `http://localhost:5173`.

3. Install backend dependencies and prepare the database:

   ```bash
   cd backend
   npm install
   npx prisma generate --config prisma7.config.ts
   npx prisma migrate dev --config prisma7.config.ts
   npx prisma db seed --config prisma7.config.ts
   npm run start:dev
   ```

   The API listens on port 3000 by default. The seed contains mock records; use a clean assessment database when seeding because the current seed script is not idempotent for doctors and hospitals.

## Chat API

`POST http://localhost:3000/chat` accepts a bounded transcript. Only `user` and `assistant` roles are accepted; the final turn must be from the user. At most 20 turns are accepted, with content capped at 2,000 characters per turn.

```json
{
  "messages": [
    { "role": "user", "content": "I need a doctor" },
    { "role": "assistant", "content": "Which specialty and city?" },
    { "role": "user", "content": "Cardiology in Madinah" }
  ]
}
```

The response shape is `{ "message": "..." }`. The prior single-turn `{ "message": "..." }` request remains supported. The backend does not persist chat history; the client sends the bounded transcript each time.

## Safety and limitations

The backend uses a small deterministic English/Arabic red-flag check and returns immediate-care guidance without calling the LLM or search tools when a configured urgent pattern matches. This is not comprehensive triage and may not recognize every emergency. Do not use this prototype for clinical decisions. It does not provide emergency numbers, diagnosis, booking, prices, or real-time availability.

## Checks

From `backend/`:

```bash
npm run build
npm test -- --runInBand
npx prisma migrate status --config prisma7.config.ts
```

The API health endpoint is `GET /health`.
