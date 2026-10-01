# HealTrip AI Patient Decision Assistant — Decision Log

> Working design document for the technical assessment. This file records decisions, rationale, trade-offs, and reversals. It should evolve with the implementation.

## Status

- Time constraint: < 24 hours
- Goal: Complete, clean prototype covering every explicit assessment requirement without building unnecessary production scope.
- Current phase: Requirements & use-case definition
- Implementation started: No

## How we will use this document

For every meaningful architectural/technical decision:

1. Decision
2. Why
3. Alternatives considered
4. Trade-offs
5. Consequences / implementation impact
6. Status (Proposed / Accepted / Replaced)

If a decision changes, keep the old decision and add a new entry explaining why it changed.

---

# 1. Requirements

## Explicit requirements from the assessment

- React or Next.js chat UI
- Node.js/NestJS (or another backend)
- AI Agent that can:
  - understand the user's situation
  - ask suitable clarification questions
  - determine a suggested next step
  - use a Tool/Function when needed instead of making up an answer
- Mock DB or PostgreSQL containing doctors/hospitals
- AI can search the data and select suitable options
- Show API architecture and database structure clearly
- Arabic/English support, or at minimum bilingual-ready UI design
- Demonstrate architecture, AI agent design, tool calling, data flow, security, error handling
- Prevent AI from inventing information not present in the database
- Deliver GitHub repo, README, optional demo link, assumptions/notes

## Explicit non-goals

- Full production medical platform
- Beautiful/polished UI as a primary goal
- Full booking/payment/auth ecosystem unless required to demonstrate the flow
- Complete medical diagnosis engine

---

# 2. Initial Use Cases

### UC-01: Potentially urgent symptom

User describes concerning symptoms (example: severe chest pain + difficulty breathing).
Expected prototype behavior: recognize potential urgency, prioritize safety-oriented guidance, and avoid routine provider search as the first action.

### UC-02: Insufficient information

User gives an underspecified symptom (example: "I have chest pain.").
Expected behavior: ask relevant clarification questions before making a provider recommendation.

### UC-03: Grounded provider search

User provides enough context and asks for a suitable specialist/provider.
Expected behavior: use a backend tool/function to search the database and return only providers that actually exist in the data.

### UC-04: No matching provider/data

A tool search returns no suitable provider/hospital.
Expected behavior: explicitly say that no matching option was found in the available data rather than hallucinating a provider.

### UC-05: Arabic/English conversation

The user can communicate in Arabic or English; the UI and response flow should support both.

---

# 3. Core Design Principle (Proposed)

**The LLM may reason over user-provided information and tool results, but provider/hospital facts must come from trusted backend data.**

This directly addresses the assessment's hallucination-prevention requirement.

Status: Proposed — architecture still open.

---

# 4. Open Decisions

- Agent architecture: LLM-first agent vs deterministic workflow vs hybrid
- LLM/provider choice and SDK
- Backend framework: NestJS vs other Node.js option
- Frontend: React/Vite vs Next.js
- Database: PostgreSQL vs mock/in-memory DB
- Exact tool set
- Safety boundary and emergency handling design
- Conversation state strategy
- API contract
- Database schema
- Authentication requirement (likely out of prototype scope unless needed)
- Deployment/demo strategy
- Testing strategy

---

# 5. Decision History

No final architecture decisions have been made yet. Requirements and use cases are being established first.

---

# 6. Decision Discussion — Agent / Tool / Safety Boundary

## D-001: Hybrid responsibility model (PROPOSED)

### Context

We discussed three broad approaches for handling patient decision assistance:

1. LLM-only
2. Deterministic rules-only
3. Hybrid: LLM for language/reasoning + backend guardrails/data/tool execution

### LLM-only

**Pros**

- Fastest to prototype.
- Minimal backend logic.
- Flexible natural-language reasoning.

**Cons**

- More probabilistic behavior for safety-sensitive decisions.
- Harder to make behavior deterministic and reliably testable.
- Higher risk of unsupported recommendations if boundaries are weak.

### Rules-only

**Pros**

- Deterministic and highly testable.
- Clear control over safety behavior.

**Cons**

- Poor fit for natural-language understanding.
- Rules can grow quickly and become a mini decision engine.
- Less conversational/agentic.

### Hybrid

**Pros**

- LLM handles natural-language understanding, extraction, clarification, tool selection, and response generation.
- Backend handles validation, safety guardrails, tool execution, database truth, rate limiting, and error handling.
- Better separation between probabilistic reasoning and authoritative system behavior.
- Stronger foundation for testing and hallucination prevention.

**Cons**

- More moving parts.
- Requires careful definition of the LLM/backend boundary.
- Risk of overengineering if the deterministic layer becomes too large.

### Current direction

Use a **small hybrid boundary** rather than a full medical rules engine. The prototype should use deterministic guardrails only for the safety-sensitive behaviors we explicitly demonstrate.

Status: **PROPOSED — not yet accepted**.

---

## D-002: Tool execution must be backend-controlled (PROPOSED)

### Question

Should the LLM have direct freedom to access provider data, or should tool access be mediated by the backend?

### Option A — LLM directly accesses data

**Pros**

- Conceptually simple agent flow.
- Fewer orchestration layers.

**Cons**

- Weak control boundary.
- Harder to validate access and parameters.
- Makes data integrity and security responsibilities less explicit.
- Greater risk of accidental access outside intended scope.

### Option B — Registered tools executed by backend

The LLM can request a tool, but the backend owns the actual implementation and execution.

**Pros**

- Strong security boundary.
- Tool inputs can be validated and normalized.
- Database access remains fully controlled by application code.
- Easier to test and audit.
- Easy to restrict the agent to an explicit tool allow-list.

**Cons**

- More backend code.
- Slightly more orchestration complexity.

### Current direction

**Backend-controlled registered tools** are preferred for the prototype.

Status: **PROPOSED — not yet accepted**.

---

## D-003: Validate and normalize tool arguments in the backend (PROPOSED)

### Question

Should tool-call parameters generated by the LLM be passed directly to the database layer?

### Option A — Pass through directly

**Pros**

- Less code.
- Faster to implement.

**Cons**

- LLM output is not a trusted input boundary.
- Weak validation and potentially inconsistent queries.
- Makes security and correctness harder to guarantee.

### Option B — Backend validates/normalizes before execution

Example:
LLM requests `searchDoctors({ specialty, city })` → DTO/schema validation → normalization → service/repository query.

**Pros**

- Clear trust boundary.
- Predictable database queries.
- Easier testing.
- Prevents malformed or unsupported arguments from reaching the DB layer.

**Cons**

- Additional validation code.
- Requires defining the tool schema explicitly.

### Current direction

**Backend validation/normalization before every tool execution.**

Status: **PROPOSED — not yet accepted**.

---

## D-004: Provider recommendations must be grounded in tool results (PROPOSED)

### Principle

The LLM may summarize/select among returned providers, but provider facts must originate from backend tool results.

### Trade-off

This constrains the LLM somewhat, but gives us a clear guarantee for the assessment's hallucination-prevention requirement. The prototype will prefer an explicit "no matching provider found in the available data" response over fabricated information.

Status: **PROPOSED**.

## D-005: Simple Hybrid action control vs full State Machine (PROPOSED)

### Question

After the LLM proposes an action, should we use a full backend State Machine/Policy Engine, or a lightweight validation/guardrail layer?

### Option A — LLM proposes action + lightweight backend guardrails

Flow:
LLM → proposed action → backend validates tool/action + arguments + safety constraints → execute or reject.

**Pros**

- Fastest to implement within the <24h constraint.
- Preserves genuine agentic behavior: the LLM can choose when a tool is useful.
- Backend retains final authority over execution.
- Lower complexity than a full state machine.
- Easy to extend with additional registered tools.

**Cons**

- Less formally deterministic than a full state machine.
- Some workflow semantics remain in the LLM.
- Guardrails must be designed carefully to avoid gaps.

### Option B — Full backend State Machine

The backend explicitly controls conversation states and allowed transitions.

**Pros**

- Highly deterministic and testable.
- Explicit workflow control.
- Strong visibility into allowed transitions.

**Cons**

- More implementation time and complexity.
- Risk of overengineering the prototype.
- Can make the Agent feel more like a deterministic workflow than an agent.
- More work when adding new conversational paths/tools.

### Current direction

Prefer **Option A: Simple Hybrid** for the prototype, subject to validating it against concrete scenarios before accepting it.

Status: **PROPOSED — validate with scenarios before acceptance**.

---

# 7. Scenario Validation — Simple Hybrid

## Scenario A — Potentially urgent chest pain

User: "I have severe chest pain and difficulty breathing."

Expected flow:

1. LLM extracts symptoms/attributes.
2. LLM proposes an action/assessment.
3. Backend safety guard checks configured red-flag conditions.
4. If urgent criteria are met, routine provider-search tools are blocked.
5. System returns safety-oriented urgent guidance.

Why this works with Simple Hybrid:

- LLM handles natural-language understanding.
- Backend remains the final safety gate.
- No full State Machine is required for this path.

## Scenario B — Insufficient information

User: "I have chest pain."

Expected flow:

1. LLM identifies missing information.
2. LLM proposes `ask_clarification`.
3. Backend validates the action.
4. Assistant asks focused clarification questions.
5. New user response continues the assessment.

Why this works with Simple Hybrid:

- Clarification is a natural LLM task.
- Backend only needs to validate that `ask_clarification` is a registered/allowed action.

## Scenario C — Non-urgent provider search

User: "I've had mild chest discomfort for weeks, it's not happening now, and I'd like to see a cardiologist in Madinah."

Expected flow:

1. LLM extracts relevant context.
2. Safety guard finds no configured urgent trigger.
3. LLM proposes `search_doctors`.
4. Backend validates/normalizes `{ specialty: cardiology, city: Madinah }`.
5. Registered tool queries PostgreSQL.
6. Only returned providers can be presented/recommended by the LLM.

Why this works with Simple Hybrid:

- Agent retains genuine tool-selection behavior.
- Backend controls database access and grounding.

## Scenario D — No matching provider

User requests a specialty/location combination not present in the database.

Expected flow:

1. LLM proposes provider search.
2. Backend validates and executes the tool.
3. Tool returns an empty result set.
4. LLM is instructed to state that no matching provider was found in the available database.
5. No provider is fabricated.

## Scenario E — Incorrect/unsafe tool proposal

LLM proposes `search_doctors` while backend safety checks indicate the case should follow an urgent path.

Expected flow:

1. Backend rejects the tool execution.
2. System follows the safety path.
3. The LLM generates the user-facing response using the authoritative backend outcome.

### Scenario conclusion

The concrete scenarios can be handled by the **Simple Hybrid** approach without requiring a full State Machine. A State Machine would add stronger formal workflow guarantees, but the current scenarios do not justify its additional complexity under the <24h constraint.

Status: **PROPOSED — strong candidate for acceptance after final review**.

## Decision D-006 — Provider search inputs and returned provider data

### Problem

The agent needs enough patient preferences to perform useful provider/hospital search, while avoiding unnecessary questions and unnecessary database complexity.

### Proposed search inputs

For doctor/provider search, treat these as distinct categories:

- **Required when provider search is actually performed:** location/city and clinical specialty (unless the user has already supplied an equivalent constraint or the system can safely infer it from the prior conversation).
- **Optional preferences:** preferred hospital/organization, doctor gender, communication language, subspecialty, and other explicitly stated preferences.
- **Nationality:** not a default search criterion. It should only be captured/used if the patient explicitly asks for it and the prototype's data actually contains that attribute. Do not ask for nationality proactively because it does not add necessary routing value for the core prototype and can create an unnecessary sensitive preference dimension.

### Rationale

Location is needed to make provider results meaningful. Specialty is needed to establish provider relevance. Hospital and other preferences should narrow results when explicitly requested, but should not become mandatory questions that make the conversation unnecessarily long.

For communication, **language preference is more directly useful than provider nationality** because it affects the patient's ability to communicate with the provider. Gender preference may also be useful as an explicit patient preference, but should not be inferred.

### Provider search result design

`searchDoctors` should return structured provider records with enough information for the LLM to explain why a result matches the request, not just a name. Candidate fields:

- id
- name
- gender (if available and appropriate)
- specialty / subspecialty
- hospital / clinic
- city / location
- languages
- professional summary / credentials
- years of experience (if available in the mock data)
- consultation mode (if relevant to the prototype)
- official contact or profile reference if included in the mock data

Do not expose fabricated or unsupported attributes. Availability should not be represented as real-time unless the prototype actually implements an authoritative availability source.

### Trade-offs

**Minimal result (name + specialty + hospital):** fastest and simplest, but gives the agent too little grounded information to explain relevance.

**Rich provider result:** better patient-facing recommendations and demonstrates structured retrieval/grounding, but increases schema/data-seeding effort.

**Very rich / production-style provider registry:** potentially useful long term, but unnecessary for a <24h prototype.

### Current direction

Use a **moderately rich provider record**: enough to demonstrate grounded recommendation and filtering, without building a full healthcare-provider registry.

Status: **PROPOSED — pending final tool/schema design.**

## D-007 — Normalize Specialty as a first-class entity

### Decision

Use a normalized `Specialty` entity and many-to-many relationships:

- `Doctor` ↔ `DoctorSpecialty` ↔ `Specialty`
- `Hospital` ↔ `HospitalSpecialty` ↔ `Specialty`

`DoctorSpecialty` should include `isPrimary` so a doctor can have multiple specialties while retaining a primary specialty.

### Why

- Prevents inconsistent free-text specialty values.
- Gives specialties canonical IDs for tool filters and database queries.
- Supports doctors with multiple specialties.
- Allows hospitals to advertise/support multiple specialties.
- Improves grounding: the LLM can map natural-language intent to canonical specialty data rather than querying arbitrary strings.
- Keeps the prototype extensible without introducing a large healthcare domain model.

### Alternatives considered

1. Store `specialty` directly as a string on `Doctor` — simplest, but weak consistency and poor support for multiple specialties.
2. One-to-many Doctor → Specialty — simpler, but incorrectly assumes one specialty per doctor.
3. Normalized many-to-many — slightly more schema/query complexity, but better domain representation and search integrity.

### Trade-offs

**Benefits:** data consistency, flexible specialty search, multiple specialties, clean relational design, better agent/tool grounding.

**Costs:** additional join tables, joins in queries, slightly more seed data and implementation effort.

### Scope boundary

Do not add a full specialty hierarchy/subspecialty taxonomy unless a concrete prototype scenario requires it. A `Specialty` entity plus optional `subspecialty` support can be introduced incrementally.

### Status

**ACCEPTED**
