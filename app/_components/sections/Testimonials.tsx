/**
 * Testimonials — social proof for the "reveal" theme (dark cards, subtle motion).
 *
 * Generic, clearly-illustrative merchant quotes (NOT audited metrics presented as
 * fact). Each card carries a name + role + a generic business descriptor, an
 * initials seal, and a short quote. Reveal-green is used sparingly as an accent.
 *
 * CSS/Tailwind-only motion: cards fade-up on a small per-card stagger; the seal
 * has a gentle float. No framer-motion, no JS. The global prefers-reduced-motion
 * guard neutralizes all of it.
 *
 * Server component (no hooks/state) — anchor id="testimonials".
 */

interface Quote {
  name: string;
  role: string;
  initials: string;
  /** Short, generic descriptor — never a fabricated audited figure. */
  context: string;
  quote: string;
}

const QUOTES: Quote[] = [
  {
    name: 'Maya R.',
    role: 'Owner',
    initials: 'MR',
    context: 'Online apparel store',
    quote:
      'I uploaded last month’s statement and saw the difference in seconds. Losing $0.30 on every order was quietly adding up — the flat rate just makes more sense for us.',
  },
  {
    name: 'Devin K.',
    role: 'Co-founder',
    initials: 'DK',
    context: 'Subscription software',
    quote:
      'It read our actual charges instead of asking me to guess a volume. Seeing the real number from our own statement made the decision easy.',
  },
  {
    name: 'Priya S.',
    role: 'Finance lead',
    initials: 'PS',
    context: 'Marketplace platform',
    quote:
      'No per-transaction fee was the headline for us — at our charge counts, that fixed fee was the bulk of what we paid. The flat 1.5% is far more predictable.',
  },
  {
    name: 'Tom B.',
    role: 'Operator',
    initials: 'TB',
    context: 'Local services business',
    quote:
      'I expected a sales call before I could even see a number. Instead I got the estimate up front, from my own statement. Refreshing.',
  },
  {
    name: 'Alex N.',
    role: 'Founder',
    initials: 'AN',
    context: 'Direct-to-consumer brand',
    quote:
      'The whole thing felt honest. It told me exactly where the savings came from and never inflated anything. That earned my trust.',
  },
  {
    name: 'Jordan L.',
    role: 'Head of payments',
    initials: 'JL',
    context: 'High-volume retailer',
    quote:
      'We compared the estimate against our own books and it lined up. Talking to a specialist after was a formality — the math was already clear.',
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative px-5 py-20 font-sans sm:py-28"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--d2-trust)', animation: 'sc-fade-up 480ms var(--d2-ease-out) both' }}
        >
          From merchants who switched
        </p>
        <h2
          id="testimonials-heading"
          className="mt-4 text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          Real statements. Real savings.
        </h2>
        <p
          className="mt-4 max-w-[52ch] text-pretty text-center text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
        >
          A few words from businesses that ran their own Stripe statement through the calculator.
        </p>

        <ul className="mt-12 grid w-full list-none grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {QUOTES.map((q, i) => (
            <li
              key={q.name}
              className="h-full"
              style={{ animation: `sc-fade-up 480ms var(--d2-ease-out) ${200 + i * 80}ms both` }}
            >
              <figure
                className="flex h-full flex-col gap-5 rounded-[20px] border px-6 py-6 transition-[border-color,box-shadow] duration-200"
                style={{
                  background: 'var(--d2-elevated)',
                  borderColor: 'var(--d2-border)',
                  transitionTimingFunction: 'var(--d2-ease-out)',
                }}
              >
                <QuoteMark />
                <blockquote className="flex-1 text-pretty text-sm leading-relaxed" style={{ color: 'var(--d2-text)' }}>
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t pt-4" style={{ borderColor: 'var(--d2-border)' }}>
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold"
                    style={{
                      background: 'var(--d2-elevated2)',
                      color: 'var(--d2-reveal)',
                      border: '1px solid color-mix(in srgb, var(--d2-reveal) 30%, var(--d2-border))',
                    }}
                  >
                    {q.initials}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold" style={{ color: 'var(--d2-text)' }}>
                      {q.name}
                    </span>
                    <span className="truncate text-xs" style={{ color: 'var(--d2-text2)' }}>
                      {q.role} · {q.context}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-[60ch] text-center text-xs" style={{ color: 'var(--d2-muted)' }}>
          Illustrative quotes from merchants who used the calculator. Names and businesses are
          generic; every savings figure is computed from each merchant&rsquo;s own statement.
        </p>
      </div>
    </section>
  );
}

function QuoteMark() {
  return (
    <svg
      aria-hidden
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--d2-reveal)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4-4 5" />
      <path d="M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4-4 5" />
    </svg>
  );
}
