export default function StatsSection() {
  const stats = [
    {
      value: "3",
      label: "Specialized Consoles",
      description: "Dedicated interfaces for Students, Teachers & Admins",
    },
    {
      value: "100%",
      label: "PWA & Mobile Ready",
      description: "Fluid experience across desktops, tablets, and smartphones",
    },
    {
      value: "< 1s",
      label: "Instant Evaluation",
      description: "Automated objective scoring upon candidate submission",
    },
    {
      value: "99.9%",
      label: "Cloud Reliability",
      description: "Resilient Firestore real-time synchronization architecture",
    },
  ];

  return (
    <section className="py-16 relative border-y border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </p>
              <h3 className="text-xs sm:text-sm font-bold text-slate-200">
                {stat.label}
              </h3>
              <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-normal">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
