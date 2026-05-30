/**
 * The ONE-LINE swap between mock and real backend.
 *
 * Mock is the default (no backend exists yet). When the real `/api/analyze`
 * and `/api/lead` route handlers ship, set NEXT_PUBLIC_USE_MOCK=false (or flip
 * the default below) and the real fetch implementations in `client.ts` take
 * over with zero consumer changes.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
