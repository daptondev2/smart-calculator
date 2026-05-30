/**
 * design-one · "THE AUDIT" — route-local copy constants.
 * No logic here; just strings. The components map shared raw strings (file
 * validation, API error codes) through these tables for the Audit's wording.
 */

/* ---- Hero ---- */
export const HERO = {
  wordmark: 'Smart Calculator',
  eyebrow: 'INDEPENDENT FEE ANALYSIS',
  h1: 'See what Stripe is actually costing you.',
  subhead:
    'Upload one Stripe statement. We read it in your browser and show the math behind your savings — no account, no sales call to see your number.',
  chips: ['Processed locally', 'No account required', 'Never stored'] as const,
  conservativeNote: 'Estimate is conservative — verified on a call, not before.',
  sampleCaption: 'Sample — your numbers will replace this.',
} as const;

/* ---- Dropzone ---- */
export const DROPZONE = {
  heading: 'Drop your Stripe statement here',
  sub: 'or browse to upload',
  constraint: 'One PDF · 10MB max',
  footnote: 'Read in your browser. Never stored.',
  validating: 'Checking your file…',
} as const;

/**
 * Maps the shared `validateFileClient` raw messages → the Audit's instructive,
 * non-scolding wording. Falls back to the raw string if unmapped.
 */
export const FILE_ERROR_COPY: Record<string, string> = {
  'Upload exactly one file.': 'Please drop a single PDF — one statement at a time.',
  'File must be a PDF.': "That isn't a PDF. Export your Stripe statement as PDF and try again.",
  'File must be 10MB or smaller.':
    'That file is over 10MB. A monthly statement is usually well under that.',
  'That file looks empty.': 'That file looks empty — re-download it from Stripe and retry.',
};

export function mapFileError(raw: string | null): string | null {
  if (!raw) return null;
  return FILE_ERROR_COPY[raw] ?? raw;
}

/* ---- Analyzing checklist ---- */
export const ANALYZING = {
  steps: [
    'Reading your statement',
    'Extracting volume & fees',
    'Comparing against EPD rates',
    'Calculating your savings',
  ] as const,
  footnote: 'Running on this device.',
  live: 'Analyzing your statement.',
  cancel: 'Cancel',
} as const;

/* ---- Result (shared) ---- */
export const RESULT = {
  statementEchoLabel: 'YOUR STATEMENT',
  estimateChip: 'Estimate',
  estimateCaption: 'Conservative figure, before any call.',
  worksheetSummary: 'How we got this.',
  // {period} is replaced at render time.
  worksheetBody: (period: string) =>
    `From your ${period} statement we read your processing volume and current fees, estimated EPD's cost on the same volume, and annualized the difference using your statement's date range. We never store your statement; this estimate is conservative and confirmed on a call.`,
  footerNote: "We'll confirm these exact numbers on a call — no inflated figures.",
} as const;

export const RESULT_HOT = {
  eyebrow: 'ESTIMATED ANNUAL SAVINGS WITH EPD',
  perMonthLabel: 'PER MONTH',
  pctLabel: 'LOWER PROCESSING COST',
  cta: 'Talk to a specialist — lock this in.',
  announce: (annual: string) => `Estimated annual savings: ${annual}.`,
} as const;

export const RESULT_POSITIVE = {
  eyebrow: 'ESTIMATED ANNUAL SAVINGS WITH EPD',
  caption: 'A real, if modest, saving on your current volume.',
  perMonthLabel: 'PER MONTH',
  pctLabel: 'LOWER PROCESSING COST',
  cta: 'Talk to a specialist about your numbers.',
  announce: (annual: string) => `Estimated annual savings: ${annual}.`,
} as const;

export const RESULT_NONE = {
  h2: "Good news — you're already on a competitive rate.",
  sub: "Switching to EPD wouldn't meaningfully lower your fees right now. We're not going to pretend otherwise.",
  diffLabel: 'DIFFERENCE FROM EPD',
  cta: 'Want a second set of eyes?',
} as const;

/* ---- Next-step specialist ask (email is no longer a gate; the full breakdown
   is already shown above). Per-variant label/hint/CTA come from RESULT_* / here. */
export const EMAIL_GATE = {
  // Per-variant label (intent of the consult differs by result strength).
  hotLabel: 'Ready to confirm these numbers with a specialist?',
  positiveLabel: 'Want a specialist to walk through your numbers?',
  noneLabel: 'Want a second set of eyes on your fees?',
  placeholder: 'you@business.com',
  // Per-variant microcopy — what happens next, no "send breakdown" framing.
  hotMicrocopy: 'An EPD specialist reaches out to confirm these exact numbers and set up the switch. No spam — just the next step.',
  positiveMicrocopy: 'An EPD specialist reviews these numbers with you and answers your questions. No spam — just the next step.',
  noneMicrocopy: "A specialist will take a short, honest look at your fees — no inflated figures, no pressure.",
  invalidEmail: 'Please enter a valid email.',
  rateLimited: 'Too many tries — give it a minute.',
  serverError:
    "That's on us, not your statement. Try again — your file never left your browser.",
  sessionExpired: 'Your session expired. Re-upload your statement to continue.',
  recalculate: 'Re-upload statement',
  retry: 'Try again',
  submitting: 'Sending…',
  // success — the breakdown stays visible above; this confirms the next step.
  successHeading: "You're on the list.",
  successBody: (email: string) =>
    `A specialist will reach out to ${email} to confirm these exact numbers — no inflated figures, no pressure.`,
} as const;

/* ---- Error panel ---- */
export const ERRORS = {
  invalidFile: {
    heading: 'Please upload a single PDF statement.',
    body: 'Export it from Stripe as PDF.',
  },
  fileTooLarge: {
    heading: 'That file is over 10MB.',
    body: 'A monthly statement is usually well under that. Re-download it from Stripe and retry.',
  },
  parseFailed: {
    heading: "We couldn't read that statement.",
    body: 'Use an unmodified Stripe monthly statement PDF: Stripe Dashboard → Documents → Statements.',
  },
  rateLimited: {
    heading: 'Too many tries — give it a minute.',
    body: "You've hit the analysis limit. It'll reset shortly — your file never left your browser.",
  },
  internal: {
    heading: "That's on us, not your statement.",
    body: 'Your file never left your browser — try again.',
  },
  retry: 'Try again',
} as const;
