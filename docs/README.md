# Smart Calculator — Frontend Integration Knowledge Pack

> Single source of truth for the **frontend integration** work on the EPD Savings Calculator.
> This pack lives inside the actual frontend project (`smart-calculator/`). Read this first, then the numbered docs.

## What this product is (one line)

A lead-gen tool: a merchant uploads their **Stripe processing statement (PDF)**, we parse it locally, compute how much they'd save on **EPD (Easy Pay Direct)** vs Stripe, and show the savings in the most hooking way — turning an interested visitor into a captured (and possibly "hot") sales lead.

## The funnel

```
Upload Stripe statement (PDF)
   → backend parses locally + computes savings
   → frontend shows ANNUAL net savings (the hook)
   → email gate (value shown FIRST, then ask for email)
   → lead stored in Supabase, flagged hot/cold
   → sales follows up on hot leads
```

## Who does what

| Area | Owner |
| --- | --- |
| Animated website (visuals, motion, the trending design) | **Frontend team** — heavy lifting, separate |
| Backend logic: parse, algorithm, Supabase, API routes | Backend (spec'd in `02-architecture.md`) |
| **Frontend integration layer + adapting it onto the animated site** | **YOU** — this pack is for you |

Your job is **not** to build animations. It is to build the typed API client, the React hooks / state machine, the upload → result → email-capture flow logic, client-side validation, the result view-model, and to **wire all of that into the animated components** the frontend team hands over.

## This project's actual stack (verified from the repo)

- **Next.js 16.2.6** — ⚠️ new major with breaking changes vs your training data. The repo's `AGENTS.md` mandates: *read the relevant guide in `node_modules/next/dist/docs/` before writing any code.* Do that for route handlers, `formData`, and request APIs.
- **React 19.2.4**, **TypeScript 5 (strict)**, **Tailwind CSS v4** (via `@tailwindcss/postcss`).
- **App Router at repo root**: `app/page.tsx`, `app/layout.tsx`. **No `src/` dir.**
- **Path alias:** `@/*` → `./*` (root-relative). e.g. `@/lib/api/client`, `@/types/contract`.
- **Dev port:** 3000 (`npm run dev`).
- **Deps to add** (not yet installed): `@supabase/supabase-js`, `pdf-parse` (backend), `zod` (shared validation). Frontend integration itself needs no extra runtime dep beyond what's here.

## Read order

1. [`01-product-context.md`](./01-product-context.md) — goal, users, scope, the honesty principle
2. [`02-architecture.md`](./02-architecture.md) — stack, algorithm, backend you connect to
3. [`03-api-contract.md`](./03-api-contract.md) — endpoints, request/response/error shapes, status codes
4. [`04-frontend-integration.md`](./04-frontend-integration.md) — **your task**: layers, hooks, UI states, adaptation, checklist
5. [`types/contract.ts`](./types/contract.ts) — copy-paste TypeScript contract types

## Hard constraints (do not violate)

- **5-hour total project budget.** Don't add features. Refine the decided ones to be battle-tested.
- **Same Next.js app:** backend route handlers and the frontend live together in `smart-calculator/`.
- **Local-only financial data:** parsing is server-side; statement contents never go to a third-party LLM, and the **frontend never stores or logs statement contents**.
- **Placeholder pricing:** EPD = flat **1.5%** effective rate (replaceable typed config), all other fees = 0 for now. **Frontend never hardcodes pricing** — display only what the API returns.
- **Value-first:** show the savings number BEFORE asking for email.
- **Honesty:** if EPD isn't cheaper, show it honestly; still capture the lead as cold. Never fake a positive number.

## Frozen decisions log

| Decision | Value |
| --- | --- |
| Input | Single Stripe statement PDF (no Stripe OAuth in MVP) |
| Extraction | Local deterministic parse (no external LLM) |
| EPD model | Flat 1.5% placeholder, typed config, replaceable |
| Fixed fees ($99 setup / $36 mo) | Ignored for now (config knobs = 0) |
| Headline number | **Annual net savings** |
| No-savings case | Return honestly + flag cold |
| Parse failure | 422 + which field; store nothing |
| Flow | Two-step: `/analyze` (value) → `/lead` (email) |
| Annualize | Derive period length from statement dates, normalize to year |
| Persist | Extracted numbers only — never raw PDF/text |
| DB | Single `analyses` table in Supabase |
| Auth | Public endpoints + light per-IP rate limit |
