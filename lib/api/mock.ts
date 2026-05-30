/**
 * Mock implementations of the analyze + lead endpoints.
 *
 * Returns the SAME `ClientResult<T>` shape as the real client, so swapping to
 * the live backend (config.USE_MOCK = false) requires no consumer changes.
 *
 * Scenario selection (priority order):
 *   1. `?mock=<scenario>` query param on the route URL (QA deep-link).
 *   2. A keyword substring in the uploaded File.name (case-insensitive).
 *   3. Default: `positive` (a credible mid-case for a random PDF).
 *
 * PRIVACY: this module NEVER reads file bytes, never logs the file, never
 * stores anything. It only inspects `file.name` (a string) for routing.
 */
import type {
  AnalyzeResponse,
  LeadResponse,
  ClientResult,
  ApiError,
} from '@/types/contract';

type AnalyzeScenario =
  | 'hot'
  | 'positive'
  | 'none'
  | 'parse'
  | 'invalid'
  | 'toolarge'
  | 'ratelimit'
  | 'internal'
  | 'network';

const ANALYZE_LATENCY_MS = 1800;
const ANALYZE_ERROR_LATENCY_MS = 1100;
const LEAD_LATENCY_MS = 700;
const NETWORK_FAIL_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ---- concrete datasets (currency-formatted later by the view-model) ---- */
/* Numbers read credibly for a ~$120k/mo merchant, but NOTHING about volume
   or transaction count is ever exposed — only the contract fields below. */
const HOT: AnalyzeResponse = {
  analysisId: 'mock-hot-0001',
  monthlySaving: 640,
  annualSaving: 7680,
  pctSaving: 0.18,
  isHot: true,
  periodStart: '2024-09-01',
  periodEnd: '2024-09-30',
  currency: 'USD',
};

const POSITIVE: AnalyzeResponse = {
  analysisId: 'mock-pos-0001',
  monthlySaving: 145,
  annualSaving: 1740,
  pctSaving: 0.06,
  isHot: false,
  periodStart: '2024-10-01',
  periodEnd: '2024-10-31',
  currency: 'USD',
};

const NONE: AnalyzeResponse = {
  analysisId: 'mock-none-0001',
  monthlySaving: -35,
  annualSaving: -420,
  pctSaving: -0.015,
  isHot: false,
  periodStart: '2024-08-01',
  periodEnd: '2024-08-31',
  currency: 'USD',
};

function err(error: ApiError['error'], message: string, field?: string): ApiError {
  return field ? { error, message, field } : { error, message };
}

function readQueryScenario(): AnalyzeScenario | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('mock');
  if (!raw) return null;
  return normalizeKeyword(raw.toLowerCase());
}

function normalizeKeyword(s: string): AnalyzeScenario | null {
  if (s.includes('hot')) return 'hot';
  if (s.includes('positive') || s === 'pos') return 'positive';
  if (s.includes('none')) return 'none';
  if (s.includes('parse')) return 'parse';
  if (s.includes('toolarge') || s.includes('large')) return 'toolarge';
  if (s.includes('invalid')) return 'invalid';
  if (s.includes('ratelimit') || s.includes('429')) return 'ratelimit';
  if (s.includes('500') || s.includes('internal')) return 'internal';
  if (s.includes('network')) return 'network';
  return null;
}

function pickAnalyzeScenario(fileName: string): AnalyzeScenario {
  return readQueryScenario() ?? normalizeKeyword((fileName || '').toLowerCase()) ?? 'positive';
}

export async function mockAnalyze(file: File): Promise<ClientResult<AnalyzeResponse>> {
  const scenario = pickAnalyzeScenario(file?.name ?? '');

  if (scenario === 'network') {
    await delay(NETWORK_FAIL_MS);
    // Reject like a real fetch network failure — the hook catches and maps to status 0.
    throw new Error('Network error');
  }

  if (scenario === 'hot' || scenario === 'positive' || scenario === 'none') {
    await delay(ANALYZE_LATENCY_MS);
    const data = scenario === 'hot' ? HOT : scenario === 'positive' ? POSITIVE : NONE;
    return { ok: true, data };
  }

  await delay(ANALYZE_ERROR_LATENCY_MS);
  switch (scenario) {
    case 'parse':
      return { ok: false, status: 422, error: err('PARSE_FAILED', 'Could not read a critical field.', 'totalFees') };
    case 'invalid':
      return { ok: false, status: 400, error: err('INVALID_FILE', 'Please upload a single PDF statement.') };
    case 'toolarge':
      return { ok: false, status: 400, error: err('FILE_TOO_LARGE', 'That file is too large (max 10MB).') };
    case 'ratelimit':
      return { ok: false, status: 429, error: err('RATE_LIMITED', 'Too many requests.') };
    case 'internal':
      return { ok: false, status: 500, error: err('INTERNAL', 'Something went wrong on our end.') };
    default:
      return { ok: true, data: POSITIVE };
  }
}

export async function mockSubmitLead(
  analysisId: string,
  email: string,
): Promise<ClientResult<LeadResponse>> {
  const e = (email || '').toLowerCase();

  if (e.includes('network@')) {
    await delay(NETWORK_FAIL_MS);
    throw new Error('Network error');
  }

  await delay(LEAD_LATENCY_MS);

  if (e.includes('already@')) {
    return { ok: false, status: 409, error: err('EMAIL_ALREADY_SET', 'Email already attached.') };
  }
  if (analysisId === 'EXPIRED' || e.includes('expired@')) {
    return { ok: false, status: 404, error: err('ANALYSIS_NOT_FOUND', 'Unknown analysisId.') };
  }
  if (e.includes('serverbad@')) {
    return { ok: false, status: 400, error: err('INVALID_EMAIL', 'Please enter a valid email.') };
  }
  if (e.includes('ratelimit@')) {
    return { ok: false, status: 429, error: err('RATE_LIMITED', 'Too many requests.') };
  }
  if (e.includes('fail@')) {
    return { ok: false, status: 500, error: err('INTERNAL', 'Something went wrong on our end.') };
  }
  return { ok: true, data: { ok: true } };
}
