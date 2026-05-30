import { UploadForm } from "@/app/_components/upload-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-sm dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            How much could you save with EPD?
          </h1>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Upload your Stripe processing statement. We&apos;ll recompute
            Stripe&apos;s fees (2.9% + $0.30) and compare them against EPD&apos;s
            flat 1.5% to show your potential savings.
          </p>
        </div>
        <UploadForm />
      </main>
    </div>
  );
}
