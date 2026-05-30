/**
 * Smart Calculator — shared API contract types.
 *
 * Source of truth for the wire shapes between the frontend integration layer
 * and the backend route handlers (`/api/analyze`, `/api/lead`).
 * Copied verbatim from docs/types/contract.ts. See docs/03-api-contract.md.
 */

export type Currency = 'USD' | (string & {});

/* ------------------------------------------------------------------ */
/* POST /api/analyze                                                    */
/* ------------------------------------------------------------------ */

/** Success body (HTTP 200). All money values are in MAJOR units (dollars). */
export interface AnalyzeResponse {
  /** Opaque uuid — pass unchanged to POST /api/lead. */
  analysisId: string;
  /** Net monthly savings vs Stripe. CAN be negative (EPD not cheaper). */
  monthlySaving: number;
  /** Net annual savings — THE headline number. CAN be negative. */
  annualSaving: number;
  /** Savings as a fraction of current Stripe fees, 0..1. CAN be negative. */
  pctSaving: number;
  /** Server's lead-quality verdict (annualSaving >= threshold). Do not recompute client-side. */
  isHot: boolean;
  /** Statement period start (ISO date, e.g. "2024-09-01"). */
  periodStart: string;
  /** Statement period end (ISO date). */
  periodEnd: string;
  /** ISO 4217 currency code from the statement. */
  currency: Currency;
}

/* ------------------------------------------------------------------ */
/* POST /api/lead                                                       */
/* ------------------------------------------------------------------ */

export interface LeadRequest {
  /** From AnalyzeResponse.analysisId. */
  analysisId: string;
  email: string;
}

export interface LeadResponse {
  ok: true;
}

/* ------------------------------------------------------------------ */
/* Errors (shared envelope for both endpoints)                          */
/* ------------------------------------------------------------------ */

/** Stable machine-readable error codes. Branch on these + HTTP status, never on `message`. */
export type ApiErrorCode =
  // /api/analyze
  | 'INVALID_FILE'        // 400 — not a PDF, magic-byte fail, wrong/zero/multiple files
  | 'FILE_TOO_LARGE'      // 400 — > 10MB
  | 'PARSE_FAILED'        // 422 — a critical field couldn't be read (see `field`)
  | 'VALIDATION_FAILED'   // 422 — extracted numbers failed sanity checks (see `field`)
  // /api/lead
  | 'INVALID_EMAIL'       // 400
  | 'INVALID_BODY'        // 400 — malformed/missing JSON fields
  | 'ANALYSIS_NOT_FOUND'  // 404 — unknown analysisId (treat as expired session)
  | 'EMAIL_ALREADY_SET'   // 409 — set-once; frontend treats as success
  // shared
  | 'RATE_LIMITED'        // 429
  | 'INTERNAL';           // 500

export interface ApiError {
  /** One of ApiErrorCode (typed as string to tolerate future additions). */
  error: ApiErrorCode | string;
  /** Human-friendly fallback message. Prefer your own mapped copy over this. */
  message: string;
  /** Present on PARSE_FAILED / VALIDATION_FAILED — which field failed. */
  field?: string;
}

/* ------------------------------------------------------------------ */
/* Client-side result wrapper (frontend integration layer)             */
/* ------------------------------------------------------------------ */

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError };
