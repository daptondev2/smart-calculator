'use client';

/**
 * design-three · "THE STRAIGHT LINE" — client container.
 *
 * The shortest path from a phone to a credible number on the merchant's own
 * data. One action per screen, auto-advance, no urgency, calm pacing.
 *
 * Owns:
 *   - the analyze + lead hooks (shared layer; never fetch directly).
 *   - the email INPUT TEXT (local useState), preserved across retryable lead
 *     errors — the hook owns submission state, the route owns the value.
 *
 * Layout: scoped under `.design-three-root`; min-h-[100dvh] with safe-area
 * insets; single column max-w-[560px] ALWAYS (even desktop), centered. Content
 * is bottom-weighted so primary actions (CTA / submit) sit in the lower thumb
 * zone on mobile.
 *
 * state → component:
 *   idle                    → HeroCalc + DropzoneCalm
 *   analyzing               → AnalyzingRing
 *   uploadError|rateLimited → ErrorPanelCalm
 *   result                  → ResultCalm (hot/positive/none + in-place gate)
 */
import { useState } from 'react';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useLead } from '@/hooks/useLead';
import { toViewModel } from '@/lib/viewModel';
import HeroCalc from './HeroCalc';
import DropzoneCalm from './DropzoneCalm';
import AnalyzingRing from './AnalyzingRing';
import ResultCalm from './ResultCalm';
import ErrorPanelCalm from './ErrorPanelCalm';

export default function DesignThreePage() {
  const analyze = useAnalyze();
  const lead = useLead(analyze.result?.analysisId ?? null);

  // The route owns the email text so it survives retryable lead errors.
  const [email, setEmail] = useState('');

  // Reset both flows AND the local email when starting over / recalculating.
  const startOver = () => {
    lead.reset();
    setEmail('');
    analyze.reset();
  };

  const isErrorState = analyze.state === 'uploadError' || analyze.state === 'rateLimited';

  return (
    <main
      className="design-three-root flex min-h-[100dvh] flex-col items-center px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]"
    >
      {/* Single column, ALWAYS. Bottom-weighted so the primary action falls in
          the lower thumb zone on mobile; centered with comfortable margins on
          desktop. */}
      <div className="flex w-full max-w-[560px] flex-1 flex-col justify-center py-8">
        {analyze.state === 'idle' ? (
          <div className="flex flex-col gap-8">
            <HeroCalc />
            <DropzoneCalm
              onFileSelected={analyze.analyze}
              fileError={analyze.fileError}
              disabled={false}
            />
          </div>
        ) : null}

        {analyze.state === 'analyzing' ? <AnalyzingRing /> : null}

        {isErrorState && analyze.error ? (
          <ErrorPanelCalm error={analyze.error} onRetry={startOver} />
        ) : null}

        {analyze.state === 'result' && analyze.result ? (
          <ResultCalm
            vm={toViewModel(analyze.result)}
            leadState={lead.state}
            leadError={lead.error}
            emailError={lead.emailError}
            email={email}
            onEmailChange={setEmail}
            onSubmitEmail={() => lead.submit(email)}
            onReset={startOver}
            onRecalculate={startOver}
          />
        ) : null}
      </div>
    </main>
  );
}
