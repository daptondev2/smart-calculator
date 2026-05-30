/**
 * design-two · "THE REVEAL" — copy constants.
 * Centralized so the dramatic wording stays consistent across the beat
 * choreography and error/lead sub-states. No statement data lives here.
 */

export const HERO = {
  eyebrow: 'READS YOUR REAL STRIPE STATEMENT',
  h1: 'See what Stripe is actually costing you.',
  sub: 'Upload one statement. Watch your real annual savings appear — no account, no call to see the number.',
  trust: 'Read in your browser · Never stored',
} as const;

export const DROPZONE = {
  title: 'Drop your Stripe statement',
  hint: 'or browse — PDF, 10MB max',
  chipValidating: 'Checking…',
} as const;

/** Map the raw shared validation strings → terser per-variant wording (§2d). */
export function mapFileError(raw: string | null): string | null {
  if (!raw) return null;
  switch (raw) {
    case 'File must be a PDF.':
      return 'Not a PDF — export your Stripe statement as a PDF.';
    case 'File must be 10MB or smaller.':
      return 'Over 10MB.';
    case 'Upload exactly one file.':
      return 'One file at a time.';
    case 'That file looks empty.':
      return "That file's empty.";
    default:
      return raw;
  }
}

export const LOADER = {
  live: 'Analyzing your statement.',
  status: [
    'Reading your statement…',
    'Found your processing volume…',
    'Pulling your effective rate…',
    'Comparing against EPD pricing…',
    'Calculating your annual savings…',
  ],
  cancel: 'Cancel',
} as const;

export const RESULT = {
  kicker: "Here's your number.",
  hotLabel: 'ESTIMATED ANNUAL SAVINGS WITH EPD',
  positiveLabel: 'ESTIMATED ANNUAL SAVINGS WITH EPD',
  hotSub: "That's real money you're leaving on the table.",
  positiveSub: "A solid, real saving — and there's usually more once we review.",
  noneHeading: "You're already on a competitive rate.",
  noneSub: "so we won't pretend there is. You're in good shape.",
  hotCta: 'Talk to an EPD specialist →',
  positiveCta: 'Talk to an EPD specialist →',
  noneCta: 'Get a tailored review →',
  disclosureHeading: 'How is this estimated?',
  recalculate: 'Start over with a new statement',
} as const;

export function anchorLine(periodText: string): string {
  return periodText ? `Based on your ${periodText} statement.` : 'Based on your statement.';
}

export function disclosureBody(periodText: string): string {
  const period = periodText || 'statement';
  return `Read from your ${period} statement, compared to EPD pricing on the same volume, annualized over your statement's dates. Conservative; confirmed on a call. Never stored.`;
}

export function noneDiff(pctSavingText: string): string {
  return `Difference from EPD ≈ ${pctSavingText}.`;
}

export const GATE = {
  label: 'Where should an EPD specialist reach you?',
  placeholder: 'you@business.com',
  micro: 'A specialist reaches out once. No spam, no obligation.',
  successHeading: 'Done. A specialist will reach out to',
  successSub: 'They review your numbers with you — no obligation.',
  rateLimited: 'Too many tries — give it a minute.',
  hardError: "That's on us — your file wasn't stored. Try again.",
  sessionExpired: 'Session expired — re-upload to continue.',
  retry: 'Try again',
} as const;

export const ERRORS = {
  parse: {
    heading: "We couldn't read that statement.",
    body: 'Use an unmodified Stripe monthly statement (Dashboard → Documents → Statements).',
  },
  invalidFile: {
    heading: "We couldn't use that file.",
    body: 'Export your Stripe statement as a PDF, 10MB or smaller.',
  },
  tooLarge: {
    heading: 'That file is over 10MB.',
    body: 'Export a single monthly Stripe statement as a PDF.',
  },
  rateLimited: {
    heading: 'Too many tries — give it a minute.',
    body: 'You can try again shortly.',
  },
  internal: {
    heading: "That's on us, not your statement.",
    body: 'Your file never left your browser. Try again.',
  },
  retry: 'Try again',
} as const;
