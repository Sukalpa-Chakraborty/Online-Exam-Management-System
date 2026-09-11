import {
  FilePlus2,
  Database,
  Timer,
  CheckCircle,
  GraduationCap,
  Laptop,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: FilePlus2,
      title: "Streamlined Exam Builder",
      description:
        "Draft, configure total marks, negative marking, time limits, and cohort assignments with a fast, intuitive workflow.",
      tag: "Creation",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      icon: Database,
      title: "Modular Question Bank",
      description:
        "Build a reusable repository of MCQs, True/False, and Short-Answer questions categorized by subject, difficulty, and marks.",
      tag: "Content",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      icon: Timer,
      title: "Synchronized Live Timer",
      description:
        "Accurate countdown timers with server timestamp synchronization, auto-save state recovery, and automatic submission.",
      tag: "Engine",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      icon: CheckCircle,
      title: "Automated Grading Engine",
      description:
        "Instant score calculations for objective questions with dedicated manual review workflows for subjective answers.",
      tag: "Scoring",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      icon: GraduationCap,
      title: "Teacher Faculty Suite",
      description:
        "Manage active exams, evaluate student responses, inspect attempt telemetry, and issue custom instructor feedback.",
      tag: "Faculty",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      icon: Laptop,
      title: "Distraction-Free Student Portal",
      description:
        "A clean, focused testing UI featuring question palettes, mark-for-review tags, auto-saving, and immediate score breakdowns.",
      tag: "Student",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
    },
    {
      icon: ShieldAlert,
      title: "Integrity Telemetry",
      description:
        "Transparent, consent-based monitoring tracking fullscreen compliance, tab-switches, and media readiness with audit logs.",
      tag: "Proctoring",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      icon: SlidersHorizontal,
      title: "Institutional Admin Console",
      description:
        "Comprehensive user directory management, class oversight, platform activity logging, and aggregate performance analytics.",
      tag: "Governance",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Everything Needed to Run{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Flawless Online Exams.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Engineered from the ground up to support students, educators, and administrators with a reliable, end-to-end evaluation cycle.
          </p>
        </div>

        {/* Features 8-Card Grid */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.bg} ${feature.color} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Explore Feature</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
