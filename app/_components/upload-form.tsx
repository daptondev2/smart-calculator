"use client";

import { useActionState } from "react";
import { analyzeStatement, type AnalyzeState } from "@/app/actions/analyze";

const initialState: AnalyzeState = {};

export function UploadForm() {
  const [state, formAction, pending] = useActionState(
    analyzeStatement,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Analyzing statement…" : "Analyze my statement"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-zinc-500">
        Upload a PDF processing statement (max 4 MB). We extract your
        transactions and compare Stripe&apos;s fees against EPD&apos;s flat 1.5%.
      </p>
    </form>
  );
}
