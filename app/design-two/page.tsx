'use client';

/**
 * design-two · "THE REVEAL" — client container.
 *
 * Wraps everything in `.design-two-root` so the scoped dark tokens apply.
 * Switches on analyze.state:
 *   idle         → HeroReveal + DropzoneReveal
 *   analyzing    → AnticipationLoader (onCancel = analyze.reset)
 *   result       → redirect to /report/[analysisId] (full breakdown)
 *   uploadError  → ErrorPanelReveal (error = analyze.error)
 *   rateLimited  → ErrorPanelReveal (429 copy)
 *
 * The result is no longer shown inline — once extraction completes we navigate
 * to the persisted report page so the user sees the full breakdown.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalyze } from '@/hooks/useAnalyze';
import HeroReveal from './HeroReveal';
import DropzoneReveal from './DropzoneReveal';
import AnticipationLoader from './AnticipationLoader';
import ErrorPanelReveal from './ErrorPanelReveal';

export default function DesignTwoPage() {
  const analyze = useAnalyze();
  const router = useRouter();

  // Once analysis succeeds, redirect to the full breakdown report.
  useEffect(() => {
    if (analyze.state === 'result' && analyze.result) {
      router.push(`/report/${analyze.result.analysisId}`);
    }
  }, [analyze.state, analyze.result, router]);

  // Keep the loader on screen during the result→navigation hand-off (no flash).
  const showLoader = analyze.state === 'analyzing' || analyze.state === 'result';

  return (
    <main className="design-two-root flex flex-1 items-center justify-center px-5 py-12 font-sans sm:py-20">
      <div className="flex w-full max-w-[600px] flex-col items-center">
        {analyze.state === 'idle' && (
          <div className="flex w-full flex-col items-center gap-10">
            <HeroReveal />
            <div className="w-full" style={{ animation: 'sc-fade-up 480ms var(--d2-ease-out) 320ms both' }}>
              <DropzoneReveal
                onFileSelected={analyze.analyze}
                fileError={analyze.fileError}
                disabled={false}
              />
            </div>
          </div>
        )}

        {showLoader && <AnticipationLoader onCancel={analyze.reset} />}

        {(analyze.state === 'uploadError' || analyze.state === 'rateLimited') && analyze.error && (
          <ErrorPanelReveal error={analyze.error} onRetry={analyze.reset} />
        )}
      </div>
    </main>
  );
}
