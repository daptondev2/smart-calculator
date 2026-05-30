# 04 — Frontend Integration (YOUR TASK)

This is your scope. The frontend team builds the **animated website** (visuals, motion, the trending design). You build the **integration layer** that drives it with real data and wires it to the backend, then **adapt** it onto their components.

## Mental model

Keep a hard seam between **logic** (yours) and **animation** (theirs):

```
 animated components (theirs)
        ▲  props: view-model + state + callbacks
        │
 integration layer (YOURS): hooks + state machine + view-model
        ▲  typed responses
        │
 API client (YOURS) ──HTTP──► /api/analyze, /api/lead (backend)
```

Animated components should be **dumb**: they receive a state + a formatted view-model + callbacks (`onFileSelected`, `onSubmitEmail`, `onReset`) and render. They should not call `fetch` or know about `analysisId`. This lets the frontend team restyle/re-animate freely without touching logic, and lets you test logic without the animation.

## Your deliverables

1. `lib/api/client.ts` — typed `analyzeStatement(file)` and `submitLead(analysisId, email)`; parses the shared error envelope; maps status+code → typed result.
2. `lib/validation/file.ts` (client portion) — validate **before** upload: single file, `application/pdf`, ≤10MB. (Server re-validates + magic byte; never trust the client.)
3. `hooks/useAnalyze.ts` — owns upload + the analyze state machine; exposes `{ state, result, error, analyze(file), reset() }`.
4. `hooks/useLead.ts` — owns email submit; exposes `{ state, error, submit(email), done }`.
5. `lib/viewModel.ts` — maps `AnalyzeResponse` → display model (formatted strings, variant, count-up target).
6. **Adaptation wiring** — connect the above into the animated components via props/callbacks.

No new runtime dependency is required beyond the repo's stack. Use `fetch`, React state, and `Intl`. (If the team already uses a state lib, follow it; otherwise plain `useReducer` is enough.)

## The flow (state machine)

One machine for the whole experience. Suggested states:

```
idle
  └─(file selected, client-valid)→ analyzing
        ├─(200)→ result            (then sub-states by savings)
        ├─(400/422)→ uploadError    →(retry)→ idle
        ├─(429)→ rateLimited        →(retry)→ idle
        └─(500/network)→ uploadError
result
  ├─ variant: 'hot'      (isHot === true)
  ├─ variant: 'positive' (annualSaving > 0 && !isHot)
  └─ variant: 'none'     (annualSaving <= 0)   ← honesty state
result → (user enters email) → submittingLead
        ├─(200 | 409)→ leadDone
        ├─(400 INVALID_EMAIL)→ back to result with inline email error
        ├─(404)→ sessionExpired → idle (must recalculate)
        └─(429/500/network)→ result with retryable banner
```

`reset()` returns to `idle` and clears `analysisId`, result, and the selected file.

### Why these exact transitions
- **Value-first:** email UI only appears in `result`, never before.
- **Honesty:** `none` variant is a first-class result, not an error.
- **Set-once email:** `409 EMAIL_ALREADY_SET` is treated as success (`leadDone`), not an error.
- **Expired session:** `404` on `/lead` means the analysis row is gone — force a recalculation rather than silently failing.

## Result variants — display intent

| Variant | Condition | Tone / CTA |
| --- | --- | --- |
| `hot` | `isHot === true` | Celebratory. Big count-up on **annual savings**. Strong CTA: "Lock in these savings — enter your email." |
| `positive` | `annualSaving > 0 && !isHot` | Encouraging. Show savings, softer CTA: "See your full breakdown — enter your email." |
| `none` | `annualSaving <= 0` | Honest + respectful: "You're already on a competitive rate." Still offer email, framed as "get a tailored review." Lead stored as cold. **Never** show a fake positive. |

Map a variant in the view-model; let the animated component pick visuals/motion per variant.

## View-model (the boundary type)

```ts
// lib/viewModel.ts
import type { AnalyzeResponse } from '@/types/contract';

export type ResultVariant = 'hot' | 'positive' | 'none';

export type AnalyzeViewModel = {
  variant: ResultVariant;
  // raw numbers for count-up / motion (animated components animate these)
  annualSavingRaw: number;
  monthlySavingRaw: number;
  pctSavingRaw: number;            // 0..1
  // preformatted display strings (locale-aware)
  annualSavingText: string;        // "$7,680"  (headline)
  monthlySavingText: string;       // "$640/mo"
  pctSavingText: string;           // "18%"
  periodText: string;              // "Sep 1 – Sep 30, 2024"
  currency: string;
  analysisId: string;              // opaque, for /lead
};

export function toViewModel(r: AnalyzeResponse): AnalyzeViewModel {
  const variant: ResultVariant =
    r.isHot ? 'hot' : r.annualSaving > 0 ? 'positive' : 'none';
  const money = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency', currency: r.currency, maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n))); // headline shows magnitude; sign conveyed by variant/copy
  return {
    variant,
    annualSavingRaw: r.annualSaving,
    monthlySavingRaw: r.monthlySaving,
    pctSavingRaw: r.pctSaving,
    annualSavingText: money(r.annualSaving),
    monthlySavingText: `${money(r.monthlySaving)}/mo`,
    pctSavingText: `${Math.round(Math.abs(r.pctSaving) * 100)}%`,
    periodText: formatPeriod(r.periodStart, r.periodEnd), // your helper
    currency: r.currency,
    analysisId: r.analysisId,
  };
}
```

> For the `none` variant, don't render a negative dollar amount as the hero — lead with the honest copy and optionally show the percentage difference small. The view-model gives raw values if the team wants to animate them.

## Client-side file validation (mirror the server, never replace it)

```ts
// lib/validation/file.ts
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFileClient(files: FileList | File[]): string | null {
  const arr = Array.from(files);
  if (arr.length !== 1) return 'Upload exactly one file.';
  const f = arr[0];
  if (f.type !== 'application/pdf') return 'File must be a PDF.';
  if (f.size > MAX_FILE_BYTES) return 'File must be 10MB or smaller.';
  if (f.size === 0) return 'That file looks empty.';
  return null; // ok
}
```

This is UX-only (fast feedback). The server still re-checks mime + magic byte + size + page count — the client check is not a security boundary.

## API client shape

```ts
// lib/api/client.ts
import type { AnalyzeResponse, LeadResponse, ApiError } from '@/types/contract';

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError };

export async function analyzeStatement(file: File): Promise<ClientResult<AnalyzeResponse>> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/analyze', { method: 'POST', body: fd });
  return toClientResult<AnalyzeResponse>(res);
}

export async function submitLead(analysisId: string, email: string): Promise<ClientResult<LeadResponse>> {
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, email }),
  });
  return toClientResult<LeadResponse>(res);
}
```

`toClientResult` parses JSON, returns `{ ok:true, data }` on 2xx, else `{ ok:false, status, error }` with a safe fallback `ApiError` if the body isn't the expected envelope. Branch on `status` + `error.error`, never on message text.

## Adaptation: wiring into the animated components

1. Get the component inventory + prop expectations from the frontend team (drop zone, loader, result card, email form, success/error states).
2. Provide a single container (e.g. `app/page.tsx` client island or a `CalculatorContainer`) that owns the hooks/state machine and renders the right animated component per state, passing the view-model + callbacks.
3. Keep animated components prop-driven and side-effect-free. If their component triggers `fetch` itself, refactor that out into your hook.
4. Respect the animation team's entry/exit timing — expose state transitions cleanly so they can hook enter/leave animations (e.g. count-up starts when `result` mounts).

### Suggested container skeleton

```tsx
'use client';
function CalculatorContainer() {
  const analyze = useAnalyze();
  const lead = useLead(analyze.result?.analysisId);

  switch (analyze.state) {
    case 'idle':       return <AnimatedDropzone onFile={analyze.analyze} error={analyze.fileError} />;
    case 'analyzing':  return <AnimatedLoader />;
    case 'uploadError':return <AnimatedError error={analyze.error} onRetry={analyze.reset} />;
    case 'result':     return (
      <AnimatedResult
        vm={toViewModel(analyze.result!)}
        leadState={lead.state}
        leadError={lead.error}
        onSubmitEmail={lead.submit}
        onReset={analyze.reset}
      />
    );
  }
}
```

(Names illustrative — match the animation team's actual components.)

## Hooking strategy (what makes Marcus trust + convert)

- **Headline = annual net savings**, count-up animated. Biggest credible number.
- Anchor it to **his** numbers: echo the statement period and his processed volume so it reads as "your data," not a generic teaser.
- Show monthly + % as supporting detail (credibility, not hype).
- Reveal value **before** the email field. Email ask should feel like "send me this breakdown," not a paywall.
- Make the `none` state graceful — a respected honest answer keeps trust (and a cold lead) instead of a bounce.

## Security & privacy rules for the frontend

- **Never** log, persist (localStorage/sessionStorage), or send the file/extracted financials anywhere except the `/api/analyze` request. No analytics payloads containing statement data.
- Talk only to same-origin `/api/*`. No Supabase client, no service keys in the browser.
- Treat `analysisId` as an opaque token; keep it in component state/memory, not in the URL or storage.
- Don't surface raw error codes/fields to users — map to friendly copy (see `03-api-contract.md`).
- Sanitize/limit what you render from the API (numbers + known strings only).

## Battle-tested checklist (before "done")

- [ ] Double-submit guard: disable upload while `analyzing`; disable email submit while `submittingLead`.
- [ ] Drag-drop **and** click-to-browse both validated by `validateFileClient`.
- [ ] Wrong file type / >10MB / empty / multiple files → friendly inline error, no request sent.
- [ ] `analyzing` has a real loader; never a frozen screen (parse can take a moment).
- [ ] All three result variants render correctly, incl. `none` (negative/zero) — manually force each.
- [ ] Email: client-side format check + server `INVALID_EMAIL` handling; valid email enables submit.
- [ ] `409 EMAIL_ALREADY_SET` → treated as success.
- [ ] `404` on `/lead` → "session expired, recalculate" path back to `idle`.
- [ ] `429` → friendly "try again in a moment" on both endpoints.
- [ ] Network failure / 500 → retryable error, app never gets stuck.
- [ ] `reset()` fully clears file, result, analysisId, errors.
- [ ] No statement data in logs, storage, URLs, or third-party calls.
- [ ] Works on mobile widths (Marcus may be on a phone).

## Frontend build order (fits the 5-hour budget)

1. `types/contract.ts` + `lib/api/client.ts` + `lib/validation/file.ts` — ~30m
2. `hooks/useAnalyze.ts` + `hooks/useLead.ts` (state machine) — ~45m
3. `lib/viewModel.ts` + formatting helpers — ~20m
4. `CalculatorContainer` wiring with placeholder (unstyled) components — ~30m, prove the full flow end-to-end against the API
5. Adapt onto the animated components from the frontend team — remaining time
6. Battle-tested checklist pass — ~30m

Build and verify the flow with plain placeholder components **first**; swap in the animations last. That keeps logic correctness independent of animation churn.
