'use server';

/**
 * STUB lead capture. Intentionally does NOT persist anything yet — there is no
 * `leads` table in the current schema. It validates input and reports success
 * so the lead UI (home LeadCapture section, report-page CTA) is fully wired and
 * demoable.
 *
 * TODO(lead-backend): add a `leads` table migration + a Supabase insert here
 * (see ref/apppp/api/leads/route.ts for the intended shape) and remove the stub.
 */

export type LeadStubState = { ok?: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLeadStub(
  _prev: LeadStubState,
  formData: FormData,
): Promise<LeadStubState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();

  if (name.length < 2) return { error: 'Please enter your full name.' };
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email.' };

  // Simulate network/processing latency so the UI's pending state is visible.
  await new Promise((resolve) => setTimeout(resolve, 600));

  // NOTE: not persisted — stub only. Wire to Supabase when the leads table lands.
  return { ok: true };
}
