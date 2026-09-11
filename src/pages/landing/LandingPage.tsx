import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ValueStrip from "./components/ValueStrip";
import FeaturesSection from "./components/FeaturesSection";
import FeatureSpotlight from "./components/FeatureSpotlight";
import RolesSection from "./components/RolesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import SecuritySection from "./components/SecuritySection";
import StatsSection from "./components/StatsSection";
import PrinciplesSection from "./components/PrinciplesSection";
import FaqSection from "./components/FaqSection";
import FinalCtaSection from "./components/FinalCtaSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-400">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero with Live Mockup Visual */}
        <HeroSection />

        {/* 2. Compact Value Pillars */}
        <ValueStrip />

        {/* 3. 8-Card Features Grid */}
        <FeaturesSection />

        {/* 4. Deep-Dive Feature Spotlights */}
        <FeatureSpotlight />

        {/* 5. Personas: Students, Teachers, Admins */}
        <RolesSection />

        {/* 6. 4-Step Connected Timeline */}
        <HowItWorksSection />

        {/* 7. Responsible Security & Telemetry */}
        <SecuritySection />

        {/* 8. Grounded Product Stats */}
        <StatsSection />

        {/* 9. Examination Core Principles */}
        <PrinciplesSection />

        {/* 10. Interactive FAQ Accordion */}
        <FaqSection />

        {/* 11. High-Conversion Final CTA */}
        <FinalCtaSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
