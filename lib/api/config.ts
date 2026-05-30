/**
 * The ONE-LINE swap between mock and real backend.
 *
 * The real `/api/analyze` and `/api/lead` route handlers now exist, so the real
 * backend is the default. Set NEXT_PUBLIC_USE_MOCK=true to fall back to the
 * in-browser mock (useful for UI work without AWS/Supabase credentials).
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
