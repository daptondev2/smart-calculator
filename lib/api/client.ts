/**
 * Typed API client. Public surface is identical whether mock or real.
 *
 * Consumers (hooks/components) import ONLY from this file. Swapping mock → real
 * is a one-line flag flip in `config.ts` (USE_MOCK). The real fetch bodies below
 * are dormant until then.
 *
 * Both `analyzeStatement` and `submitLead` resolve to `ClientResult<T>` for any
 * HTTP outcome. A genuine NETWORK failure REJECTS (throws); callers (the hooks)
 * catch it and synthesize a status-0 error. Branch on `status` + `error.error`,
 * never on message text.
 */
import type {
  AnalyzeResponse,
  LeadResponse,
  ApiError,
  ClientResult,
} from '@/types/contract';
import { USE_MOCK } from '@/lib/api/config';
import { mockAnalyze, mockSubmitLead } from '@/lib/api/mock';

const FALLBACK_ERROR: ApiError = {
  error: 'INTERNAL',
  message: 'Something went wrong on our end. Try again.',
};

/** Parse a fetch Response into a ClientResult, tolerating a malformed envelope. */
async function toClientResult<T>(res: Response): Promise<ClientResult<T>> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (res.ok) {
    return { ok: true, data: body as T };
  }
  const safe: ApiError =
    body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)
      ? (body as ApiError)
      : { ...FALLBACK_ERROR };
  return { ok: false, status: res.status, error: safe };
}

export async function analyzeStatement(file: File): Promise<ClientResult<AnalyzeResponse>> {
  if (USE_MOCK) return mockAnalyze(file);
  const fd = new FormData();
  fd.append('file', file); // do NOT set Content-Type — the browser sets the multipart boundary
  const res = await fetch('/api/analyze', { method: 'POST', body: fd });
  return toClientResult<AnalyzeResponse>(res);
}

export async function submitLead(
  analysisId: string,
  email: string,
): Promise<ClientResult<LeadResponse>> {
  if (USE_MOCK) return mockSubmitLead(analysisId, email);
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, email }),
  });
  return toClientResult<LeadResponse>(res);
}
