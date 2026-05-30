"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import ProfitEater from "./ProfitEater";

/**
 * The Profit Eater stays pinned to the viewport the entire scroll.
 * Global scroll progress drives: scale (grow 1-3, freeze 4, shrink 5, tiny 6-7),
 * mood (greedy -> defeated), tint (purple danger -> blue freeze -> green recovery),
 * and a containment cage at the very end.
 */
export default function PinnedMonster() {
  const { scrollYProgress } = useScroll();
  const [mood, setMood] = useState<"greedy" | "defeated">("greedy");

  // grow through s1-3, freeze s4, shrink s5, tiny s6-7
  const scale = useTransform(
    scrollYProgress,
    [0, 0.14, 0.28, 0.4, 0.5, 0.57, 0.66, 0.72, 0.86, 1],
    [0.6, 0.85, 1.2, 1.65, 1.6, 1.5, 0.95, 0.55, 0.36, 0.34]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.42, 0.46, 0.5, 0.57, 0.71, 0.8, 0.87, 1],
    [1, 1, 0.28, 0.28, 0.95, 0.95, 0.55, 0.8, 1]
  );
  // purple danger glow -> blue freeze -> green recovery
  const filter = useTransform(
    scrollYProgress,
    [0, 0.4, 0.47, 0.5, 0.64, 0.78, 1],
    [
      "drop-shadow(0 22px 50px rgba(157,107,255,.5))",
      "drop-shadow(0 22px 50px rgba(157,107,255,.65))",
      "drop-shadow(0 0 70px rgba(53,201,255,.9)) saturate(.55) hue-rotate(165deg)",
      "drop-shadow(0 0 70px rgba(53,201,255,.9)) saturate(.55) hue-rotate(165deg)",
      "drop-shadow(0 18px 50px rgba(157,107,255,.4))",
      "drop-shadow(0 16px 44px rgba(30,230,143,.45))",
      "drop-shadow(0 16px 44px rgba(30,230,143,.55))",
    ]
  );
  // subtle idle breathing
  const cageOpacity = useTransform(scrollYProgress, [0.86, 0.92], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setMood(p >= 0.64 ? "defeated" : "greedy");
  });

  return (
    <>
      <div className="pinned" aria-hidden>
        <motion.div className="mon-shift" style={{ scale, opacity, filter }}>
          <motion.div animate={{ y: [0, -8, 0], rotate: [0, 1.2, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
            <ProfitEater size={300} mood={mood} />
          </motion.div>
        </motion.div>
      </div>

      {/* containment chamber at the end */}
      <motion.div className="cage" style={{ opacity: cageOpacity }} aria-hidden>
        <div className="glass">
          <div className="bars">
            {Array.from({ length: 6 }).map((_, i) => (
              <i key={i} style={{ left: `${14 + i * 14}%` }} />
            ))}
          </div>
          <div className="labels">
            <span>HIGH FEES</span><span>HIDDEN CHARGES</span><span>EXCESSIVE MARKUPS</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
