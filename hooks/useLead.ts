'use client';

/**
 * Owns the email-submit state machine (step 2 of the value-first flow).
 *
 *   idle ──submit(email)── [client-valid?] ──no──> idle (+emailError, no request)
 *                                          └─yes──> submitting
 *   submitting ──200 | 409──────────────────────> done        (409 = success)
 *              ──404───────────────────────────> sessionExpired
 *              ──400 INVALID_EMAIL─────────────> idle (+emailError, inline fix)
 *              ──429 | 500 | network───────────> error         (retryable banner)
 *   error ─reset()─> idle (route preserves the typed email in its own state)
 *
 * Double-submit guarded: submit() is a no-op while submitting.
 * The ROUTE owns the email input's text value; this hook owns submission state.
 */
import { useCallback, useRef, useState } from 'react';
import type { ApiError } from '@/types/contract';
import { submitLead } from '@/lib/api/client';

export type LeadState = 'idle' | 'submitting' | 'done' | 'error' | 'sessionExpired';

export interface UseLead {
  state: LeadState;
  error: ApiError | null;
  emailError: string | null;
  submit: (email: string) => void;
  reset: () => void;
}

const NETWORK_ERROR: ApiError = { error: 'INTERNAL', message: 'Network error' };

/** Loose client-side email check (server is authoritative). */
function isEmailish(email: string): boolean {
  const e = email.trim();
  if (!e || e.includes(' ')) return false;
  const at = e.indexOf('@');
  if (at <= 0 || at !== e.lastIndexOf('@')) return false;
  const domain = e.slice(at + 1);
  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

export function useLead(analysisId: string | null): UseLead {
  const [state, setState] = useState<LeadState>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const reset = useCallback(() => {
    reqIdRef.current += 1;
    setState('idle');
    setError(null);
    setEmailError(null);
  }, []);

  const submit = useCallback(
    (email: string) => {
      setState((cur) => {
        if (cur === 'submitting') return cur;

        if (!isEmailish(email)) {
          setEmailError('Please enter a valid email.');
          return 'idle';
        }
        if (!analysisId) {
          return 'sessionExpired';
        }

        setEmailError(null);
        setError(null);

        const reqId = ++reqIdRef.current;
        submitLead(analysisId, email)
          .then((res) => {
            if (reqId !== reqIdRef.current) return;
            if (res.ok || res.status === 409) {
              setState('done'); // 409 EMAIL_ALREADY_SET treated as success
            } else if (res.status === 404) {
              setState('sessionExpired');
            } else if (res.status === 400 && res.error.error === 'INVALID_EMAIL') {
              setEmailError('Please enter a valid email.');
              setState('idle');
            } else {
              setError(res.error);
              setState('error');
            }
          })
          .catch(() => {
            if (reqId !== reqIdRef.current) return;
            setError(NETWORK_ERROR);
            setState('error');
          });

        return 'submitting';
      });
    },
    [analysisId],
  );

  return { state, error, emailError, submit, reset };
}
