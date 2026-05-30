/**
 * design-three · "THE STRAIGHT LINE" — copy constants (route-local).
 *
 * Centralizes every user-facing string for the variant so wording stays
 * consistent and is easy to audit against the spec (§3d). No logic here.
 */

export const HERO = {
  wordmark: 'Smart Calculator',
  h1: 'See what Stripe is really costing you.',
  sub: 'Upload one Stripe statement. Get your real annual savings in seconds. No account, no call.',
  trust: 'Read in your browser. Never stored.',
} as const;

export const DROPZONE = {
  title: 'Drop your Stripe statement here',
  hint: 'or tap to choose a PDF',
  caption: 'PDF · up to 10MB',
} as const;

/**
 * Maps the shared validateFileClient() raw strings → calm, on-brand wording.
 * Any unmapped message falls back to a friendly generic line.
 */
export function dropzoneErrorCopy(raw: string): string {
  switch (raw) {
    case 'File must be a PDF.':
      return "That's not a PDF — tap to choose your Stripe statement PDF.";
    case 'File must be 10MB or smaller.':
      return "That file's a bit big (over 10MB). Try again.";
    case 'Upload exactly one file.':
      return 'Just one file, please.';
    case 'That file looks empty.':
      return 'That file looks empty — re-download it from Stripe.';
    default:
      return 'Something looked off with that file — tap to try another.';
  }
}

export const ANALYZING = {
  // Paced to the ~1800ms success window: ~3 lines over 1.8s (then a 4th holds).
  lines: [
    'Reading your statement…',
    'Pulling your processed volume…',
    'Comparing against EPD rates…',
    'Almost there…',
  ],
  secondary: 'Your file never leaves this session.',
  longRunning: 'Still working — large statements take a moment.',
  live: 'Analyzing your statement.',
} as const;

export const RESULT = {
  hot: {
    eyebrow: 'Your estimated annual savings',
    cta: 'Talk to an EPD specialist about switching',
    micro: 'A short, no-pressure call to walk through your numbers and what moving over looks like.',
  },
  positive: {
    eyebrow: 'Your estimated annual savings',
    caption: 'A solid, steady saving on your current volume.',
    cta: 'Talk to an EPD specialist about your numbers',
  },
  none: {
    eyebrow: "Here's the honest read",
    heading: "You're already on a competitive rate.",
    body: "Switching to EPD wouldn't meaningfully lower your fees right now. That's a good place to be.",
    cta: 'Have an EPD specialist review your setup',
  },
} as const;

export const GATE = {
  label: 'Where can a specialist reach you?',
  placeholder: 'you@business.com',
  submit: 'Request a specialist call',
  micro: 'One specialist, one email to set up a time. No spam, unsubscribe anytime.',
  success: 'Done — a specialist will reach out to',
  errors: {
    invalidEmail: "That email doesn't look right — mind checking it?",
    rateLimited: 'Give it a few seconds and try again.',
    retry: "Your file's still right here — let's try again.",
    sessionExpired: "That took a while — let's recalculate.",
  },
} as const;

/** Amber, one-tap-recovery copy for the analyze-level error panel (§3d). */
export const ERROR_PANEL = {
  parse: {
    heading: "We couldn't read that one.",
    body: 'Grab it from Stripe Dashboard → Documents → Monthly statement.',
    action: 'Try another file',
  },
  internal: {
    heading: "Your file's still right here — let's try again.",
    action: 'Try again',
  },
  rateLimited: {
    heading: "We're catching our breath.",
    body: 'No rush — this re-enables on its own.',
  },
  file: {
    heading: "Let's try a different file.",
    action: 'Try another file',
  },
} as const;
