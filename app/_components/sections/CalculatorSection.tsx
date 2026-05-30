'use client';

/**
 * CalculatorSection — id="calculator". The on-page entry to the REAL calculator,
 * which is a global PDF-upload dialog (not a slider estimate). The CTA opens the
 * dialog via useCalculatorDialog(). design-two dark "reveal" aesthetic, CSS-only.
 */

import { useCalculatorDialog } from '@/app/_components/calculator/dialog-context';

const STEPS = [
  { n: '1', title: 'Upload your statement', body: 'Drop your latest Stripe statement PDF. It is read securely on our server — never shared.' },
  { n: '2', title: 'We read your real charges', body: 'Your actual processing volume and fees are extracted from the document automatically.' },
  { n: '3', title: 'See your exact savings', body: 'A full breakdown of Stripe (2.9% + $0.30) vs EPD’s flat 1.5% — your numbers, not an estimate.' },
];

export function CalculatorSection() {
  const { open } = useCalculatorDialog();

  return (
    <section id="calculator" className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <span
            className="font-sans text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--d2-reveal)' }}
          >
            The calculator
          </span>
          <h2
            className="mt-3 max-w-2xl font-sans text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: 'var(--d2-text)' }}
          >
            See your exact savings — from your own statement
          </h2>
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
            No sliders, no guesses. Upload one Stripe statement (PDF, up to 4&nbsp;MB) and get a precise,
            line-by-line comparison against EPD’s flat 1.5% rate in seconds.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-[20px] border p-6"
              style={{ background: 'var(--d2-elevated)', borderColor: 'var(--d2-border)' }}
            >
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-[999px] font-mono text-sm font-bold tabular-nums"
                style={{
                  background: 'color-mix(in srgb, var(--d2-reveal) 16%, var(--d2-elevated))',
                  color: 'var(--d2-reveal)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--d2-reveal) 35%, transparent)',
                }}
              >
                {s.n}
              </span>
              <h3 className="mt-4 font-sans text-base font-semibold" style={{ color: 'var(--d2-text)' }}>
                {s.title}
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={open}
            className="inline-flex min-h-[52px] items-center justify-center rounded-[999px] px-8 font-sans text-base font-semibold outline-none transition-[filter,transform] hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--d2-reveal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--d2-bg)]"
            style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
          >
            Analyze my statement
          </button>
          <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
            No account required · Processed securely · Takes about a minute
          </p>
        </div>
      </div>
    </section>
  );
}
