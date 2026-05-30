'use client';

/**
 * Owns the upload + analyze state machine.
 *
 *   idle ──analyze(file)──> [client-valid?] ──no──> idle (+fileError, no request)
 *                                          └─yes──> analyzing
 *   analyzing ──200──────────────────────────────> result
 *             ──429──────────────────────────────> rateLimited
 *             ──400/422/500/network──────────────> uploadError
 *   (result | uploadError | rateLimited) ─reset()─> idle
 *
 * Double-submit guarded: analyze() is a no-op while analyzing. reset() bumps an
 * internal request id so a late in-flight resolution is dropped (cancel-safe).
 */
import { useCallback, useRef, useState } from 'react';
import type { AnalyzeResponse, ApiError } from '@/types/contract';
import { analyzeStatement } from '@/lib/api/client';
import { validateFileClient } from '@/lib/validation/file';

export type AnalyzeState = 'idle' | 'analyzing' | 'result' | 'uploadError' | 'rateLimited';

export interface UseAnalyze {
  state: AnalyzeState;
  result: AnalyzeResponse | null;
  error: ApiError | null;
  fileError: string | null;
  analyze: (file: File) => void;
  reset: () => void;
}

const NETWORK_ERROR: ApiError = { error: 'INTERNAL', message: 'Network error' };

export function useAnalyze(): UseAnalyze {
  const [state, setState] = useState<AnalyzeState>('idle');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const reset = useCallback(() => {
    reqIdRef.current += 1; // invalidate any in-flight request
    setState('idle');
    setResult(null);
    setError(null);
    setFileError(null);
  }, []);

  const analyze = useCallback((file: File) => {
    // double-submit guard
    setState((cur) => {
      if (cur === 'analyzing') return cur;

      const msg = validateFileClient([file]);
      if (msg) {
        setFileError(msg);
        return 'idle';
      }

      setFileError(null);
      setError(null);
      setResult(null);

      const reqId = ++reqIdRef.current;
      analyzeStatement(file)
        .then((res) => {
          if (reqId !== reqIdRef.current) return; // stale (reset/newer request)
          if (res.ok) {
            setResult(res.data);
            setState('result');
          } else if (res.status === 429) {
            setError(res.error);
            setState('rateLimited');
          } else {
            setError(res.error);
            setState('uploadError');
          }
        })
        .catch(() => {
          if (reqId !== reqIdRef.current) return;
          setError(NETWORK_ERROR);
          setState('uploadError');
        });

      return 'analyzing';
    });
  }, []);

  return { state, result, error, fileError, analyze, reset };
}
