"use client";

type Props = { size?: number; mood?: "greedy" | "defeated"; className?: string };

/** The Profit Eater — a greedy purple monster fed by hidden fees & high rates. */
export default function ProfitEater({ size = 260, mood = "greedy", className }: Props) {
  const beaten = mood === "defeated";
  const top = beaten ? "#8e88a8" : "#b388ff";
  const bot = beaten ? "#5d5878" : "#6d3bd6";
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" fill="none" className={className} style={{ display: "block" }} aria-label="Profit Eater mascot">
      <defs>
        <radialGradient id="pe-b" cx="42%" cy="32%" r="75%"><stop offset="0%" stopColor={top} /><stop offset="100%" stopColor={bot} /></radialGradient>
        <linearGradient id="pe-bel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.22" /><stop offset="100%" stopColor="#fff" stopOpacity="0.04" /></linearGradient>
      </defs>
      {/* horns */}
      <path d="M78 44 C72 22 96 22 92 46 Z" fill={bot} /><path d="M162 44 C168 22 144 22 148 46 Z" fill={bot} />
      {/* body */}
      <path d="M120 36 C176 36 198 78 198 124 C198 178 168 208 120 208 C72 208 42 178 42 124 C42 78 64 36 120 36 Z" fill="url(#pe-b)" stroke={beaten ? "#4a4660" : "#5326b0"} strokeWidth="3" />
      <ellipse cx="120" cy="150" rx="58" ry="46" fill="url(#pe-bel)" />
      {!beaten && (
        <>
          <path d="M44 132 C24 138 22 158 38 162" stroke={bot} strokeWidth="14" strokeLinecap="round" />
          <path d="M196 132 C216 138 218 158 202 162" stroke={bot} strokeWidth="14" strokeLinecap="round" />
        </>
      )}
      {beaten ? (
        <>
          <g stroke="#2a2740" strokeWidth="5" strokeLinecap="round">
            <path d="M82 104 l18 18 M100 104 l-18 18" /><path d="M140 104 l18 18 M158 104 l-18 18" />
          </g>
          <path d="M176 86 c-7 10 -7 18 0 18 c7 0 7 -8 0 -18 Z" fill="#7fd7ff" opacity="0.9" />
          <path d="M96 168 q24 -18 48 0" stroke="#2a2740" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M74 86 l32 12" stroke="#3a1a7a" strokeWidth="7" strokeLinecap="round" />
          <path d="M166 86 l-32 12" stroke="#3a1a7a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="93" cy="112" r="20" fill="#fff" /><circle cx="147" cy="112" r="20" fill="#fff" />
          <text x="93" y="121" textAnchor="middle" fontFamily="Sora, sans-serif" fontSize="24" fontWeight="800" fill="#2a1a4a">$</text>
          <text x="147" y="121" textAnchor="middle" fontFamily="Sora, sans-serif" fontSize="24" fontWeight="800" fill="#2a1a4a">$</text>
          <path d="M84 138 q36 46 72 0 q-36 14 -72 0 Z" fill="#2a0f4a" />
          <path d="M92 140 l8 12 l8 -10 Z" fill="#fff" /><path d="M148 140 l-8 12 l-8 -10 Z" fill="#fff" />
          <path d="M110 156 q10 14 20 0 Z" fill="#ff5d8f" />
          <circle cx="66" cy="138" r="9" fill="#ff5d8f" opacity="0.45" /><circle cx="174" cy="138" r="9" fill="#ff5d8f" opacity="0.45" />
        </>
      )}
    </svg>
  );
}
