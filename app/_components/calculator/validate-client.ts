/**
 * Client-side file validation for the Calculator dialog — instant feedback that
 * MIRRORS the server's {@link fileSchema} rules (PDF only, max 4MB). The server
 * re-validates authoritatively; this only avoids a wasted round-trip and gives
 * terse design-two wording. No statement data is read, stored, or logged here.
 */
import { MAX_FILE_BYTES } from '@/lib/validation';

export { MAX_FILE_BYTES };

/** Returns a terse, user-facing error string, or null when the file is valid. */
export function validateFileClient(file: File): string | null {
  if (file.size === 0) return "That file's empty.";
  if (file.type !== 'application/pdf') {
    return 'Not a PDF — export your Stripe statement as a PDF.';
  }
  if (file.size > MAX_FILE_BYTES) return 'Over 4MB.';
  return null;
}
