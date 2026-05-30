import { z } from "zod";

/** Bedrock Converse document limit is ~4.5 MB; cap uploads safely under that. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, { message: "Please choose a PDF file to upload." })
  .refine((f) => f.type === "application/pdf", {
    message: "Only PDF statements are supported.",
  })
  .refine((f) => f.size <= MAX_FILE_BYTES, {
    message: "File is too large. Please upload a PDF under 4 MB.",
  });

/** One row as returned by the extraction model (a charge or a summary group). */
export const extractedTransactionSchema = z.object({
  txn_date: z.string().nullish(),
  description: z.string().nullish(),
  /** Total gross volume for this row (already summed for aggregated rows). */
  gross_amount: z.coerce.number().finite(),
  currency: z.string().default("USD"),
  card_brand: z.string().nullish(),
  /** Number of underlying transactions this row represents. */
  count: z.coerce.number().int().positive().default(1),
  is_refund: z.boolean().default(false),
});

export const extractionResultSchema = z.object({
  transactions: z.array(extractedTransactionSchema),
  /**
   * The total gross processing volume the statement itself states, used to
   * reconcile against the sum of extracted rows. Null if not shown.
   */
  statement_total: z.coerce.number().finite().nullish(),
});

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
