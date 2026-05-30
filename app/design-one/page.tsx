'use client';

import { useState } from 'react';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useLead } from '@/hooks/useLead';
import { toViewModel } from '@/lib/viewModel';
import Hero from './Hero';
import Dropzone from './Dropzone';
import AnalyzingChecklist from './AnalyzingChecklist';
import ResultAudit from './ResultAudit';
import ErrorPanel from './ErrorPanel';
import { HERO } from './copy';

/**
 * design-one · "THE AUDIT" — client container.
 *
 * Applies the `.design-one-root` scope (tokens live in app/globals.css), calls
 * the shared hooks, owns the email input text (so it survives a retryable lead
 * error), and switches on `analyze.state` → the right screen. Never fetches,
 * never persists/logs statement data, never puts analysisId in the URL.
 */
export default function DesignOnePage() {
  const analyze = useAnalyze();
  const lead = useLead(analyze.result?.analysisId ?? null);

  // The route owns the email text; the lead hook owns submission state.
  const [email, setEmail] = useState('');

  return (
    <main className="design-one-root flex flex-1 flex-col items-center px-4 py-12 sm:py-16 font-sans text-[var(--d1-ink)]">
      <div className="w-full max-w-[640px]">
        {analyze.state === 'idle' ? (
          <div className="flex flex-col items-center">
            <Hero />
            <div className="mt-10 w-full">
              <Dropzone
                onFileSelected={analyze.analyze}
                fileError={analyze.fileError}
                disabled={false}
              />
              <p className="mt-3 text-center font-sans text-[0.8125rem] text-[var(--d1-ink3)]">
                {HERO.conservativeNote}
              </p>
            </div>
          </div>
        ) : null}

        {analyze.state === 'analyzing' ? <AnalyzingChecklist onCancel={analyze.reset} /> : null}

        {analyze.state === 'uploadError' || analyze.state === 'rateLimited' ? (
          <ErrorPanel error={analyze.error!} onRetry={analyze.reset} />
        ) : null}

        {analyze.state === 'result' && analyze.result ? (
          <ResultAudit
            vm={toViewModel(analyze.result)}
            email={email}
            onEmailChange={setEmail}
            leadState={lead.state}
            leadError={lead.error}
            emailError={lead.emailError}
            onSubmitEmail={lead.submit}
            onLeadRetry={lead.reset}
            onReset={analyze.reset}
            onRecalculate={analyze.reset}
          />
        ) : null}
      </div>
    </main>
  );
}
