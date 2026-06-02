# Job Hunter

**AI-native personal job search tool** — built to run my own job search as a senior pre-sales leader.  
Live demo: [job-hunter-pied.vercel.app](https://job-hunter-pied.vercel.app)

> *"I built this to run my own job search — here's the architecture."*

---

## What it does

7-module pipeline that replaces manual job search workflows:

| Module | Function | AI pattern |
|--------|----------|-----------|
| **Job Scanner** | Paste text / URL → structured JSON (title, company, geo, stack, seniority, comp, hiring manager, HR contact) | Tool-calling: input → structured-data-out |
| **Pre-Qualify Agent** | Scoring 0–100 across 6 dimensions + GO/INVESTIGATE/NO-GO | RAG + structured output |
| **Pipeline Tracker** | Kanban (Identified → Applied → In Process → Offer → Closed → Abandoned) | Supabase sync + localStorage cache |
| **Document Adapter** | Tailored cover letters + CV tips per posting, version history, PDF export | RAG + prompt engineering |
| **Outreach Generator** | LinkedIn messages — peer tone, 2 variants, bilingual FR/EN, saved per job | Few-shot prompt engineering |
| **ATS & Probability** | ATS keyword match score + estimated response probability, missing keywords, quick wins | RAG + structured output |
| **Timeline** | Weekly activity chart (scanned / qualified / applied) + conversion funnel | Client-side data aggregation |

---

## Architecture

```
Browser (React 18 SPA)
    │
    ├── /api/claude  (Vercel serverless function)
    │       └── ANTHROPIC_API_KEY (server env — never exposed to client)
    │               └── api.anthropic.com/v1/messages
    │
    ├── Supabase (multi-device sync)
    │       ├── jobs table (RLS — user sees only their own data)
    │       ├── profiles table
    │       └── Magic link auth (passwordless)
    │
    ├── localStorage (offline cache + fallback)
    │       └── Auto-migration to Supabase on first login
    │
    └── RAG context (injected per call)
            ├── Search profile (roles, salary floor, geos, strengths, dealbreakers)
            ├── CV summary
            ├── Uploaded CV text (PDF extracted client-side via PDF.js)
            └── Reference documents (CV template + cover letter template)
```

### Stack
- **Frontend**: React 18, Tailwind CSS, Vite, deployed on Vercel
- **LLM**: Claude Sonnet via Anthropic API
- **API proxy**: Vercel serverless function (`/api/claude.js`) — key stored server-side, never exposed to client
- **Auth**: Supabase magic link (passwordless email)
- **Persistence**: Supabase (primary) + localStorage (cache/fallback)
- **FX rates**: open.er-api.com — live EUR/CAD/USD conversion for salary floor comparison
- **PDF parsing**: PDF.js CDN — client-side text extraction, never sent to third-party servers
- **i18n**: Custom hook + dictionary — full FR/EN interface toggle, persisted in localStorage

---

## AI Patterns implemented

### 1. RAG via prompt injection
The user's search profile (target roles, salary floor, geographies, strengths, dealbreakers, CV summary) is injected into the system prompt of every API call. No vector database needed for a single-user tool — full profile fits in context. When a CV is uploaded, the extracted text (up to 2000 chars) is appended to every relevant agent call.

```js
const sys = `You are a senior career coach...
CANDIDATE PROFILE (RAG context):
- Target roles: ${profile.targetRoles}
- Salary floor: ${profile.salaryFloor} ${profile.salaryCurrency}
- Priority geographies: ${profile.geos}
- Dealbreakers: ${profile.dealbreakers}
- CV summary: ${profile.cvSummary}
${cvText ? `Full CV: ${cvText.slice(0, 2000)}` : ''}
${refCoverLetter ? `Reference cover letter style: ${refCoverLetter.slice(0, 1500)}` : ''}`
```

### 2. Structured output (JSON schema enforcement)
Every agent returns a strict JSON schema, validated client-side. The Pre-Qualify agent returns:

```json
{
  "total": 78,
  "recommendation": "GO",
  "dimensions": [
    { "name": "Geo fit", "score": 90, "note": "Montréal — priority geography" },
    { "name": "Role type fit", "score": 85, "note": "Director Pre-Sales exact match" }
  ],
  "flags": [
    { "type": "positive", "message": "MEDDPICC explicitly required — direct match" },
    { "type": "warning",  "message": "Compensation not listed — investigate" }
  ]
}
```

The UI renders scores as dimension bars and flags as typed alerts — structured output drives the entire display layer.

The ATS agent returns a parallel schema with `atsScore`, `probabilityScore`, `keywordsFound`, `keywordsMissing`, `probabilityFactors`, and `quickWins` — same pattern, different domain.

### 3. Tool-calling pattern (job scanner)
The Job Scanner treats job extraction as a tool call: text/URL-in → Claude parses → structured JSON out. Classifies `roleType` based on actual responsibilities (not just job title) — detects post-sales roles mislabeled as "Pre-Sales". Also extracts hiring manager and HR contact names when present in the posting.

### 4. Multi-agent pipeline
The 7 modules form an explicit agentic pipeline with shared state:

```
Scan → Qualify → [Pipeline] → ATS → Adapt → Outreach
  ↑                               ↑       ↑
  └── structured job object ──────┘       │
      passed between agents via app state │
  └── RAG context (profile + CV) ─────────┘
```

Each agent receives the same job object + user profile + CV context. State flows forward — qualify score, ATS score, cover letter, CV tips, and outreach messages are all stored on the job object and visible from the pipeline card.

### 5. Per-agent prompt engineering
Each module has a purpose-built system prompt with explicit constraints:

- **Scanner**: strict JSON schema, content-based roleType classification, never refuse
- **Qualify**: depriorization rule (2+ mismatches → score < 40), dimension-by-dimension scoring with explicit notes
- **Cover letter**: 3-paragraph structure, no generic phrases, contact header auto-inserted, max 280 words, auto language detection FR/EN, style inspired by reference document if provided
- **CV tips**: numbered list, WHAT → WHY format, references actual job requirements
- **ATS**: keyword extraction from both job and CV, probability factors with impact classification
- **Outreach**: max 3 sentences, zero flattery phrases (enumerated as forbidden), peer-tone enforcement, 2 variants

### 6. Output cleaning pipeline
All AI-generated text passes through `cleanAIText()` before storage — strips markdown artifacts (`**`, `__`, `##`, `—` as bullets) that make outputs look AI-generated in professional documents.

---

## Local setup

```bash
git clone https://github.com/mabrizard/job-hunter
cd job-hunter
npm install

# Create .env.local with your keys
cp .env.local.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm run dev
# Add your Anthropic API key in Settings → API Key
```

---

## Vercel deployment

```bash
# 1. Push to GitHub
# 2. Connect repo in Vercel dashboard → New Project → Import
# 3. Add environment variables:
#    ANTHROPIC_API_KEY=sk-ant-...
#    VITE_SUPABASE_URL=https://xxxx.supabase.co
#    VITE_SUPABASE_ANON_KEY=eyJ...
# 4. Deploy — /api/claude.js serverless function proxies all LLM calls
```

### Supabase setup (for multi-device sync)

```sql
create table jobs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table jobs enable row level security;
alter table profiles enable row level security;

create policy "Users can manage their own jobs"
  on jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own profile"
  on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## Roadmap

- [ ] Reminder de relance — alert when Applied with no action for 7+ days
- [ ] Job comparator — side-by-side view for two INVESTIGATE postings
- [ ] Batch scoring — scan and qualify multiple postings in one pass
- [ ] Job search via public APIs (Adzuna + Google Custom Search)

---

## Built with

100% prompt engineering with Claude — architecture decisions, UX, code generation, debugging, iteration.  
Delivery: under 3 weeks from spec to production.
