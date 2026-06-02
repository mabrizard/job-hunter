# PreSales Hunter

**AI-native personal job search tool** — built to run my own job search as a senior pre-sales leader.  
Live demo: [presales-hunter.vercel.app](https://presales-hunter.vercel.app)

> *"I built this to run my own job search — here's the architecture."*

---

## What it does

5-module pipeline that replaces manual job search workflows:

| Module | Function | AI pattern |
|--------|----------|-----------|
| **Job Scanner** | URL → structured JSON (title, company, geo, stack, seniority, comp) | Tool-calling: URL-in → structured-data-out |
| **Pre-Qualify Agent** | Scoring 0–100 across 6 dimensions + GO/INVESTIGATE/NO-GO | RAG + structured output |
| **Pipeline Tracker** | Kanban (Identified → Applied → In Process → Offer → Closed) | localStorage persistence |
| **Document Adapter** | Tailored cover letters + CV tips per posting | RAG + prompt engineering |
| **Outreach Generator** | LinkedIn messages — peer tone, 2 variants, bilingual | Few-shot prompt engineering |

---

## Architecture

```
Browser (React 18 SPA)
    │
    ├── /api/claude  (Vercel serverless function)
    │       └── ANTHROPIC_API_KEY (server env — never exposed to client)
    │               └── api.anthropic.com/v1/messages
    │
    ├── localStorage  (pipeline, profile, current job)
    │
    └── User's search profile  (injected as RAG context on every call)
```

### Stack
- **Frontend**: React 18, Tailwind CSS, Vite, deployed on Vercel
- **LLM**: Claude Sonnet via Anthropic API
- **API proxy**: Vercel serverless function (`/api/claude.js`) — key stored server-side
- **RAG**: Profile + CV summary + dealbreakers injected as system prompt on every agent call (no vector DB in v1 — context window injection is sufficient for a single-user tool)
- **Persistence**: localStorage v1, Supabase migration planned for v2

---

## AI Patterns implemented

### 1. RAG via prompt injection
The user's search profile (target roles, salary floor, geographies, strengths, dealbreakers, CV summary) is injected into the system prompt of every API call. No vector database needed for a single-user tool — full profile fits in context.

```js
// buildQualifySystem() in Qualify.jsx
const sys = `You are a senior career coach...
CANDIDATE PROFILE (RAG context):
- Target roles: ${profile.targetRoles}
- Salary floor: ${profile.salaryFloor} ${profile.salaryCurrency}
- Priority geographies: ${profile.geos}
- Dealbreakers: ${profile.dealbreakers}
...`
```

### 2. Structured output (JSON schema enforcement)
Every agent returns a strict JSON schema, validated client-side. The Pre-Qualify agent returns:

```json
{
  "total": 78,
  "recommendation": "GO",
  "dimensions": [
    { "name": "Geo fit", "score": 90, "note": "Montréal — priority geography" },
    { "name": "Role type fit", "score": 85, "note": "Director Pre-Sales exact match" },
    ...
  ],
  "flags": [
    { "type": "positive", "message": "MEDDPICC explicitly required — direct match" },
    { "type": "warning",  "message": "Compensation not listed — investigate" }
  ]
}
```

The UI renders scores as bar charts and flags as typed alerts — the structured output drives the entire display layer.

### 3. Tool-calling pattern (job scanner)
The Job Scanner treats URL fetching as a tool call: URL-in → Claude fetches + parses → structured JSON out. The same interface handles both URL input and raw text paste, normalizing to the same output schema.

```
User input: { url: "https://linkedin.com/jobs/..." }
              ↓ callClaude(SCAN_SYSTEM, "Fetch and parse: {url}")
Output: { title, company, location, roleType, seniority, compensation, requiredStack[], ... }
```

### 4. Multi-agent pipeline (chained workflow)
The 5 modules form an explicit agentic pipeline:

```
Scan → Qualify → [Pipeline] → Adapt → Outreach
  ↑                               ↑
  └── structured job object ──────┘
      passed between agents via app state
```

Each agent receives the same job object + user profile. State flows forward — qualify score feeds the pipeline card, pipeline card links to doc adapter for the same role.

### 5. Prompt engineering — per-agent system prompts
Each module has a purpose-built system prompt with explicit constraints:

- **Scanner**: strict JSON schema, no markdown in output
- **Qualify**: depriorization rule (2+ mismatches → score < 40), dimension-by-dimension scoring
- **Cover letter**: 3-paragraph structure, no generic phrases, max 250 words, language detection
- **Outreach**: max 3 sentences, zero flattery phrases (enumerated as forbidden), peer-tone enforcement

---

## Local setup

```bash
git clone https://github.com/your-username/presales-hunter
cd presales-hunter
npm install
npm run dev
```

Add your Anthropic API key in the app: Settings → API Key (stored in localStorage, dev only).

---

## Vercel deployment

```bash
# 1. Push to GitHub
# 2. Connect repo in Vercel dashboard
# 3. Add environment variable: ANTHROPIC_API_KEY=sk-ant-...
# 4. Deploy
```

The `/api/claude.js` serverless function proxies all LLM calls — the API key is never sent to the browser in production.

---

## v2 roadmap

- [ ] Supabase persistence (multi-device sync)
- [ ] PDF CV upload → parsed as RAG context
- [ ] Email/calendar integration for follow-up tracking
- [ ] Batch scoring of multiple postings
- [ ] ATS keyword match score (M1 extension)

---

## Built with

100% prompt engineering with Claude — architecture decisions, UX, code generation, debugging.  
Marc-Alexandre piloted specs and arbitration. Claude generated, debugged, and patched.  
Delivery: under 2 weeks from spec to production.
