"use client";

import { useRef } from "react";
import { Nav, BackgroundFX } from "@/components/Chrome";
import PinnedMonster from "@/components/PinnedMonster";
import { S1, S2, S3, S4Analyzer, S5, S6, S7, AnalyzerHandle } from "@/components/Sections";
import { useAnalyze } from "@/hooks/useAnalyze";

export default function Home() {
  const analyzer = useRef<AnalyzerHandle>(null);
  const goUpload = () => analyzer.current?.start();

  // S4 is the real, wired analyzer; the rest of the scroll story (S6/S7) stays
  // illustrative marketing, as disclaimed in the footer.
  const analyze = useAnalyze();

  return (
    <main>
      <BackgroundFX />
      <Nav onUpload={goUpload} />
      <PinnedMonster />

      <S1 />
      <S2 />
      <S3 />
      <S4Analyzer ref={analyzer} analyze={analyze} />
      <S5 />
      <S6 />
      <S7 onUpload={goUpload} />

      <footer className="footer">
        THE PROFIT EATER™ · STOP FEEDING HIGH FEES, HIDDEN CHARGES &amp; EXCESSIVE RATES
        <br />
        <span style={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} EPD Payments · Figures are illustrative — your real savings come from your actual statement.
        </span>
      </footer>
    </main>
  );
}
