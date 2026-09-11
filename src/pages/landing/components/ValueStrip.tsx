import {
  Shield,
  BarChart3,
  Users2,
  Sliders,
} from "lucide-react";

export default function ValueStrip() {
  const pillars = [
    {
      icon: Shield,
      title: "Secure Assessments",
      description:
        "Controlled examination workflows with non-invasive integrity telemetry and tab-switch monitoring.",
      color: "from-blue-600 to-indigo-600",
      bgLight: "bg-blue-50/70 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description:
        "Automated objective grading, class pass percentages, score distributions, and performance insights.",
      color: "from-indigo-600 to-violet-600",
      bgLight: "bg-indigo-50/70 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: Users2,
      title: "Role-Based Architecture",
      description:
        "Dedicated, specialized consoles tailored for Students, Teachers, and Institutional Administrators.",
      color: "from-emerald-600 to-teal-600",
      bgLight: "bg-emerald-50/70 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Sliders,
      title: "Effortless Management",
      description:
        "Create question banks, schedule exams, assign class batches, and review submissions in one hub.",
      color: "from-amber-600 to-orange-600",
      bgLight: "bg-amber-50/70 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <section className="relative py-12 border-y border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition duration-300"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${pillar.bgLight} ${pillar.iconColor} transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
