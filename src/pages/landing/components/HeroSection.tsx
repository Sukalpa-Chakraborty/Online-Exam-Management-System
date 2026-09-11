import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import HeroVisual from "./HeroVisual";

export default function HeroSection() {
  const handleScrollToSpotlight = () => {
    const element = document.querySelector("#spotlight");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
      {/* Background Ambient Radial Lights */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-[120px]" />
        <div className="h-[400px] w-[400px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] -translate-y-20 translate-x-32" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs backdrop-blur-md">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Next-Generation Online Examination System</span>
            <span className="h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">ExamSphere 2.0</span>
          </div>
        </div>

        {/* Hero Headline & Subhead */}
        <div className="mt-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.1]">
            The Smarter Way to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Conduct Online Exams.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ExamSphere brings exam creation, student cohorts, live proctoring telemetry, automated scoring, and actionable analytics together in one unified platform.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </Link>

            <button
              type="button"
              onClick={handleScrollToSpotlight}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition duration-200 cursor-pointer"
            >
              <Zap size={16} className="text-amber-500" />
              <span>Explore Platform</span>
            </button>
          </div>

          {/* Trust Highlights Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Live Integrity Telemetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Instant Score Calculations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Mobile & PWA Ready</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-14 sm:mt-18">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
