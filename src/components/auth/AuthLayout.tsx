import type { ReactNode } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { ExamSphereLogo } from "../common/ExamSphereLogo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-3 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Decorative Ambient Mesh */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[160px]" />

      <div className="relative z-10 mx-auto grid min-h-[640px] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl lg:grid-cols-12">
        {/* Left Branded Showcase Panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b1120] to-[#0f172a] p-8 xl:p-12 text-white border-r border-slate-800/80 lg:col-span-6 lg:flex">
          {/* Internal Ambient Radial Lighting */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

          {/* Logo & Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <ExamSphereLogo size={48} />

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-white font-sans">
                    ExamSphere
                  </span>
                  <span className="flex h-4 items-center rounded-full bg-blue-500/20 px-1.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Online Examination & Evaluation Platform
                </p>
              </div>
            </div>

            {/* Main Headline & Description */}
            <div className="mt-12 xl:mt-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl xl:text-[2.65rem] xl:leading-[1.18]">
                Modern examinations,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  elevated.
                </span>
              </h2>

              <p className="mt-4 max-w-lg text-xs sm:text-sm leading-relaxed text-slate-300">
                Create structured exams, manage student batches, evaluate answers, and monitor live performance telemetry with confidence.
              </p>

              {/* Feature Checklist */}
              <div className="mt-7 space-y-2.5">
                {[
                  "Live countdown timer with automated submission",
                  "Automated grading + teacher short-answer evaluation",
                  "Class cohort codes with role-protected access",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 text-xs text-slate-300"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
                      <CheckCircle2 size={13} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Responsive Feature Cards ("Secure", "Real-time", "Insights") */}
          <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {/* Secure Card */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition duration-300 hover:border-emerald-500/40 hover:bg-white/[0.07] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 transition group-hover:scale-105">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-wide">
                      Secure
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Role-protected
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Card */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition duration-300 hover:border-sky-500/40 hover:bg-white/[0.07] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 transition group-hover:scale-105">
                    <Clock3 size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-wide">
                      Real-time
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Live sync
                    </p>
                  </div>
                </div>
              </div>

              {/* Insights Card */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition duration-300 hover:border-indigo-500/40 hover:bg-white/[0.07] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30 transition group-hover:scale-105">
                    <BarChart3 size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-wide">
                      Insights
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Panel (Crisp, High-Contrast Modern White Panel) */}
        <section className="flex flex-col justify-center bg-white p-6 sm:p-10 lg:p-12 lg:col-span-6">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Header Branding */}
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <ExamSphereLogo size={44} />
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    ExamSphere
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Online Examination Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Form Slot */}
            <div className="mt-8">{children}</div>

            {/* Mobile-Only Feature Highlights */}
            <div className="mt-8 pt-6 border-t border-slate-100 lg:hidden">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <ShieldCheck className="mx-auto text-emerald-600" size={16} />
                  <p className="mt-1 text-[10px] font-bold text-slate-700">Secure</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <Clock3 className="mx-auto text-sky-600" size={16} />
                  <p className="mt-1 text-[10px] font-bold text-slate-700">Real-time</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <BarChart3 className="mx-auto text-indigo-600" size={16} />
                  <p className="mt-1 text-[10px] font-bold text-slate-700">Insights</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
