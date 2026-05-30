import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "sc_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Returns the anonymous session id from the `sc_session` cookie, creating and
 * setting one if it does not exist yet. Must be called from a Server Action or
 * Route Handler (cookie writes are not allowed in Server Components).
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}
