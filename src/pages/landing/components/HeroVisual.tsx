import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Video,
  Mic,
  Maximize2,
  Sparkles,
  BookOpen,
  Users,
  Activity,
} from "lucide-react";

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Background Decorative Glows */}
      <div className="absolute -top-12 -left-12 -z-10 h-72 w-72 rounded-full bg-blue-500/20 dark:bg-blue-600/15 blur-3xl filter" />
      <div className="absolute -bottom-10 -right-10 -z-10 h-80 w-80 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-3xl filter" />

      {/* Main Glassmorphic Mockup Container */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xl shadow-blue-900/10 dark:shadow-black/60 backdrop-blur-xl transition-all duration-300">
        {/* Mock Browser/App Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-950/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <div className="ml-3 hidden sm:flex items-center gap-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/80 px-3 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <span className="text-emerald-500">https://</span>
              <span>examsphere.edu/student/exams/live</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Proctoring Active
            </span>
          </div>
        </div>

        {/* Mock App Interface Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] sm:min-h-[420px]">
          {/* Mock Sidebar */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-between border-r border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 rounded-xl">
                <BookOpen size={14} />
                <span>Live Assessment</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">
                <Activity size={14} />
                <span>Question Bank</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">
                <Users size={14} />
                <span>My Classes</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">
                <Award size={14} />
                <span>Results & History</span>
              </div>
            </div>

            {/* Candidate Identity Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                  SC
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    Candidate #4092
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                    Verified Student
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Center Content Area */}
          <div className="md:col-span-9 p-4 sm:p-6 space-y-4">
            {/* Header Exam Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    CS302
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Midterm Examination
                  </span>
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Distributed Systems & Scalable Architecture
                </h3>
              </div>

              {/* Countdown Timer Display */}
              <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-3.5 py-2 shadow-2xs border border-slate-200/80 dark:border-slate-700/80">
                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Remaining
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    42 : 18
                  </p>
                </div>
              </div>
            </div>

            {/* Question Progress & Proctoring Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Question Navigation Progress */}
              <div className="sm:col-span-2 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Progress: 28 of 30 Answered
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    93.3%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 w-[93.3%]" />
                </div>

                {/* Question Bubbles Grid */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${
                        i === 11
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                  <div className="flex h-6 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +18
                  </div>
                </div>
              </div>

              {/* Integrity Telemetry Status */}
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Telemetry Status</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Non-invasive monitoring
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <Video size={12} className="text-blue-500" /> Camera
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <Mic size={12} className="text-indigo-500" /> Audio
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <Maximize2 size={12} className="text-amber-500" /> Screen
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Locked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Question Card Preview */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  Question 12 of 30 • 2 Marks
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Auto-saved 2s ago
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                Which consensus algorithm guarantees safety under partial synchrony with 3f + 1 nodes?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl border border-blue-500/50 bg-blue-50/80 dark:bg-blue-900/30 p-2.5 font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">A</span>
                  <span>PBFT (Practical Byzantine Fault Tolerance)</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 font-medium text-slate-700 dark:text-slate-300 opacity-70">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">B</span>
                  <span>Proof of Work (Nakamoto)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Micro-Cards */}
      <div className="absolute -bottom-5 -left-4 sm:-left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl shadow-slate-900/10 dark:shadow-black/60 backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">99.98% System Uptime</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Fault-tolerant exam delivery</p>
        </div>
      </div>

      <div className="absolute -top-5 -right-4 sm:-right-6 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl shadow-slate-900/10 dark:shadow-black/60 backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Instant Auto-Evaluation</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Objective score calculation</p>
        </div>
      </div>
    </div>
  );
}
