"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function Nav({ onUpload }: { onUpload: () => void }) {
  return (
    <nav className="nav">
      <a href="#top" className="brand">
        <span className="mark">E</span>
        The Profit <span>Eater</span>
      </a>
      <button className="btn btn-primary" onClick={onUpload}>📄 Analyze My Statement</button>
    </nav>
  );
}

/** Fixed environment that shifts danger-red → freeze-blue → recovery-green as you scroll. */
export function BackgroundFX() {
  const { scrollYProgress } = useScroll();
  const danger = useTransform(scrollYProgress, [0, 0.36, 0.43], [0.7, 1, 0]);
  const freeze = useTransform(scrollYProgress, [0.4, 0.5, 0.58], [0, 1, 0.2]);
  const recover = useTransform(scrollYProgress, [0.58, 0.72, 1], [0, 0.8, 1]);
  return (
    <>
      <div className="fx-base" />
      <div className="fx-grid" />
      <div className="fx">
        <motion.div className="layer danger" style={{ opacity: danger }} />
        <motion.div className="layer freeze" style={{ opacity: freeze }} />
        <motion.div className="layer recover" style={{ opacity: recover }} />
      </div>
    </>
  );
}
