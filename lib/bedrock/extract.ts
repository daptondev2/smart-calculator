import "server-only";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type Tool,
} from "@aws-sdk/client-bedrock-runtime";
import { extractionResultSchema, type ExtractionResult } from "@/lib/validation";

let client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (client) return client;
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("Missing AWS_REGION environment variable.");
  // Credentials are read from the standard AWS env vars / provider chain.
  client = new BedrockRuntimeClient({ region });
  return client;
}

const INSTRUCTIONS = `You are a payments-statement parser. The attached PDF is a payment processing statement (e.g. a Stripe Balance Summary).

DEFINITION OF VOLUME: the processing volume is the GROSS amount customers paid on CHARGES, BEFORE any processing fees are deducted. This is the basis on which percentage fees are computed.
- On a Stripe statement this is the "Charges" section's "Gross amount" and "Count".
- It is NOT the net balance change, NOT "Net balance change from activity", NOT "Total payouts", NOT "Account activity before fees" minus fees. Those are net-of-fee figures and MUST NOT be used as volume.

Extract the SALES (charge) rows at ONE consistent level of detail. Choose exactly one:
  (a) the per-transaction charge rows, if itemized, OR
  (b) the summary charge row(s), e.g. "Charges — Count 6, Gross amount $17,951.27" → one row.
Do NOT mix levels and do NOT return both a summary row and its underlying detail — that double-counts.

For each row provide:
- txn_date: the date (ISO YYYY-MM-DD) if shown, else null
- description: the row label/merchant note if shown, else null
- gross_amount: the TOTAL GROSS charge volume for that row, as a positive number (already-summed for a summary row — do NOT return a per-unit amount)
- currency: 3-letter currency code (default "USD")
- card_brand: card network if shown, else null
- count: number of charges this row represents (1 for a single charge; the group's charge count for a summary row, e.g. 6)
- is_refund: true only if the row is a refund/chargeback/credit (these do not add to volume), otherwise false

STRICTLY EXCLUDE (never return these as rows):
- processing fees, "Less fees", "Additional Stripe fees", taxes on fees
- net-amount rows, "Net balance change from activity", "Balance change from activity"
- payouts/transfers, "Total payouts", starting/ending balance
- grand totals, subtotals, and running balances

Also return statement_total: the GROSS charge volume the statement states (i.e. the Charges gross amount, e.g. 17951.27) — the SAME basis as the rows above, NOT the net or payout figure. Null if not shown.

Use only data present in the statement. Do not invent rows. Call the record_transactions tool.`;

const TOOL: Tool = {
  toolSpec: {
    name: "record_transactions",
    description: "Record every transaction extracted from the processing statement.",
    inputSchema: {
      json: {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                txn_date: { type: ["string", "null"] },
                description: { type: ["string", "null"] },
                gross_amount: {
                  type: "number",
                  description:
                    "Total gross volume for this row (already summed for aggregated rows).",
                },
                currency: { type: "string" },
                card_brand: { type: ["string", "null"] },
                count: {
                  type: "integer",
                  description: "Number of transactions this row represents.",
                },
                is_refund: { type: "boolean" },
              },
              required: ["gross_amount"],
            },
          },
          statement_total: {
            type: ["number", "null"],
            description:
              "The grand total gross processing volume stated on the statement, for reconciliation.",
          },
        },
        required: ["transactions"],
      },
    },
  },
};

/**
 * Sends a PDF statement to AWS Bedrock and returns the structured list of
 * transactions. Throws on model/transport errors or invalid model output.
 */
export async function extractTransactions(
  pdfBytes: Uint8Array,
): Promise<ExtractionResult> {
  const modelId = process.env.BEDROCK_MODEL_ID;
  if (!modelId) throw new Error("Missing BEDROCK_MODEL_ID environment variable.");

  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          document: {
            format: "pdf",
            name: "statement",
            source: { bytes: pdfBytes },
          },
        },
        { text: INSTRUCTIONS },
      ],
    },
  ];

  const response = await getClient().send(
    new ConverseCommand({
      modelId,
      messages,
      toolConfig: {
        tools: [TOOL],
        toolChoice: { tool: { name: "record_transactions" } },
      },
      inferenceConfig: { maxTokens: 8192, temperature: 0 },
    }),
  );

  const blocks = response.output?.message?.content ?? [];
  const toolUse = blocks.find((b) => b.toolUse)?.toolUse;
  if (!toolUse?.input) {
    throw new Error("Bedrock did not return structured transaction data.");
  }

  return extractionResultSchema.parse(toolUse.input);
}
