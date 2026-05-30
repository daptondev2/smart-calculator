import { Footer } from "@/app/_components/ui/Footer";
import { Hero } from "@/app/_components/sections/Hero";
import { FeesVisualization } from "@/app/_components/sections/FeesVisualization";
import { CalculatorSection } from "@/app/_components/sections/CalculatorSection";
import { Comparison } from "@/app/_components/sections/Comparison";
import { Testimonials } from "@/app/_components/sections/Testimonials";
import { LeadCapture } from "@/app/_components/sections/LeadCapture";
import { FAQ } from "@/app/_components/sections/FAQ";
import { FinalCTA } from "@/app/_components/sections/FinalCTA";

/**
 * Home — the EPD Smart Calculator landing page.
 *
 * Section division mirrors the agreed structure (hero → fees → calculator →
 * comparison → testimonials → lead capture → FAQ → final CTA → footer), styled
 * entirely in the design-two "reveal" dark theme. The whole page is wrapped in
 * `.design-two-root` so the scoped --d2-* tokens apply.
 *
 * The real calculator is the global upload dialog (mounted in layout.tsx);
 * section CTAs open it via useCalculatorDialog(). No top navbar (removed by
 * request).
 */
export default function Home() {
  return (
    <div className="design-two-root font-sans">
      <main>
        <Hero />
        <FeesVisualization />
        <CalculatorSection />
        <Comparison />
        <Testimonials />
        <LeadCapture />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
