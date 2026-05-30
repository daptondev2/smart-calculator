/**
 * FAQ — accordion built on native <details>/<summary> (CSS-only, a11y-friendly).
 *
 * The dark "reveal" theme: each item is an elevated card; the summary row has a
 * focus-visible ring and a chevron that rotates via the [open] attribute (pure
 * CSS, no JS). The answer body fades/slides in with sc-fade-up when opened. The
 * global prefers-reduced-motion guard neutralizes the motion; the disclosure
 * still opens and closes natively.
 *
 * Content covers uploading the Stripe statement PDF, how extraction works, EPD's
 * flat 1.5%, privacy/server-side processing, accuracy, and no-commitment.
 *
 * Server component (no hooks/state) — anchor id="faq".
 */

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: 'What do I need to upload?',
    a: 'A single Stripe monthly statement, exported as a PDF. In Stripe you can find it under Dashboard → Documents → Statements. One unmodified statement is all it takes to see your estimate.',
  },
  {
    q: 'How does the extraction work?',
    a: 'We read the real numbers off your statement — your processing volume, charge count, and the fees Stripe actually billed you. We don’t ask you to guess a volume; the estimate is built from your own figures.',
  },
  {
    q: 'What rate does EPD charge?',
    a: 'EPD is a flat 1.5% per transaction with no per-charge fixed fee. We recompute your statement’s volume at that rate and compare it to what Stripe billed (2.9% + $0.30 per charge) to show the difference.',
  },
  {
    q: 'Is my statement kept private?',
    a: 'Your statement is processed server-side only to produce your estimate, and it is not stored or shared. The figures live in memory for the calculation and nothing about your statement is persisted.',
  },
  {
    q: 'How accurate is the estimate?',
    a: 'It’s based on the actual fees on your statement, annualized over the period it covers, so it reflects your real activity. We keep it conservative and confirm the exact numbers with you on a call before anything changes.',
  },
  {
    q: 'Do I have to commit to anything?',
    a: 'No. You can see your savings number with no account and no sales call required. If you want to go further, a specialist reaches out once — there’s no obligation and no pressure.',
  },
  {
    q: 'What if I’m already on a competitive rate?',
    a: 'Then we’ll tell you that honestly. If switching wouldn’t save you much, the calculator says so rather than inventing a number. The goal is a real comparison, not a sales pitch.',
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative px-5 py-20 font-sans sm:py-28"
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--d2-trust)', animation: 'sc-fade-up 480ms var(--d2-ease-out) both' }}
        >
          Questions
        </p>
        <h2
          id="faq-heading"
          className="mt-4 text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          Everything you might be wondering.
        </h2>

        <div className="mt-10 flex w-full flex-col gap-3">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              className="group rounded-[12px] border [&_summary::-webkit-details-marker]:hidden"
              style={{
                background: 'var(--d2-elevated)',
                borderColor: 'var(--d2-border)',
                animation: `sc-fade-up 420ms var(--d2-ease-out) ${120 + i * 60}ms both`,
              }}
            >
              <summary
                className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 rounded-[12px] px-5 py-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)] focus-visible:ring-offset-0"
                style={{ color: 'var(--d2-text)' }}
              >
                <span className="text-pretty text-base font-medium">{item.q}</span>
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform duration-200 group-open:rotate-45"
                  style={{
                    borderColor: 'var(--d2-border)',
                    color: 'var(--d2-reveal)',
                    transitionTimingFunction: 'var(--d2-ease-out)',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <div
                className="px-5 pb-5 group-open:animate-[sc-fade-up_320ms_var(--d2-ease-out)_both]"
              >
                <p className="max-w-[62ch] text-pretty text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
