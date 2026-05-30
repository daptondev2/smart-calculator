/**
 * Client-side file validation — mirrors the server, never replaces it.
 * UX-only fast feedback. The server still re-checks mime + magic byte + size +
 * page count; this client check is NOT a security boundary.
 *
 * Returns a friendly message string on failure, or null if OK. Variants MAP
 * these raw strings through their own copy table for custom wording.
 */
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFileClient(files: FileList | File[]): string | null {
  const arr = Array.from(files);
  if (arr.length !== 1) return 'Upload exactly one file.';
  const f = arr[0];
  if (f.type !== 'application/pdf') return 'File must be a PDF.';
  if (f.size > MAX_FILE_BYTES) return 'File must be 10MB or smaller.';
  if (f.size === 0) return 'That file looks empty.';
  return null; // ok
}
