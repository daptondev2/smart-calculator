import { NextResponse } from "next/server";
import type { ApiError, LeadResponse } from "@/types/contract";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function fail(status: number, error: ApiError): NextResponse {
  return NextResponse.json(error, { status });
}

/** Server-authoritative email check. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Parse + validate body.
  let analysisId: unknown;
  let email: unknown;
  try {
    const body = await request.json();
    analysisId = body?.analysisId;
    email = body?.email;
  } catch {
    return fail(400, { error: "INVALID_BODY", message: "Malformed request." });
  }
  if (typeof analysisId !== "string" || !analysisId) {
    return fail(400, { error: "INVALID_BODY", message: "Missing analysisId." });
  }
  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    return fail(400, { error: "INVALID_EMAIL", message: "Please enter a valid email." });
  }

  const supabase = getServiceClient();

  // 2. The analysisId must map to a real statement (else treat as expired).
  const { data: statement } = await supabase
    .from("statements")
    .select("id")
    .eq("id", analysisId)
    .single();
  if (!statement) {
    return fail(404, { error: "ANALYSIS_NOT_FOUND", message: "Unknown analysis." });
  }

  // 3. Set-once: the unique(statement_id) constraint rejects a second email.
  const { error: insertErr } = await supabase
    .from("leads")
    .insert({ statement_id: analysisId, email: email.trim().toLowerCase() });

  if (insertErr) {
    // 23505 = unique_violation → an email is already attached.
    if (insertErr.code === "23505") {
      return fail(409, { error: "EMAIL_ALREADY_SET", message: "Email already attached." });
    }
    return fail(500, { error: "INTERNAL", message: "Something went wrong on our end." });
  }

  const body: LeadResponse = { ok: true };
  return NextResponse.json(body, { status: 200 });
}
