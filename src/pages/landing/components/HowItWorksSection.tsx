import {
  FileEdit,
  PlayCircle,
  CheckSquare2,
  LineChart,
} from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Author & Schedule",
      subtitle: "Fast Exam Assembly",
      description:
        "Educators assemble questions, set duration, choose negative marking rules, and assign target classes in a few clicks.",
      icon: FileEdit,
      color: "from-blue-600 to-indigo-600",
    },
    {
      step: "02",
      title: "Conduct Securely",
      subtitle: "Controlled Testing UI",
      description:
        "Candidates pass a pre-exam hardware check, enter fullscreen lock, and take the exam with real-time auto-saving buffers.",
      icon: PlayCircle,
      color: "from-indigo-600 to-violet-600",
    },
    {
      step: "03",
      title: "Evaluate Submissions",
      subtitle: "Hybrid Score Engine",
      description:
        "MCQs and True/False questions evaluate immediately, while short-answers route directly to the teacher's grading console.",
      icon: CheckSquare2,
      color: "from-violet-600 to-purple-600",
    },
    {
      step: "04",
      title: "Analyze & Improve",
      subtitle: "Actionable Telemetry",
      description:
        "Students review question-level insights, while teachers and admins explore grade distributions and cohort trends.",
      icon: LineChart,
      color: "from-emerald-600 to-teal-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            Streamlined Workflow
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            How ExamSphere{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Powers Every Exam.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            A seamless, four-stage lifecycle from initial question drafting to final institutional performance analytics.
          </p>
        </div>

        {/* 4-Step Timeline Grid */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs flex flex-col justify-between"
              >
                {/* Step Marker Badge */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono tracking-wider text-slate-300 dark:text-slate-700">
                      {item.step}
                    </span>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-sm`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-wide">
                    {item.subtitle}
                  </p>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Stage {idx + 1} of 4</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Phase {item.step}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
