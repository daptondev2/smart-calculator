"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, MotionValue,
} from "framer-motion";
import CountUp from "./CountUp";
import type { UseAnalyze } from "@/hooks/useAnalyze";
import { toViewModel } from "@/lib/viewModel";

/* ============ helpers ============ */
function Reveal({ progress, at, children, className }: { progress: MotionValue<number>; at: number; children: React.ReactNode; className?: string }) {
  const opacity = useTransform(progress, [at, at + 0.05], [0, 1]);
  const y = useTransform(progress, [at, at + 0.05], [14, 0]);
  const scale = useTransform(progress, [at, at + 0.05], [0.85, 1]);
  return <motion.div className={className} style={{ opacity, y, scale }}>{children}</motion.div>;
}

/* ============ 1. Meet the Profit Eater ============ */
const SALES = ["$120", "$250", "$80", "$350"];
export function S1() {
  return (
    <section className="story" id="top">
      <div className="slot slot-top">
        <span className="kicker warn" style={{ marginBottom: 22 }}>Meet the Profit Eater</span>
        <div className="fee-cloud" style={{ marginTop: 8 }}>
          {SALES.map((s, i) => (
            <motion.span key={s} className="toast" style={{ borderColor: "rgba(30,230,143,.4)", color: "var(--green)" }}
              animate={{ opacity: [0, 1, 1, 0.6], y: [10, 0] }} transition={{ duration: 2.4, delay: i * 0.6, repeat: Infinity, repeatDelay: 1.6 }}>
              <span className="p" style={{ background: "var(--green)" }} /> Sale Approved {s}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="slot headline-wrap">
        <h1 className="h1">Your Business May Be <span className="tred">Losing More Than You Realize</span></h1>
        <p className="lead" style={{ margin: "16px auto 0", maxWidth: 560 }}>
          Behind every healthy-looking sale, something is quietly taking a bite. Keep scrolling — and watch.
        </p>
      </div>
      <div className="scroll-hint"><div className="mouse" /> SCROLL TO FEED IT</div>
    </section>
  );
}

/* ============ 2. What feeds it ============ */
const FEEDS = [
  { t: "High Processing Rate", at: 0.12, rate: true },
  { t: "Excessive Markup", at: 0.2, rate: true },
  { t: "PCI Compliance Fee", at: 0.28 },
  { t: "Equipment Rental", at: 0.36 },
  { t: "Gateway Charges", at: 0.44 },
  { t: "Statement Fee", at: 0.5 },
  { t: "Batch Fee", at: 0.56 },
  { t: "Monthly Service Fee", at: 0.62 },
  { t: "Non-Qualified Surcharges", at: 0.68, rate: true },
  { t: "Hidden Fees", at: 0.74 },
];
export function S2() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section className="story" ref={ref}>
      <div className="slot slot-top">
        <span className="kicker warn">What Feeds The Profit Eater?</span>
        <div className="fee-cloud" style={{ marginTop: 22 }}>
          {FEEDS.map((f) => (
            <Reveal key={f.t} progress={scrollYProgress} at={f.at}>
              <span className={`fee-fly${f.rate ? " rate" : ""}`}>⚠ {f.t}</span>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="slot headline-wrap">
        <h2 className="h2">Every Fee Makes The Problem <span className="tred">Bigger</span></h2>
        <p className="lead" style={{ margin: "14px auto 0", maxWidth: 560 }}>
          The real cost isn&rsquo;t one fee. It&rsquo;s everything added together.
        </p>
      </div>
    </section>
  );
}

/* ============ 3. The true cost (consumed counter) ============ */
export function S3() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [consumed, setConsumed] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const v = Math.max(0, Math.min(1, (p - 0.1) / 0.78)) * 3500;
    setConsumed(Math.round(v / 50) * 50);
  });
  return (
    <section className="story" ref={ref}>
      <div className="slot slot-top">
        <span className="kicker warn">The True Cost</span>
        <div className="counter-lbl" style={{ marginTop: 26 }}>Money Consumed</div>
        <div className="big-counter">${consumed.toLocaleString("en-US")}</div>
      </div>
      <div className="slot headline-wrap">
        <h2 className="h2">Small Charges Can Become <span className="tred">Big Annual Costs</span></h2>
        <p className="lead" style={{ margin: "14px auto 0", maxWidth: 560 }}>
          Most merchants never realize how much they may be losing over time.
        </p>
      </div>
    </section>
  );
}

/* ============ 4. EPD Analyzer (interactive) ============ */
const CATS = [
  { nm: "High Processing Rates", tag: "2.91% eff." },
  { nm: "Excessive Markups", tag: "0.42% over" },
  { nm: "Hidden Fees", tag: "$28.15" },
  { nm: "Equipment Costs", tag: "$45.00" },
  { nm: "Gateway Charges", tag: "$15.00" },
  { nm: "Savings Opportunities", tag: "8 found" },
];
export type AnalyzerHandle = { start: () => void };

export const S4Analyzer = forwardRef<AnalyzerHandle, { analyze: UseAnalyze }>(function S4Analyzer({ analyze }, ref) {
  const sectionRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(-1);
  const [drag, setDrag] = useState(false);

  const busy = analyze.state === "analyzing";
  const isError = analyze.state === "uploadError" || analyze.state === "rateLimited";
  const vm = analyze.result ? toViewModel(analyze.result) : null;
  const checkShown =
    analyze.state === "result" ? CATS.length : analyze.state === "analyzing" ? checked : -1;

  const openPicker = () => fileRef.current?.click();
  const pick = (file?: File | null) => { if (file) analyze.analyze(file); };

  useImperativeHandle(ref, () => ({
    start: () => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(openPicker, 650);
    },
  }));

  // Drive the upload bar + checklist from the real request lifecycle: ease toward
  // 95% and walk the checklist while the request is in flight; the real response
  // (result/error) ends it — no fake "done".
  useEffect(() => {
    if (analyze.state !== "analyzing") return;
    let p = 0;
    let i = -1;
    const seed = setTimeout(() => { setProgress(0); setChecked(-1); }, 0); // reset off the effect body
    const pid = setInterval(() => { p = Math.min(95, p + 4 + Math.random() * 6); setProgress(p); }, 90);
    const cid = setInterval(() => { i = Math.min(CATS.length - 1, i + 1); setChecked(i); }, 460);
    return () => { clearTimeout(seed); clearInterval(pid); clearInterval(cid); };
  }, [analyze.state]);

  const dzClick = () => {
    if (busy) return;
    if (analyze.state !== "idle") analyze.reset();
    openPicker();
  };

  return (
    <section className="story" id="analyze" ref={sectionRef} style={{ justifyContent: "center", gap: 40 }}>
      <div className="slot" style={{ maxWidth: 760 }}>
        <span className="kicker">EPD Analyzer Activated</span>
        <h2 className="h2" style={{ marginTop: 12 }}>Let&rsquo;s Reveal <span className="tcyan">What&rsquo;s Really Happening</span></h2>
        <p className="lead" style={{ margin: "12px auto 0", maxWidth: 560 }}>
          The Profit Eater freezes. EPD scans your statement and exposes exactly what&rsquo;s been feeding it.
        </p>
      </div>

      <div className="analyzer">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
          />
          <div className={`dropzone${drag ? " dragover" : ""}`}
            onClick={dzClick}
            onDragOver={(e) => { e.preventDefault(); if (!busy) setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault(); setDrag(false);
              if (busy) return;
              if (analyze.state !== "idle") analyze.reset();
              pick(e.dataTransfer.files?.[0]);
            }}>
            <div className={`dz-doc${analyze.state !== "idle" ? " fly" : ""}`} />
            {analyze.state === "idle" && (<>
              <div className="dz-title">Upload Your Statement</div>
              <div className="dz-sub">PDF · max 10MB</div>
              <span className="dz-browse">◎ SELECT FILE</span>
              {analyze.fileError && <div className="dz-sub" style={{ color: "var(--red)", marginTop: 8 }}>{analyze.fileError}</div>}
            </>)}
            {busy && (<><div className="dz-title tcyan">Analyzing your statement…</div><div className="dz-sub">Tracing every cost</div><div className="dz-bar"><i style={{ width: `${progress}%` }} /></div></>)}
            {analyze.state === "result" && (<><div className="dz-title tgreen">✓ Statement analyzed</div><div className="dz-sub">Your numbers are below</div><span className="dz-browse">↺ SCAN ANOTHER</span></>)}
            {isError && (<><div className="dz-title tred">⚠ Couldn&rsquo;t analyze that</div><div className="dz-sub">{analyze.error?.message ?? "Something went wrong. Try again."}</div><span className="dz-browse">↺ TRY AGAIN</span></>)}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <AnimatePresence>
            {busy && (
              <motion.div initial={{ top: "0%", opacity: 0 }} animate={{ top: ["0%", "100%", "0%"], opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", left: 0, right: 0, height: 2, zIndex: 4, background: "linear-gradient(90deg,transparent,var(--cyan),transparent)", boxShadow: "0 0 16px var(--cyan)" }} />
            )}
          </AnimatePresence>
          <div className="checks">
            {CATS.map((c, i) => (
              <div key={c.nm} className={`chk${checkShown >= i ? " on" : ""}`}>
                <span className="bx">{checkShown >= i ? "✓" : ""}</span><span className="nm">{c.nm}</span>
                {checkShown >= i && <span className="tag">{c.tag}</span>}
              </div>
            ))}
          </div>
          {analyze.state === "idle" && <p className="dz-sub" style={{ textAlign: "center", marginTop: 14 }}>◎ Upload to begin the live scan</p>}
        </div>
      </div>

      {analyze.state === "result" && vm && (
        <div className="slot" style={{ maxWidth: 760 }}>
          <span className="kicker ok">Your Statement · Analyzed</span>
          {vm.variant === "none" ? (
            <>
              <h2 className="h2" style={{ marginTop: 12 }}>You&rsquo;re Already on a <span className="tcyan">Competitive Rate</span></h2>
              <p className="lead" style={{ margin: "12px auto 0", maxWidth: 560 }}>
                On {vm.periodText || "this statement"}, switching wouldn&rsquo;t beat your current rate by much — we won&rsquo;t pretend otherwise.
              </p>
            </>
          ) : (
            <>
              <h2 className="h2" style={{ marginTop: 12 }}>EPD Could Save You <span className="tgreen">{vm.annualSavingText}/yr</span></h2>
              <div className="cards2" style={{ marginTop: 18 }}>
                <div className="card">
                  <div className="lbl">Monthly Savings</div>
                  <div className="big tgreen">{vm.monthlySavingText}</div>
                  <div className="dz-sub">recovered every month</div>
                </div>
                <div className="card">
                  <div className="lbl">Annual Savings</div>
                  <div className="big tgreen">{vm.annualSavingText}</div>
                  <div className="dz-sub">{vm.pctSavingText} lower than today</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
});

/* ============ 5. Profit recovery (optimizations) ============ */
const OPTS = [
  { t: "High Rate Reduced", at: 0.16 },
  { t: "Markup Removed", at: 0.32 },
  { t: "Equipment Cost Eliminated", at: 0.48 },
  { t: "Hidden Charges Identified", at: 0.62 },
  { t: "Processing Structure Optimized", at: 0.76 },
];
export function S5() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section className="story" ref={ref}>
      <div className="slot slot-top">
        <span className="kicker ok">Profit Recovery</span>
        <div className="fee-cloud" style={{ marginTop: 22, flexDirection: "column", alignItems: "center", gap: 12 }}>
          {OPTS.map((o) => (
            <Reveal key={o.t} progress={scrollYProgress} at={o.at}>
              <span className="toast"><span className="p" /> ✓ {o.t}</span>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="slot headline-wrap">
        <h2 className="h2">The More We Find, <span className="tgreen">The More You Keep</span></h2>
        <p className="lead" style={{ margin: "14px auto 0", maxWidth: 560 }}>
          Small improvements across multiple cost areas can generate meaningful savings.
        </p>
      </div>
    </section>
  );
}

/* ============ 6. Recovery dashboard ============ */
const BARS = [["Jan", 24], ["Feb", 42], ["Mar", 60], ["Apr", 78], ["May", 95]] as const;
export function S6() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end start"] });
  const [seen, setSeen] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (p) => { if (p > 0.05) setSeen(true); });
  return (
    <section className="story" ref={ref} style={{ justifyContent: "center", gap: 30 }}>
      <div className="slot">
        <span className="kicker ok">Profit Recovery Dashboard</span>
        <h2 className="h2" style={{ marginTop: 12 }}>Recover Profit <span className="tgreen">Hidden In Plain Sight</span></h2>
      </div>
      <div className="cards2">
        <div className="card">
          <div className="lbl">Monthly Savings</div>
          <div className="big tgreen"><CountUp to={700} prefix="$" start={seen} /></div>
          <div className="dz-sub">recovered every month</div>
        </div>
        <div className="card">
          <div className="lbl">Annual Savings</div>
          <div className="big tgreen"><CountUp to={8400} prefix="$" start={seen} /></div>
          <div className="dz-sub">flowing back to your business</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 520, width: "100%" }}>
        <div className="lbl" style={{ display: "flex", justifyContent: "space-between" }}><span>PROFIT TREND</span><span className="tgreen">▲ RISING</span></div>
        <div className="bars">
          {BARS.map(([c, h], i) => (
            <div className="col" key={c}><div className="b" style={{ height: seen ? `${h}%` : 0, transitionDelay: `${i * 0.1}s` }} /><div className="c">{c}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ 7. Final victory & CTA ============ */
export function S7({ onUpload }: { onUpload: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const inViewRef = useRef(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !inViewRef.current) { inViewRef.current = true; setSeen(true); } }), { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section className="story" ref={ref} style={{ justifyContent: "center", gap: 26, minHeight: "150vh" }}>
      <div className="slot" style={{ maxWidth: 820 }}>
        <span className="kicker ok">Final Victory · Threat Contained</span>
        <h2 className="h2" style={{ marginTop: 14 }}>Stop Feeding High Fees, Hidden Charges &amp; <span className="tgreen">Excessive Rates</span></h2>
        <p className="lead" style={{ margin: "14px auto 0", maxWidth: 580 }}>
          Upload your statement and discover how much profit your business could be keeping.
        </p>

        <div className="summary">
          <div className="sumcard"><div className="k">Threats Found</div><div className="v tred">8</div></div>
          <div className="sumcard"><div className="k">Opportunities</div><div className="v tcyan">8</div></div>
          <div className="sumcard"><div className="k">Annual Savings</div><div className="v tgreen"><CountUp to={3600} prefix="$" start={seen} /></div></div>
          <div className="sumcard"><div className="k">Profit Visibility</div><div className="v tcyan">100%</div></div>
        </div>

        <div className="cards2" style={{ marginTop: 24 }}>
          <div className="card"><div className="lbl">Current Processor</div><div className="big tred"><CountUp to={14800} prefix="$" start={seen} /></div><div className="dz-sub">annual cost</div></div>
          <div className="card" style={{ borderColor: "rgba(30,230,143,.4)" }}><div className="lbl">EPD Optimized</div><div className="big tgreen"><CountUp to={11200} prefix="$" start={seen} /></div><div className="dz-sub">annual cost</div></div>
        </div>

        <div className="cta-row" style={{ marginTop: 30 }}>
          <button className="btn btn-primary" onClick={onUpload}>📄 Analyze My Statement</button>
          <button className="btn btn-ghost" onClick={onUpload}>◎ Start Free Profit Scan</button>
        </div>
      </div>
    </section>
  );
}
