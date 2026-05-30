# 02 — Architecture

The backend you connect to. You don't own most of this, but you must understand it to integrate correctly and to know exactly what the API gives back.

## Stack & boundaries

- **Next.js 16.2.6** App Router route handlers + **Supabase** Postgres. Backend lives in the **same** app as the frontend (`app/api/.../route.ts`).
- **Local** PDF parse (`pdf-parse`, pure JS) — statement text never leaves the server, never goes to a third-party LLM.
- No Stripe OAuth, no file storage, no login.
- ⚠️ Next 16 changed route-handler / request APIs vs older versions. Per repo `AGENTS.md`, consult `node_modules/next/dist/docs/` before writing route handlers (`formData()`, `Request`/`Response`, streaming).

## End-to-end request lifecycle

```
[Browser] animated UI
   │  multipart/form-data { file: <pdf> }
   ▼
POST /api/analyze (route handler, server)
   │  1. guard file (mime, magic byte %PDF-, ≤10MB, single, page cap)
   │  2. pdf-parse → text
   │  3. regex extract → ExtractedStatement
   │  4. validate numbers (fail loud if grossVolume/totalFees missing)
   │  5. compute savings (pricing.config.ts)
   │  6. insert Supabase row (email null, status 'analyzed')
   │  7. return AnalyzeResponse  ◄── frontend renders the hook
   ▼
[Browser] email gate (shown AFTER value)
   │  application/json { analysisId, email }
   ▼
POST /api/lead (route handler, server)
   │  validate email · patch row email IF currently null · status 'lead'
   │  return { ok: true }
   ▼
[Supabase] analyses row → sales reads hot leads
```

## Pricing config — `lib/pricing.config.ts` (backend-owned, do not duplicate in UI)

```ts
export const PRICING = {
  EPD_EFFECTIVE_RATE: 0.015, // 1.5% placeholder — ONLY live knob
  EPD_PER_TXN: 0,            // wire later
  EPD_MONTHLY_FEE: 0,        // $36 later
  EPD_SETUP_FEE: 0,          // $99 later
  HOT_LEAD_MIN_ANNUAL: 1000, // hot if annual saving >= this
} as const;
```

## Algorithm (pure function, server-side)

```
periodDays    = (periodEnd - periodStart) + 1
epdCost       = grossVolume * EPD_EFFECTIVE_RATE        // + perTxn*count + fees (all 0 now)
stripeCost    = totalFees                                // read from statement, NOT recomputed
savePeriod    = stripeCost - epdCost
annualSaving  = savePeriod / periodDays * 365            // derive from dates, any period length
monthlySaving = annualSaving / 12
pctSaving     = stripeCost > 0 ? savePeriod / stripeCost : 0
isHot         = annualSaving >= HOT_LEAD_MIN_ANNUAL
```

Savings can be **negative** (EPD not cheaper) — returned honestly, `isHot=false`. The frontend must handle negative/zero gracefully (see `04`).

## Parser target — `ExtractedStatement` (Stripe monthly statement)

| Field | Source label (regex anchor) | Criticality |
| --- | --- | --- |
| `grossVolume` | `Gross` / `Total volume` | **critical** — fail loud if missing |
| `totalFees` | `Fees` | **critical** — fail loud if missing |
| `periodStart` / `periodEnd` | `"September 1 – September 30, 2024"` | required (annualize) |
| `transactionCount` | `Charges` count / `Transactions` | optional (perTxn=0 now) |
| `currency` | `$` / `USD` | required |
| `refunds` / `net` | `Refunds` / `Net` | optional |

No real sample statement exists yet → regex is unvalidated against reality. This is the project's #1 risk. It does not change the API contract, but expect parse failures during testing; the frontend's parse-error state must be solid.

## Database — single `analyses` table (Supabase, RLS on, service-role writes only)

```sql
id            uuid primary key default gen_random_uuid()
period_start  date not null
period_end    date not null
gross_volume  numeric not null
total_fees    numeric not null
txn_count     integer
currency      text not null
epd_rate      numeric not null      -- rate snapshot used (audit)
monthly_saving numeric not null
annual_saving  numeric not null
pct_saving     numeric not null
is_hot         boolean not null
email          text                  -- null until /lead
status         text not null         -- 'analyzed' | 'lead'
created_at     timestamptz default now()
```

Stores **extracted numbers only** — never raw PDF or text.

## Security model (affects how the frontend talks to the API)

- **Supabase service-role key is server-only.** It is never exposed to the browser and never prefixed `NEXT_PUBLIC_`. The frontend talks **only** to our own `/api/*` routes — it never calls Supabase directly in the MVP.
- Endpoints are **public** (anonymous funnel) with a **light per-IP rate limit** on `/analyze`. Frontend should surface a friendly message on `429`.
- `analysisId` is an unguessable UUID; `/lead` only sets email if it's currently null (set-once). Frontend treats `analysisId` as an opaque token to pass from step 1 to step 2.
- Client errors are generic; server logs are detailed with financial values redacted. **The frontend must never log file contents or extracted financial values.**

## Server-side env (for awareness — backend owns these)

```
SUPABASE_URL=...                 # server
SUPABASE_SERVICE_ROLE_KEY=...    # server ONLY — never NEXT_PUBLIC
EPD_EFFECTIVE_RATE=0.015         # optional override of config default
```

The frontend integration needs **no** secret env vars — it calls same-origin `/api/*`.

## File / repo layout (proposed; align with what backend creates)

```
app/
  page.tsx                     # animated landing (frontend team)
  layout.tsx
  api/
    analyze/route.ts           # backend
    lead/route.ts              # backend
lib/
  pricing.config.ts            # backend
  calc.ts                      # backend (pure algorithm)
  parse/stripeStatement.ts     # backend
  supabase/server.ts           # backend
  validation/file.ts           # SHARED (client + server file checks)
  api/client.ts                # YOU — typed fetch wrappers
  viewModel.ts                 # YOU — AnalyzeResponse → display model
hooks/
  useAnalyze.ts                # YOU
  useLead.ts                   # YOU
types/
  contract.ts                  # SHARED — see docs/types/contract.ts
```
