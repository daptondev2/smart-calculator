import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DialogProvider } from "@/app/_components/calculator/dialog-context";
import CalculatorDialog from "@/app/_components/calculator/CalculatorDialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Calculator — See what Stripe really costs you | EPD",
  description:
    "Upload your Stripe statement and see your exact savings switching to EPD’s flat 1.5% rate. Your real numbers, no estimates, no account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Global calculator dialog: openable from anywhere via useCalculatorDialog(). */}
        <DialogProvider>
          {children}
          <CalculatorDialog />
        </DialogProvider>
      </body>
    </html>
  );
}
