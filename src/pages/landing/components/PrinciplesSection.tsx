import {
  Compass,
  Zap,
  Eye,
  Shield,
} from "lucide-react";

export default function PrinciplesSection() {
  const principles = [
    {
      icon: Compass,
      title: "Simplicity for Students",
      description:
        "Every second in an exam counts. We removed clutter, complex menus, and sluggish transitions so candidates can focus completely on their questions.",
    },
    {
      icon: Zap,
      title: "Empowerment for Educators",
      description:
        "Teachers spend less time wrestling with exam formatting and more time teaching. Reusable question banks and automated grading streamline every term.",
    },
    {
      icon: Eye,
      title: "Transparency for Institutions",
      description:
        "No hidden algorithms or opaque metrics. Every score, time record, and telemetry event is fully visible to students and verifiable by faculty.",
    },
    {
      icon: Shield,
      title: "Reliability at Scale",
      description:
        "Built to withstand high concurrent submissions with fault-tolerant state recovery, ensuring no student loses progress due to local connectivity drops.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-slate-50/50 dark:bg-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Headline Column */}
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-block rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              Core Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Designed Around the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Examination Experience.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              We believe online examinations should be transparent, stress-free for candidates, and simple for educators to administer.
            </p>
          </div>

          {/* Right 4-Pillar Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {principles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
