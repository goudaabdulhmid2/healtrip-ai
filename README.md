# HealTrip AI Patient Decision Assistant

HealTrip AI is a prototype for healthcare care navigation. It lets a user describe what they are looking for, asks the language model to clarify missing information when needed, and searches the provider and hospital records through backend tools.

It is **not a medical diagnosis engine**, a clinical decision-support product, or a replacement for a qualified healthcare professional. Its purpose is to help users navigate the records available in the prototype dataset.

## Features

- React 19, TypeScript, and Vite chat interface with local conversation state, suggested prompts, loading/error/retry states, and a new-chat action.
- Arabic and English conversations. The system prompt directs the assistant to answer in the language of the latest user turn; the frontend detects message direction and renders Arabic RTL and English LTR.
- NestJS chat API backed by a bounded LLM tool-calling agent.
- PostgreSQL database accessed through Prisma and the PostgreSQL Prisma adapter.
- Two registered search tools: `search_doctors` and `search_hospitals`.
- Backend DTO validation and canonical specialty/service value checks before database searches.
- Whitelisted structured tool results for grounding provider and hospital responses.
- Coarse English/Arabic urgent-symptom pattern checks that can bypass the LLM and block routine searches.
- A local seed dataset with synthetic assessment records for doctors, hospitals, specialties, and hospital services.

The prototype does not implement authentication, appointments, booking, payments, real-time availability, provider ratings, or a diagnosis workflow.

## Architecture

```mermaid
flowchart TD
  U[User] --> FE[React frontend]
  FE -->|POST /chat| C[ChatController / ChatService]
  C --> A[AgentService]
  A --> S[SafetyGuard]
  S -->|routine| L[LLM_PROVIDER]
  S -->|urgent: canned guidance; no LLM/tools| R[Chat response]
  L -->|function call request| A
  A --> REG[AgentToolRegistry]
  REG --> DT[SearchDoctorsTool]
  REG --> HT[SearchHospitalsTool]
  DT --> DS[DoctorsService / SpecialtiesService]
  HT --> HS[HospitalsService / SpecialtiesService]
  DS --> P[PrismaService]
  HS --> P
  P --> DB[(PostgreSQL)]
  DB --> P
  P --> DS
  P --> HS
  DS --> DT
  HS --> HT
  DT --> A
  HT --> A
  A -->|tool results in next LLM turn| L
  L -->|final text| A
  A --> C
  C --> FE
  FE --> U
```

The LLM does not connect to PostgreSQL. It can request the function definitions supplied by the backend; `AgentToolRegistry` maps only the two registered names to implementations. Tool inputs are validated by backend DTOs, and tools call domain services that query through `PrismaService`. The tools return selected fields rather than raw Prisma records. The agent sends those results back to the LLM to produce the user-facing wording.

The main code paths are `backend/src/modules/chat`, `backend/src/modules/agent`, `backend/src/modules/doctors`, `backend/src/modules/hospitals`, `backend/src/modules/specialties`, and `backend/src/database`.

## Agent and safety flow

`ChatService` separates the latest user turn from earlier conversation turns and passes both to `AgentService`. The agent adds its system prompt and sends the conversation and the registered function definitions to the injected `LLM_PROVIDER` implementation.

The model can respond with natural-language text or request one or more tools. If it asks a question to clarify the request, that is ordinary assistant text; `ask_clarification` and `respond` are not separate registered tools or persisted action types. The executable tools are only `search_doctors` and `search_hospitals`. Tool calls and tool results are added to the LLM conversation, and the model is asked to continue. The loop permits at most three LLM/tool-call iterations; exceeding that limit returns an upstream error.

Before the LLM is called, `SafetyGuard` scans prior user turns and the current user message for a small list of configured English and Arabic red-flag patterns. A match returns immediate-care guidance directly and blocks both routine search tools and the LLM call for that turn. This is intentionally coarse pattern matching, not comprehensive triage; it may not recognize every emergency. The prompt also instructs the model not to diagnose and not to guess emergency numbers, but the backend guard is the enforcement boundary for the configured patterns.

## Registered tools

### `search_doctors`

- **Required:** canonical `specialty` code and `city` string.
- **Optional:** `hospital` name, `gender` (`MALE` or `FEMALE`), and `language` (`AR` or `EN`).
- **Validation:** `SearchDoctorsToolInputDto` trims inputs and normalizes the specialty code to uppercase; it validates gender/language values. `SearchDoctorsTool` confirms the specialty code exists. The city is matched case-insensitively against hospital city data; it is not a backend enum.
- **Query:** `DoctorsService` filters by specialty, city, and supplied optional preferences, then orders by years of experience descending. A hospital preference is matched against hospital names.
- **Returned fields:** `name`, `gender`, `languages`, `yearsOfExperience`, specialty codes, and related hospitals with `name`, `city`, and `department`.

### `search_hospitals`

- **Required:** `city` string.
- **Optional:** canonical `specialty` code and `services` from the `ServiceType` enum.
- **Validation:** `SearchHospitalsToolInputDto` trims city, uppercases the specialty code, and validates service enum values. If a specialty is provided, the tool confirms that its code exists.
- **Query:** `HospitalsService` matches city case-insensitively, optionally filters specialty, and requires **all** requested services to match. Results are ordered by hospital name.
- **Returned fields:** `name`, `city`, specialty codes, and service enum values.

The LLM receives semantic values such as `CARDIOLOGY` and `Madinah`; internal database IDs are not part of tool definitions or tool results. Tool results are whitelisted objects, not raw Prisma records. The free-text `summary` fields in the schema are not included in these tool outputs.

## Example data flow

For “I need a cardiologist in Madinah”:

1. The frontend sends the bounded transcript to `POST /chat`.
2. `ChatController` and `ChatService` validate and split the latest user turn from the history.
3. `AgentService` runs the safety check and, for a routine request, sends the prompt, conversation, and tool definitions to `LLM_PROVIDER`.
4. The LLM can request `search_doctors` with `specialty: "CARDIOLOGY"` and `city: "Madinah"`.
5. The backend validates the tool input, checks the specialty code, and calls `DoctorsService`.
6. `DoctorsService` queries through Prisma. The tool maps matching records to its selected structured fields.
7. `AgentService` returns the tool result to the LLM as a tool message; the LLM writes a concise response from that result.
8. The API returns `{ "message": "..." }`, and the frontend renders the text without transforming it into provider cards.

The LLM is instructed to use tool results as the factual source for provider and hospital claims. The backend allow-list, validation, and query results constrain this flow; the prompt by itself is not a security boundary.

## Database design

The source of truth is `backend/prisma/schema.prisma`.

```mermaid
erDiagram
  Doctor ||--o{ DoctorSpecialty : has
  Specialty ||--o{ DoctorSpecialty : classifies
  Doctor ||--o{ DoctorHospital : practices_at
  Hospital ||--o{ DoctorHospital : hosts
  Hospital ||--o{ HospitalSpecialty : offers
  Specialty ||--o{ HospitalSpecialty : classifies
  Hospital ||--o{ HospitalService : provides

  Doctor {
    String id PK
    String name
    Gender gender
    String[] languages
    Int yearsOfExperience
    String summary
  }
  Hospital {
    String id PK
    String name
    String city
    String summary
  }
  Specialty {
    String id PK
    String code UK
    String name
  }
  DoctorSpecialty {
    String doctorId PK
    String specialtyId PK
    Boolean isPrimary
  }
  DoctorHospital {
    String doctorId PK
    String hospitalId PK
    String department
  }
  HospitalSpecialty {
    String hospitalId PK
    String specialtyId PK
  }
  HospitalService {
    String hospitalId PK
    ServiceType service PK
  }
```

- `Doctor` stores a name, optional gender, language codes, optional experience, and an optional summary.
- `Hospital` stores a name, city string, and optional summary.
- `Specialty` provides a unique canonical `code` and a display `name`.
- `DoctorSpecialty` models the many-to-many doctor/specialty relationship and records `isPrimary`.
- `DoctorHospital` models the many-to-many doctor/hospital relationship and can record a department.
- `HospitalSpecialty` models the many-to-many hospital/specialty relationship.
- `HospitalService` associates a hospital with a controlled `ServiceType`: `EMERGENCY`, `ICU`, `RADIOLOGY`, `LABORATORY`, or `PHARMACY`.

The three join relationships use composite primary keys. The schema also defines explicit indexes on doctor name, hospital city/name, specialty name/code, and relationship/service lookup fields. Cities remain strings in this prototype; there is no separate city entity or subspecialty model. See the Prisma schema for the exact optionality, keys, indexes, and delete behavior.

## Safety, grounding, and limitations

- The product provides care-navigation guidance, not a diagnosis or clinical decision engine.
- Configured urgent patterns can bypass the LLM and routine provider/hospital search. Coverage is limited and has not been established as comprehensive clinical triage.
- Only registered backend tools can execute. DTOs validate tool-call arguments, and the specialty code is checked against the database.
- The LLM has no raw database access. Tool results expose selected structured fields and omit database IDs and free-text summaries.
- The system prompt instructs the model to avoid unsupported claims, including credentials, ratings, prices, availability, appointment details, booking, contact details, and diagnoses when the tools do not return them.
- Seed records are synthetic assessment data, not a live directory. There is no real-time availability lookup, booking, payment, authentication, or production clinical validation.
- Chat history lives in frontend React state and is sent with each request; neither the API nor database persists it. Refreshing the page or choosing **New Chat** clears the current transcript.

The prompt and tool contract also instruct the LLM to preserve meaningful request qualifiers (for example, pediatric care), to avoid substituting a broader specialty, and to say when no matching records are returned. These are prompt and data-grounding controls, not a guarantee that a model will never produce an incorrect response.

## Arabic and English

Users may enter Arabic, English, or mixed-language text. The backend prompt chooses the assistant response language from the latest user message and instructs the model to normalize supported specialties and cities to canonical tool values. The frontend determines text direction from the message script, sets `dir` on the page and individual bubbles, and uses `dir="auto"` for the composer. Arabic text is displayed RTL; English text is displayed LTR. This does not translate the interface controls.

## HTTP API

Only these application routes are implemented:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/chat` | Send a message or transcript to the assistant. |
| `GET` | `/health` | Return `{ "status": "ok", "service": "healtrip-api" }`. |

### `POST /chat`

The frontend uses the transcript shape. It contains 1–20 turns; each turn has role `user` or `assistant` and content up to 2,000 characters. For this shape, the last turn must be from the user. Unknown top-level or message fields are rejected by the global validation pipe.

```json
{
  "messages": [
    { "role": "user", "content": "I need a cardiologist in Madinah." },
    { "role": "assistant", "content": "Which doctor preferences matter to you?" },
    { "role": "user", "content": "A female doctor who speaks Arabic." }
  ]
}
```

Successful response:

```json
{ "message": "..." }
```

The API also retains a backward-compatible request shape `{ "message": "...", "history": [...] }`, where `history` can have up to 19 turns. The `messages` shape cannot be combined with `message` or `history`. Conversations are not stored server-side.

The Nest application defaults to port `3000`. CORS allows `http://localhost:5173` by default; `CORS_ORIGIN` can contain a comma-separated list of allowed origins. The frontend base URL is set with `VITE_API_BASE_URL` and defaults in code to `http://localhost:3000`.

## Repository structure

```text
healtrip-ai/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── database/                  # PrismaService and database module
│   │   ├── modules/
│   │   │   ├── agent/                 # AgentService, provider, safety, tools
│   │   │   ├── chat/                  # ChatController, ChatService, DTOs
│   │   │   ├── doctors/               # Doctor search service
│   │   │   ├── hospitals/             # Hospital search service
│   │   │   └── specialties/           # Specialty code lookup
│   │   ├── app.controller.ts          # GET /health
│   │   └── main.ts                    # CORS and global validation pipe
│   ├── .env.example
│   ├── package.json
│   └── prisma7.config.ts
├── frontend/
│   ├── src/api/chat.ts                # POST /chat client
│   ├── src/components/                # Header, messages, composer, prompts
│   ├── src/pages/ChatPage.tsx
│   ├── src/types/chat.ts
│   ├── .env.example
│   └── package.json
├── docker-compose.yml                 # Local PostgreSQL service
├── README.md
├── AI.md
└── DECISION_LOG.md
```

## Local setup

### Prerequisites

- Node.js and npm compatible with the versions declared in the lockfiles.
- Docker Compose.
- An API key and compatible LLM endpoint for the configured backend provider.

### 1. Start PostgreSQL

Run from the repository root:

```bash
docker compose up -d postgres
```

The compose service uses PostgreSQL 17 and publishes container port `5432` on host port `5433`. Its local development database name and username are `healtrip`; the compose file defines the development password. Do not reuse that password outside local development.

### 2. Configure and prepare the backend

Create `backend/.env` from `backend/.env.example`. The database URL should point to `localhost:5433` and the `healtrip` database, for example:

```dotenv
DATABASE_URL="postgresql://healtrip:healtrip_dev_password@localhost:5433/healtrip?schema=public"
CORS_ORIGIN=http://localhost:5173
```

**Provider configuration gap:** the committed `backend/.env.example` names `OPENROUTER_API_KEY`, but `OpenRouterProvider` reads `LLM_API_KEY` and `LLM_BASE_URL`. The provider uses `LLM_MODEL` when set and otherwise defaults to `openai.gpt-oss-120b-1:0`. The decision log describes a different model target (`openrouter/free`). Thus, the example environment and provider implementation are not aligned. For a working local backend, provide `LLM_API_KEY` and the appropriate OpenAI-compatible `LLM_BASE_URL` for the intended provider; the repository does not specify that base URL in its example file. Keep all provider credentials in `backend/.env`, never in a `VITE_*` variable.

| Variable | Used by | Behavior |
|---|---|---|
| `DATABASE_URL` | Prisma adapter and Prisma CLI | PostgreSQL connection string; required for database access and migrations. |
| `LLM_API_KEY` | `OpenRouterProvider` | API key read by the provider implementation. |
| `LLM_BASE_URL` | `OpenRouterProvider` | OpenAI-compatible API base URL passed to the SDK. |
| `LLM_MODEL` | `OpenRouterProvider` | Optional model override; code default is `openai.gpt-oss-120b-1:0`. |
| `CORS_ORIGIN` | Nest bootstrap | Optional comma-separated origins; defaults to `http://localhost:5173`. |
| `PORT` | Nest bootstrap | Optional listen port; defaults to `3000`. |
| `VITE_API_BASE_URL` | Frontend API client | Optional API origin; defaults to `http://localhost:3000`. This is a public URL setting, not a place for secrets. |

`OPENROUTER_API_KEY` appears in `backend/.env.example` but is not read by the current provider implementation. The database URL above uses the local-only development credentials from `docker-compose.yml`; do not reuse them outside the local prototype.

Then run from `backend/`:

```bash
npm ci
npx prisma generate --config prisma7.config.ts
npx prisma migrate dev --config prisma7.config.ts
npx prisma db seed --config prisma7.config.ts
npm run start:dev
```

The Prisma configuration reads `DATABASE_URL`, uses `prisma/schema.prisma`, and configures `tsx prisma/seed.ts` as the seed command. The seed upserts specialties but creates hospitals and doctors; rerunning it against the same database will duplicate those records. Use a clean assessment database when seeding again.

The backend listens on `http://localhost:3000` by default. `GET /health` can be used to check that the NestJS process responds.

### 3. Configure and run the frontend

Create `frontend/.env` from `frontend/.env.example` if you need to change the API URL. The only frontend variable is:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Run from `frontend/`:

```bash
npm ci
npm run dev
```

Vite defaults to `http://localhost:5173`, which is the backend's default allowed CORS origin. If you change the frontend origin, set `CORS_ORIGIN` in `backend/.env` to that origin. The frontend talks only to the NestJS API; do not expose LLM credentials in frontend environment variables.

## Tests and checks

Backend Jest unit test files are present for the app controller, agent service, safety guard, chat service, chat DTO, doctor search service, and hospital search service. From `backend/`, run them with:

```bash
npm run build
npm test -- --runInBand
npx prisma migrate status --config prisma7.config.ts
```

The backend also defines `npm run test:e2e`, but the current sole e2e spec is the Nest starter example: it requests `GET /` and expects `Hello World!`. The application currently exposes `GET /health` and `POST /chat`, so that scaffold is not an integration test for the current API. There are no frontend test scripts; the frontend provides `npm run build` (including `tsc -b`) and `npm run lint`.

`tes.md` contains manual system-prompt scenarios and observed model responses. Those are manual model-behavior checks, not an automated test suite. This README does not claim that the backend test suite or e2e scaffold passed.

## Technical decisions

The implementation reflects the accepted decisions in [DECISION_LOG.md](DECISION_LOG.md), including:

- A hybrid split: the LLM handles language understanding, clarification, and tool selection; the backend validates and executes tools and enforces configured urgent-pattern checks.
- Two registered search tools, with a three-iteration maximum for the tool-calling loop instead of a separate persisted state machine.
- An `LLMProvider` interface with an OpenRouter adapter using the OpenAI SDK.
- Canonical specialty codes and semantic tool values instead of database IDs.
- DTO validation for untrusted model tool arguments and an explicit registry allow-list.
- Structured, whitelisted tool output; no raw provider summaries are passed to the model.
- Normalized `Specialty` records and many-to-many join models for doctor/specialty, doctor/hospital, and hospital/specialty relationships.
- A city string for the MVP and controlled enum values for hospital services; no subspecialty taxonomy.
- Database-backed tool results as the factual source for provider and hospital responses.

Some earlier discussion sections of `DECISION_LOG.md` are marked proposed; the list above summarizes the implemented/accepted decisions and is not a replacement for the log's status labels and rationale.

## Assessment scope and limitations

This repository focuses on demonstrating an AI agent, registered tool calling, backend input validation, database grounding, coarse safety handling, and bilingual chat—not a complete healthcare platform. Seeded data is synthetic and limited. Safety patterns are intentionally incomplete. The system has no production medical validation, live provider source, booking, real-time availability, payments, or authentication. No deployed demo URL is configured in the repository.
