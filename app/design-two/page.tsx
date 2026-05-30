'use client';

/**
 * design-two · "THE REVEAL" — client container.
 *
 * Wraps everything in `.design-two-root` so the scoped dark tokens apply. Calls
 * the shared hooks (never fetches directly), owns the email input text, and
 * switches on analyze.state:
 *   idle         → HeroReveal + DropzoneReveal
 *   analyzing    → AnticipationLoader (onCancel = analyze.reset, hatch after 10s)
 *   uploadError  → ErrorPanelReveal (error = analyze.error)
 *   rateLimited  → ErrorPanelReveal (429 copy)
 *   result       → ResultReveal (vm + lead state/handlers)
 *
 * No statement data is persisted, logged, or placed in storage/URL; analysisId
 * lives only in memory inside the hook.
 */

import { useState } from 'react';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useLead } from '@/hooks/useLead';
import { toViewModel } from '@/lib/viewModel';
import HeroReveal from './HeroReveal';
import DropzoneReveal from './DropzoneReveal';
import AnticipationLoader from './AnticipationLoader';
import ResultReveal from './ResultReveal';
import ErrorPanelReveal from './ErrorPanelReveal';

export default function DesignTwoPage() {
  const analyze = useAnalyze();
  const lead = useLead(analyze.result?.analysisId ?? null);
  // The page owns the email text so it survives a retryable lead error.
  const [email, setEmail] = useState('');

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

        {analyze.state === 'analyzing' && <AnticipationLoader onCancel={analyze.reset} />}

        {(analyze.state === 'uploadError' || analyze.state === 'rateLimited') && analyze.error && (
          <ErrorPanelReveal error={analyze.error} onRetry={analyze.reset} />
        )}

        {analyze.state === 'result' && analyze.result && (
          <ResultReveal
            vm={toViewModel(analyze.result)}
            leadState={lead.state}
            leadError={lead.error}
            emailError={lead.emailError}
            onSubmitEmail={lead.submit}
            onReset={analyze.reset}
            onRecalculate={analyze.reset}
            onLeadRetry={lead.reset}
            email={email}
            onEmailChange={setEmail}
          />
        )}
      </div>
    </main>
  );
}
