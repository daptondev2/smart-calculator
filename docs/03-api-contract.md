# 03 — API Contract

The exact wire contract between your integration layer and the backend route handlers. Copy-paste types are in [`types/contract.ts`](./types/contract.ts).

Both endpoints are same-origin (`/api/...`), public, JSON responses. All error responses share one envelope.

---

## `POST /api/analyze`

Upload one Stripe statement PDF, get the savings calculation.

**Request:** `multipart/form-data`

| Field | Type | Notes |
| --- | --- | --- |
| `file` | File (PDF) | exactly one; ≤10MB; `application/pdf` |

```ts
const fd = new FormData();
fd.append('file', file);            // a single File from <input type=file> / drop
await fetch('/api/analyze', { method: 'POST', body: fd });
// do NOT set Content-Type manually — the browser sets the multipart boundary
```

**Success — `200`**

```jsonc
{
  "analysisId": "b3f1c2e4-...",   // uuid — pass to /api/lead
  "monthlySaving": 640.00,         // net; CAN be negative
  "annualSaving": 7680.00,         // HEADLINE; net; CAN be negative
  "pctSaving": 0.18,               // 0..1 (18%); CAN be negative
  "isHot": true,                   // annualSaving >= threshold
  "periodStart": "2024-09-01",     // ISO date
  "periodEnd": "2024-09-30",       // ISO date
  "currency": "USD"
}
```

**Errors**

| Status | `error` code | When | Frontend message (suggested) |
| --- | --- | --- | --- |
| `400` | `INVALID_FILE` | wrong mime, not a PDF, magic-byte fail, multiple/zero files | "Please upload a single PDF statement." |
| `400` | `FILE_TOO_LARGE` | > 10MB | "That file is too large (max 10MB)." |
| `422` | `PARSE_FAILED` | couldn't read a **critical** field (`grossVolume`/`totalFees`) — `field` names which | "We couldn't read your statement. Make sure it's an unmodified Stripe monthly statement." |
| `422` | `VALIDATION_FAILED` | numbers failed sanity (fees ≥ volume, bad dates, period > 366d) | same as above |
| `429` | `RATE_LIMITED` | too many requests from IP | "Too many tries — give it a minute and retry." |
| `500` | `INTERNAL` | unexpected | "Something went wrong on our end. Try again." |

---

## `POST /api/lead`

Attach the merchant's email to a prior analysis (step 2 of the value-first flow).

**Request:** `application/json`

```ts
type LeadRequest = { analysisId: string; email: string };
await fetch('/api/lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ analysisId, email }),
});
```

**Success — `200`**

```json
{ "ok": true }
```

**Errors**

| Status | `error` code | When | Frontend message (suggested) |
| --- | --- | --- | --- |
| `400` | `INVALID_EMAIL` | email fails validation | "Please enter a valid email." |
| `400` | `INVALID_BODY` | missing fields / bad JSON | "Something went wrong — please retry." |
| `404` | `ANALYSIS_NOT_FOUND` | unknown `analysisId` | "Your session expired — recalculate to continue." |
| `409` | `EMAIL_ALREADY_SET` | email already attached (set-once) | treat as success-ish: "You're already on the list." |
| `429` | `RATE_LIMITED` | rate limited | "Too many tries — give it a minute." |
| `500` | `INTERNAL` | unexpected | "Something went wrong on our end." |

---

## Shared error envelope

Every non-2xx returns:

```ts
type ApiError = {
  error: string;     // machine code from the tables above
  message: string;   // human-friendly fallback string
  field?: string;    // present on PARSE_FAILED / VALIDATION_FAILED
};
```

Your client should:
1. Branch on **HTTP status + `error` code** (stable contract), not on `message` text.
2. Fall back to a generic message if `error` is unrecognized (future-proofing).
3. Never surface raw `field`/internal codes to the user verbatim — map to the friendly copy above.

---

## Contract invariants the frontend can rely on

- `analysisId` is opaque; pass it through unchanged from `/analyze` to `/lead`.
- `annualSaving`, `monthlySaving`, `pctSaving` may be **≤ 0** — always handle the no-savings branch.
- `annualSaving ≈ monthlySaving * 12` and `monthlySaving ≈ annualSaving / 12` (rounding aside) — pick `annualSaving` as the headline.
- All money values are in **major units** (dollars, not cents) of `currency`. Format with `Intl.NumberFormat`.
- `isHot` is the server's lead-quality verdict; don't recompute thresholds client-side.
