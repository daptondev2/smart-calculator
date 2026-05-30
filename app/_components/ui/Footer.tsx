/**
 * Footer — dark footer in the design-two "reveal" aesthetic.
 *
 * Server component (no hooks/state). A single merged section: product wordmark +
 * short blurb, legal links, copyright and disclaimer small print. Renders on the
 * dark .design-two-root the orchestrator wraps the page in, so it reads tokens
 * via literal hex / var(--d2-*).
 */

const LEGAL_LINKS = ['Privacy', 'Terms', 'Security'] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t px-5 py-10 sm:py-12" style={{ borderColor: 'var(--d2-border)' }}>
      <div className="mx-auto max-w-5xl">
        {/* Brand + legal links */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + blurb */}
          <div className="max-w-md">
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

          {/* Legal links */}
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {LEGAL_LINKS.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="inline-flex min-h-[44px] items-center font-sans text-sm transition-colors outline-none hover:text-[var(--d2-text)] focus-visible:ring-2 focus-visible:ring-[var(--d2-reveal)]"
                  style={{ color: 'var(--d2-text2)' }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Small print */}
        <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--d2-border)' }}>
          <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--d2-muted)' }}>
            &copy; {year} EPD Smart Calculator. Rates shown are standard published pricing and illustrative; your report
            uses your actual statement. Not affiliated with or endorsed by Stripe, Inc. Stripe is a trademark of its
            respective owner.
          </p>
        </div>
      </div>
    </footer>
  );
}
