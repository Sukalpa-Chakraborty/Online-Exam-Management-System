import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-600 px-6 py-14 sm:px-12 sm:py-20 text-center text-white shadow-2xl shadow-blue-900/25">
          {/* Background Ambient Glows */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md">
              <Sparkles size={14} className="text-amber-300" />
              <span>Get Started in Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to Conduct Smarter, Simpler, and More Secure Exams?
            </h2>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Experience modern assessment technology tailored for students, teachers, and administrators. Create your account today.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 text-sm font-bold shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition duration-200 cursor-pointer"
              >
                <span>Sign In to Portal</span>
              </Link>
            </div>

            {/* Reassurance Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-blue-100/90">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-300" /> Instant activation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-300" /> Role-based access control
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-300" /> PWA & mobile ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
