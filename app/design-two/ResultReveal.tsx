'use client';

/**
 * ResultReveal — beat orchestration for hot / positive / none.
 *
 * HOT beat sequence (driven by timed state flips + the useCountUp `start` gate):
 *   Beat 0 (inhale): bar-to-100 hold is owned by the loader→result transition;
 *                    here we open with a 120ms hold before anything paints.
 *   Beat 1 (anchor): anchor line + kicker fade in FIRST. Nothing green yet
 *                    (text/blue only).
 *   Beat 2 (count-up): RevealNumber starts (blur(6px)+scale(.85) → focus,
 *                      ~2.0s ease-out from 0); green at 70%, glow off.
 *   Beat 3 (settle): overshoot bounce; green → full brightness + box-glow blooms
 *                    + ONE sc-shockwave ring + the label snaps in.
 *   Beat 4 (stats): monthly + pct rise, sub-headline, then the email gate
 *                   staggers up. aria-live announces the final figure HERE.
 *
 * POSITIVE: softer green, count-up ~1.4s, NO blur/overshoot/ring/glow.
 * NONE: steel, NO count-up, NO green — a verified-seal sc-draw replaces the
 *   number (earned-trust beat). Built with equal care; never red, never fake.
 *
 * Reduced motion: every beat resolves immediately (no count-up/blur/overshoot/
 * ring); the oversized green tabular number + label STILL render so hierarchy
 * carries the celebration. The NONE seal renders statically. Detected via
 * prefersReducedMotion() to also collapse the beat timeline.
 *
 * A11y: focus moves to the result heading on mount; the count-up is aria-hidden
 * during the run and the final figure is announced once, politely, after Beat 3.
 */

import { useEffect, useRef, useState } from 'react';
import type { AnalyzeViewModel } from '@/lib/viewModel';
import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import { prefersReducedMotion } from '@/lib/motion';
import RevealNumber from './RevealNumber';
import EmailGateReveal from './EmailGateReveal';
import { RESULT, anchorLine, disclosureBody, noneDiff } from './copy';

interface ResultRevealProps {
  vm: AnalyzeViewModel;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  onSubmitEmail: (email: string) => void;
  onReset: () => void;
  onRecalculate: () => void;
  /** Clears a retryable lead error (lead.reset) — preserves the typed email. */
  onLeadRetry: () => void;
  /** Email text owned by the page (preserved across retryable lead errors). */
  email: string;
  onEmailChange: (v: string) => void;
}

// Beat timeline anchors (ms from mount). Reduced motion collapses these to 0.
// anchor: when the anchor line/heading fades in (Beat 1).
// count:  when the count-up gate flips (Beat 2). Settle/stats are derived from
//         the per-variant count-up duration below.
const BEAT = { anchor: 120, count: 700 };

export default function ResultReveal({
  vm,
  leadState,
  leadError,
  emailError,
  onSubmitEmail,
  onReset,
  onRecalculate,
  onLeadRetry,
  email,
  onEmailChange,
}: ResultRevealProps) {
  const reduced = prefersReducedMotion();
  const isHot = vm.variant === 'hot';
  const isPositive = vm.variant === 'positive';
  const isNone = vm.variant === 'none';

  const headingRef = useRef<HTMLHeadingElement>(null);

  // Beat gates. Under reduced motion they all start "done" so the static
  // big number + label appear immediately.
  const [beat1, setBeat1] = useState(reduced); // anchor visible
  const [beat2, setBeat2] = useState(reduced); // count-up started
  const [beat3, setBeat3] = useState(reduced); // settle (full green/glow/ring)
  const [beat4, setBeat4] = useState(reduced); // stats + sub + gate
  const [announce, setAnnounce] = useState(reduced ? buildAnnounce(vm) : '');

  // Drive the timeline. NONE has no count-up beats — it reveals anchor → seal →
  // stats directly. Positive count-up is shorter; the settle beat is a no-op for
  // it (no ring/glow), but Beat 4 still needs to fire to mount the stats/gate.
  useEffect(() => {
    if (reduced) {
      headingRef.current?.focus();
      return;
    }
    const timers: number[] = [];
    const countDur = isHot ? 2000 : 1400;
    const settleAt = BEAT.count + countDur;
    const statsAt = settleAt + 200;

    timers.push(window.setTimeout(() => setBeat1(true), BEAT.anchor));
    if (isNone) {
      // No count-up: seal draws after the anchor, stats follow.
      timers.push(window.setTimeout(() => setBeat3(true), BEAT.anchor + 360));
      timers.push(window.setTimeout(() => setBeat4(true), BEAT.anchor + 700));
    } else {
      timers.push(window.setTimeout(() => setBeat2(true), BEAT.count));
      timers.push(
        window.setTimeout(() => {
          setBeat3(true);
          setAnnounce(buildAnnounce(vm)); // announce the figure at the reveal
        }, settleAt),
      );
      timers.push(window.setTimeout(() => setBeat4(true), statsAt));
    }
    // Focus the heading on mount (anchor heading is rendered immediately).
    headingRef.current?.focus();
    return () => timers.forEach((t) => window.clearTimeout(t));
    // vm is stable per result; intentionally run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accent system per variant.
  const accent = isHot ? 'var(--d2-reveal)' : isPositive ? 'var(--d2-positive)' : 'var(--d2-none)';
  const ctaLabel = isHot ? RESULT.hotCta : isPositive ? RESULT.positiveCta : RESULT.noneCta;
  const accentInk = '#06121f'; // dark ink reads AA on all three light-ish accents

  return (
    <div className="relative flex w-full flex-col items-center gap-8">
      {/* Polite, single post-reveal announcement of the final figure. */}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      {/* ---- Beat 1: anchor line + kicker (nothing green yet) ---- */}
      <div
        className="flex flex-col items-center gap-1 text-center"
        style={{ opacity: beat1 ? 1 : 0, transition: 'opacity 360ms var(--d2-ease-out)' }}
      >
        <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
          {anchorLine(vm.periodText)}
        </p>
        {!isNone && (
          <p className="font-sans text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--d2-trust)' }}>
            {RESULT.kicker}
          </p>
        )}
      </div>

      {/* ---- The card: number/seal + label ---- */}
      <div
        className="relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-[20px] border px-6 py-10"
        style={{
          background: 'var(--d2-elevated)',
          borderColor: isHot && beat3 ? 'color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))' : 'var(--d2-border)',
          boxShadow: isHot && beat3 && !reduced ? '0 0 60px -10px var(--d2-reveal)' : 'none',
          transition: 'box-shadow 520ms var(--d2-ease-out), border-color 520ms var(--d2-ease-out)',
        }}
      >
        {isNone ? (
          <NoneSeal />
        ) : (
          <RevealNumber
            target={Math.max(0, Math.round(vm.annualSavingRaw))}
            currency={vm.currency}
            tone={isHot ? 'hot' : 'positive'}
            start={beat2}
            settle={beat3}
          />
        )}

        {/* Heading / label. For HOT/POSITIVE it's the savings label that snaps in
            at settle; for NONE it's the honesty headline. It is the focus target. */}
        {isNone ? (
          <div className="flex flex-col items-center gap-2 text-center" style={{ opacity: beat1 ? 1 : 0, transition: 'opacity 360ms var(--d2-ease-out)' }}>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-sans text-2xl font-bold outline-none"
              style={{ color: 'var(--d2-text)' }}
            >
              {RESULT.noneHeading}
            </h2>
            <p className="max-w-[42ch] font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
              {RESULT.noneSub}
            </p>
          </div>
        ) : (
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] outline-none"
            style={{
              color: 'var(--d2-text2)',
              opacity: beat3 ? 1 : 0,
              transition: 'opacity 280ms var(--d2-ease-out)',
            }}
          >
            {isHot ? RESULT.hotLabel : RESULT.positiveLabel}
          </h2>
        )}
      </div>

      {/* ---- Beat 4: supporting stats + sub-headline ---- */}
      <div
        className="flex w-full flex-col items-center gap-5"
        style={{ opacity: beat4 ? 1 : 0, transform: beat4 ? 'none' : 'translateY(8px)', transition: 'opacity 420ms var(--d2-ease-out), transform 420ms var(--d2-ease-out)' }}
      >
        {!isNone && (
          <div className="flex items-center gap-8">
            <Stat value={vm.monthlySavingText} label="per month" accent={accent} />
            <span aria-hidden className="h-8 w-px" style={{ background: 'var(--d2-border)' }} />
            <Stat value={vm.pctSavingText} label="lower than today" accent={accent} />
          </div>
        )}
        {isNone && Number.isFinite(vm.pctSavingRaw) && (
          <p className="font-mono text-sm tabular-nums" style={{ color: 'var(--d2-muted)' }}>
            {noneDiff(vm.pctSavingText)}
          </p>
        )}

        <p className="max-w-[42ch] text-center font-sans text-base font-medium" style={{ color: 'var(--d2-text)' }}>
          {isHot ? RESULT.hotSub : isPositive ? RESULT.positiveSub : null}
        </p>

        {/* Short credibility breakdown — always visible (no gate), no fabricated
            figures. Slots in with Beat 4 via the wrapper's stagger. */}
        <div className="w-full max-w-[440px] text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-muted)' }}>
            {RESULT.disclosureHeading}
          </p>
          <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
            {disclosureBody(vm.periodText)}
          </p>
        </div>

        {/* ---- Email gate (slides up as the unlocked reward) ---- */}
        <div className="w-full max-w-[440px]">
          <EmailGateReveal
            ctaLabel={ctaLabel}
            accent={accent}
            accentInk={accentInk}
            email={email}
            onEmailChange={onEmailChange}
            leadState={leadState}
            leadError={leadError}
            emailError={emailError}
            onSubmit={onSubmitEmail}
            onRetry={onLeadRetry}
            onRecalculate={onRecalculate}
          />
        </div>

        <button
          type="button"
          onClick={onReset}
          className="font-sans text-xs underline-offset-2 hover:underline"
          style={{ color: 'var(--d2-muted)' }}
        >
          {RESULT.recalculate}
        </button>
      </div>
    </div>
  );
}

function buildAnnounce(vm: AnalyzeViewModel): string {
  if (vm.variant === 'none') return "You're already on a competitive rate.";
  return `Estimated annual savings: ${vm.annualSavingText}.`;
}

function Stat({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-lg font-semibold tabular-nums" style={{ color: accent }}>
        {value}
      </span>
      <span className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
        {label}
      </span>
    </div>
  );
}

/** NONE: a calm verified-seal stroke-draw (steel) replacing the dollar reveal. */
function NoneSeal() {
  return (
    <div className="grid place-items-center py-4">
      <svg width={96} height={96} viewBox="0 0 96 96" fill="none" stroke="var(--d2-none)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={48} cy={48} r={40} strokeDasharray={252} strokeDashoffset={252} style={{ animation: 'sc-draw 700ms var(--d2-ease-out) 200ms forwards' }} />
        <path d="M30 48l12 12 24-24" strokeDasharray={72} strokeDashoffset={72} style={{ animation: 'sc-draw 500ms var(--d2-ease-out) 700ms forwards' }} />
      </svg>
    </div>
  );
}
