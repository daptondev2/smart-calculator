/**
 * Comparison — Stripe vs EPD, the "reveal" theme (dark, electric-green win column).
 *
 * Two-column card layout (Stripe = muted/steel, EPD = reveal-green "win"), plus a
 * feature/fee matrix below. Real product rates only: Stripe 2.9% + $0.30/charge,
 * EPD flat 1.5% with no per-transaction fee. Numbers/% use font-mono + tabular-nums.
 *
 * CSS/Tailwind-only motion: rows fade-up on a small stagger; the reveal-green
 * accent on the EPD side glows softly. No JS, no framer-motion. The global
 * prefers-reduced-motion guard in globals.css neutralizes every animation here.
 *
 * Server component (no hooks/state) — anchor id="comparison".
 */

type Mark = 'good' | 'bad';

interface Row {
  /** Feature / fee label. */
  label: string;
  /** Stripe side: a value string (rendered mono) or a yes/no mark. */
  stripe: string | Mark;
  /** EPD side: a value string (rendered mono) or a yes/no mark. */
  epd: string | Mark;
}

const ROWS: Row[] = [
  { label: 'Per-transaction rate', stripe: '2.9%', epd: '1.5%' },
  { label: 'Per-charge fixed fee', stripe: '+ $0.30', epd: 'None' },
  { label: 'Flat, predictable pricing', stripe: 'bad', epd: 'good' },
  { label: 'Priced on your real statement', stripe: 'bad', epd: 'good' },
  { label: 'Setup fee', stripe: 'None', epd: 'None' },
  { label: 'Long-term contract', stripe: 'good', epd: 'good' },
];

export function Comparison() {
  return (
    <section
      id="comparison"
      aria-labelledby="comparison-heading"
      className="relative px-5 py-20 font-sans sm:py-28"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        {/* Eyebrow + heading */}
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--d2-trust)', animation: 'sc-fade-up 480ms var(--d2-ease-out) both' }}
        >
          Stripe vs EPD
        </p>
        <h2
          id="comparison-heading"
          className="mt-4 text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          The same volume. A lower rate.
        </h2>
        <p
          className="mt-4 max-w-[52ch] text-pretty text-center text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
        >
          We read the fees on your real Stripe statement and recompute them on EPD&rsquo;s
          flat rate. No per-charge fee, no surprises.
        </p>

        {/* Two-column header cards */}
        <div
          className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
          style={{ animation: 'sc-fade-up 480ms var(--d2-ease-out) 240ms both' }}
        >
          {/* Stripe (steel / current) */}
          <article
            className="flex flex-col gap-2 rounded-[20px] border px-6 py-7"
            style={{ background: 'var(--d2-elevated)', borderColor: 'var(--d2-border)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--d2-muted)' }}>
              Today on Stripe
            </span>
            <p className="font-mono text-3xl font-bold tabular-nums" style={{ color: 'var(--d2-text)' }}>
              2.9%{' '}
              <span className="text-xl font-semibold" style={{ color: 'var(--d2-text2)' }}>
                + $0.30
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--d2-text2)' }}>
              Per successful charge — the fixed fee stacks up fast on smaller tickets.
            </p>
          </article>

          {/* EPD (reveal-green "win") */}
          <article
            className="relative flex flex-col gap-2 overflow-hidden rounded-[20px] border px-6 py-7"
            style={{
              background: 'var(--d2-elevated)',
              borderColor: 'color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))',
              boxShadow: '0 0 48px -16px var(--d2-reveal)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[60px]"
              style={{ background: 'color-mix(in srgb, var(--d2-reveal) 30%, transparent)' }}
            />
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--d2-reveal)' }}>
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--d2-reveal)' }} />
              Switching to EPD
            </span>
            <p className="font-mono text-3xl font-bold tabular-nums" style={{ color: 'var(--d2-reveal)' }}>
              1.5%{' '}
              <span className="text-xl font-semibold" style={{ color: 'var(--d2-positive)' }}>
                flat
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--d2-text2)' }}>
              Flat rate, no per-transaction fee. The savings grow with every charge.
            </p>
          </article>
        </div>

        {/* Feature / fee matrix */}
        <div
          className="mt-6 w-full overflow-hidden rounded-[20px] border"
          style={{ background: 'var(--d2-elevated)', borderColor: 'var(--d2-border)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 320ms both' }}
        >
          {/* Column header */}
          <div
            className="grid grid-cols-[1fr_88px_88px] items-center gap-2 border-b px-5 py-3 sm:grid-cols-[1fr_120px_120px]"
            style={{ borderColor: 'var(--d2-border)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-muted)' }}>
              Detail
            </span>
            <span className="text-center text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-text2)' }}>
              Stripe
            </span>
            <span className="text-center text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-reveal)' }}>
              EPD
            </span>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_88px_88px] items-center gap-2 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_120px_120px]"
              style={{
                borderColor: 'var(--d2-border)',
                animation: `sc-fade-up 420ms var(--d2-ease-out) ${360 + i * 60}ms both`,
              }}
            >
              <span className="text-sm" style={{ color: 'var(--d2-text)' }}>
                {row.label}
              </span>
              <Cell value={row.stripe} side="stripe" />
              <Cell value={row.epd} side="epd" />
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--d2-muted)' }}>
          Rates shown are EPD&rsquo;s flat 1.5% and Stripe&rsquo;s standard 2.9% + $0.30 per charge.
          Your exact savings are computed from your own statement.
        </p>
      </div>
    </section>
  );
}

function Cell({ value, side }: { value: string | Mark; side: 'stripe' | 'epd' }) {
  const isEpd = side === 'epd';

  if (value === 'good') {
    return (
      <div className="flex justify-center">
        <CheckIcon color={isEpd ? 'var(--d2-reveal)' : 'var(--d2-positive)'} />
      </div>
    );
  }
  if (value === 'bad') {
    return (
      <div className="flex justify-center">
        <CrossIcon color="var(--d2-muted)" />
      </div>
    );
  }
  return (
    <span
      className="text-center font-mono text-sm font-semibold tabular-nums"
      style={{ color: isEpd ? 'var(--d2-reveal)' : 'var(--d2-text2)' }}
    >
      {value}
    </span>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Yes"
      role="img"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon({ color }: { color: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="No"
      role="img"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
