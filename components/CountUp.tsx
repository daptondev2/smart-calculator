"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type Props = { to: number; prefix?: string; suffix?: string; duration?: number; start?: boolean };

export default function CountUp({ to, prefix = "", suffix = "", duration = 1400, start }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const [val, setVal] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    const go = start === undefined ? inView : start;
    if (!go || fired.current) return;
    fired.current = true;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, start, to, duration]);

  return <span ref={ref}>{prefix}{val.toLocaleString("en-US")}{suffix}</span>;
}
