import DesignTwoPage from "./design-two/page";

/**
 * The landing page renders the design-two ("THE REVEAL") flow: upload →
 * anticipation loader → inline savings reveal + lead capture. It talks to the
 * real backend via /api/analyze and /api/lead (see lib/api/config.ts).
 */
export default function Home() {
  return <DesignTwoPage />;
}
