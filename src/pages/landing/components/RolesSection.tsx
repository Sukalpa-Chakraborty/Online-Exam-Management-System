import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Shield,
  Check,
  ArrowRight,
} from "lucide-react";

export default function RolesSection() {
  const roles = [
    {
      icon: GraduationCap,
      badge: "Student Experience",
      title: "Students",
      tagline: "Learn. Attempt. Excel.",
      description:
        "A distraction-free testing environment designed to help you focus on demonstrating your knowledge.",
      points: [
        "Instant access to assigned class exams and schedules",
        "Clear countdown timers and auto-saving answer buffers",
        "Question palette with review bookmarks and navigation",
        "Immediate score breakdowns and teacher evaluations",
        "Historical exam records and continuous progress tracking",
      ],
      ctaText: "Join as Student",
      ctaLink: "/register",
      color: "from-blue-600 to-indigo-600",
      accent: "text-blue-600 dark:text-blue-400",
      bgBadge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
    },
    {
      icon: Users,
      badge: "Faculty Suite",
      title: "Teachers",
      tagline: "Create. Manage. Evaluate.",
      description:
        "Comprehensive tools to build question banks, schedule exams, and grade subjective responses effortlessly.",
      points: [
        "Intuitive exam authoring with custom weighting and negative scoring",
        "Reusable question bank library across terms and subjects",
        "Dedicated manual grading console for short-answer questions",
        "Live proctoring telemetry audit with student warning logs",
        "Automated class performance analytics and pass rate metrics",
      ],
      ctaText: "Teach with ExamSphere",
      ctaLink: "/register",
      color: "from-indigo-600 to-violet-600",
      accent: "text-indigo-600 dark:text-indigo-400",
      bgBadge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
    },
    {
      icon: Shield,
      badge: "Governance Console",
      title: "Administrators",
      tagline: "Control. Monitor. Optimize.",
      description:
        "Institutional-grade governance to oversee users, class structures, activity logs, and system health.",
      points: [
        "Global user directory with role permissions and access flags",
        "Class cohort management and instructor code assignments",
        "Complete platform activity logs and audit transparency",
        "Cross-department analytics and aggregate academic metrics",
        "Enterprise-ready role-based security architecture",
      ],
      ctaText: "Administer Platform",
      ctaLink: "/register",
      color: "from-emerald-600 to-teal-600",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    },
  ];

  return (
    <section id="roles" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            Tailored User Experiences
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Built for Everyone in the{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Academic Ecosystem.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Dedicated portals configured with role-based access control, ensuring students, teachers, and administrators each have the exact tools they need.
          </p>
        </div>

        {/* 3 Role Persona Cards Grid */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${role.color} text-white shadow-md`}
                    >
                      <Icon size={24} />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${role.bgBadge}`}
                    >
                      {role.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
                    {role.title}
                  </h3>
                  <p className={`text-xs font-bold mt-1 ${role.accent}`}>
                    {role.tagline}
                  </p>
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {role.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                          <Check size={11} />
                        </div>
                        <span className="leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to={role.ctaLink}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-white transition duration-200 cursor-pointer shadow-2xs"
                  >
                    <span>{role.ctaText}</span>
                    <ArrowRight size={14} className={role.accent} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
