import {
  Calendar,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  Eye,
  UserCheck,
} from "lucide-react";

export default function FeatureSpotlight() {
  return (
    <section id="spotlight" className="py-20 sm:py-28 relative overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
        {/* Spotlight 1: Exam Builder & Scheduler */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              <Calendar size={13} />
              <span>Exam Architecture</span>
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Create, Configure, and Schedule in Minutes.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Design assessments with custom time limits, passing thresholds, negative markings, and cohort assignments. Link existing question banks or author new questions seamlessly.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Assign to specific class batches or entire cohorts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Instant drafting with draft / published status toggles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Custom marks per question and negative score weighting</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    📝
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Exam Configuration Studio</h4>
                    <p className="text-[10px] text-slate-400">Drafting: Data Structures Final 2026</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20">
                  Ready to Publish
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">90 Minutes</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pass Mark</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">40% Threshold</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Cohort</span>
                  </div>
                  <span className="rounded bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    CS-2026-Batch-A (48 Students)
                  </span>
                </div>

                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-200">Question Bank Composition</span>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">30 Questions (60 Marks)</span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-semibold">
                    <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">20 Multiple Choice</span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">5 True / False</span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">5 Short Answer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spotlight 2: Analytics & Real-Time Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Class Performance Telemetry</h4>
                  <p className="text-[10px] text-slate-400">Evaluation: Algorithms & Complexity Analysis</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <TrendingUp size={15} />
                  <span>+8.4% vs Previous Term</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Average</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">82.4%</p>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pass Rate</span>
                  <p className="text-lg font-black text-emerald-600 mt-1">94.1%</p>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluated</span>
                  <p className="text-lg font-black text-blue-600 mt-1">48 / 48</p>
                </div>
              </div>

              {/* Mock Score Distribution Bars */}
              <div className="mt-5 space-y-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Grade Tier Distribution</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-12 text-slate-400 font-semibold">90-100%</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
                    </div>
                    <span className="w-8 font-bold text-right text-slate-700 dark:text-slate-300">45%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-12 text-slate-400 font-semibold">75-89%</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[35%]" />
                    </div>
                    <span className="w-8 font-bold text-right text-slate-700 dark:text-slate-300">35%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-12 text-slate-400 font-semibold">50-74%</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-[14%]" />
                    </div>
                    <span className="w-8 font-bold text-right text-slate-700 dark:text-slate-300">14%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
              <BarChart2 size={13} />
              <span>Insight Engine</span>
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Instant Results & Deep Performance Insights.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Objective questions evaluate immediately upon submission. Faculty can rapidly review short-answers with inline feedback, providing students with transparency and rapid turnaround.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Automatic score calculation with instant percentage breakdown</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Instructor feedback boxes for subjective question grading</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Class analytics summary and individual submission histories</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Spotlight 3: Ethical, Non-Invasive Assessment Integrity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 dark:bg-rose-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
              <ShieldCheck size={13} />
              <span>Responsible Integrity</span>
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Transparent, Defensible Exam Integrity.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Maintain academic credibility without intrusive software. ExamSphere combines pre-exam hardware verification, tab-switch telemetry, and instructor oversight for a balanced approach.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Fullscreen enforcement with soft warning thresholds</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Pre-exam camera, microphone, and connectivity verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Chronological violation audit timeline accessible to educators</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Proctoring Inspector</h4>
                </div>
                <span className="rounded bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  Verified Candidate Stream
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5">
                    <span className="text-[10px] font-bold text-slate-400">Tab Focus</span>
                    <p className="font-bold text-emerald-600 text-xs mt-0.5">100% Focused</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5">
                    <span className="text-[10px] font-bold text-slate-400">Warnings</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">0 Events</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5">
                    <span className="text-[10px] font-bold text-slate-400">Device Lock</span>
                    <p className="font-bold text-blue-600 text-xs mt-0.5">Fullscreen</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye size={13} className="text-blue-500" />
                    <span>Audit Trail Log</span>
                  </p>
                  <div className="space-y-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span>10:00:04 AM • Hardware check passed</span>
                      <span className="text-emerald-500 font-bold">VERIFIED</span>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span>10:00:15 AM • Fullscreen mode initiated</span>
                      <span className="text-blue-500 font-bold">LOCKED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
