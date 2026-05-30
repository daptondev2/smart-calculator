/**
 * Footer — dark footer in the design-two "reveal" aesthetic.
 *
 * Server component (no hooks/state). Product wordmark + short blurb, a few
 * minimal placeholder links, and small print. Renders on the dark
 * .design-two-root the orchestrator wraps the page in, so it reads tokens via
 * literal hex / var(--d2-*).
 */

const SECTION_LINKS = [
  { label: 'Fees', href: '#fees' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Compare', href: '#comparison' },
  { label: 'Stories', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
] as const;

const LEGAL_LINKS = ['Privacy', 'Terms', 'Security'] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t px-5 py-14" style={{ borderColor: 'var(--d2-border)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand + blurb */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-[12px] font-mono text-xs font-bold tabular-nums"
                style={{
                  background: 'color-mix(in srgb, var(--d2-reveal) 16%, var(--d2-elevated))',
                  color: 'var(--d2-reveal)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--d2-reveal) 35%, transparent)',
                }}
              >
                EPD
              </span>
              <span className="font-sans text-base font-bold tracking-tight" style={{ color: 'var(--d2-text)' }}>
                Smart Calculator
              </span>
            </div>
            <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
              Read your real Stripe statement and see the exact savings of switching to EPD&rsquo;s flat 1.5% rate. No
              sliders, no estimates &mdash; just your numbers.
            </p>
          </div>

          {/* Section nav */}
          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-muted)' }}>
              Explore
            </h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              {SECTION_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-[44px] items-center font-sans text-sm transition-colors outline-none hover:text-[var(--d2-text)] focus-visible:ring-2 focus-visible:ring-[var(--d2-reveal)]"
                    style={{ color: 'var(--d2-text2)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Small print */}
        <div
          className="mt-12 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'var(--d2-border)' }}
        >
          <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
            &copy; {year} EPD Smart Calculator. Rates shown are standard published pricing and illustrative; your report
            uses your actual statement.
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL_LINKS.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="font-sans text-xs transition-colors outline-none hover:text-[var(--d2-text2)] focus-visible:ring-2 focus-visible:ring-[var(--d2-reveal)]"
                  style={{ color: 'var(--d2-muted)' }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 font-sans text-xs" style={{ color: 'var(--d2-muted)', opacity: 0.7 }}>
          Not affiliated with or endorsed by Stripe, Inc. Stripe is a trademark of its respective owner.
        </p>
      </div>
    </footer>
  );
}
