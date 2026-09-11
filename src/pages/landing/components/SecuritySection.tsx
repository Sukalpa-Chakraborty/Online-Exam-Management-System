import {
  ShieldCheck,
  Lock,
  Eye,
  KeyRound,
  FileCheck2,
  Server,
} from "lucide-react";

export default function SecuritySection() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Role-Based Access Control",
      description:
        "Strict Firebase security rules partition student, faculty, and administrator data, preventing unauthorized access across cohorts.",
    },
    {
      icon: Eye,
      title: "Transparent Assessment Telemetry",
      description:
        "Candidate monitoring is consent-based and auditable. System logs fullscreen exits and tab focus changes in chronological audit trails.",
    },
    {
      icon: KeyRound,
      title: "Secure Authentication Tokens",
      description:
        "Encrypted user identity tokens backed by Firebase Auth, securing sessions across web, tablet, and mobile PWA installations.",
    },
    {
      icon: FileCheck2,
      title: "Tamper-Resistant Answer Recovery",
      description:
        "Real-time answer persistence writes continuous checkpoints, ensuring zero data loss during network hiccups or browser crashes.",
    },
    {
      icon: Server,
      title: "Multi-Tier Cloud Infrastructure",
      description:
        "Built on distributed Google Cloud and Firebase infrastructure with real-time listeners and multi-region database resilience.",
    },
    {
      icon: ShieldCheck,
      title: "Ethical & Defensible Proctoring",
      description:
        "Avoids invasive kernel-level hooks. Combines device readiness checks with instructor audit logs for balanced academic credibility.",
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            Trust & Compliance
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Built for{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Responsible & Secure
            </span>{" "}
            Online Assessments.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            A balanced approach prioritizing student privacy, data resilience, and faculty auditability without invasive software requirements.
          </p>
        </div>

        {/* Security Grid */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all duration-300"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Security Statement Card */}
        <div className="mt-10 rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 p-6 sm:p-8 text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-3">
            <span className="rounded-full bg-blue-600 text-white p-2 shadow-xs">
              <ShieldCheck size={20} />
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Honest Integrity Telemetry: Data-Driven, Faculty-Decided
          </h4>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ExamSphere provides educators with concrete telemetry data (tab-switches, window blur events, and attempt durations) rather than opaque algorithmic black boxes, leaving final disciplinary decisions where they belong: with human educators.
          </p>
        </div>
      </div>
    </section>
  );
}
