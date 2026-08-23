import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Users,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getAdminClasses,
  getAdminExams,
  getAdminResults,
  getAdminUsers,
  type AdminExam,
  type AdminResult,
  type AdminUser,
} from "../../services/adminService";

function AdminAnalytics() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [results, setResults] = useState<AdminResult[]>([]);
  const [classes, setClasses] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [u, e, c, r] = await Promise.all([
          getAdminUsers(),
          getAdminExams(),
          getAdminClasses(),
          getAdminResults(),
        ]);
        setUsers(u);
        setExams(e);
        setClasses(c.length);
        setResults(r);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics telemetry."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    const evaluated = results.filter(
      (x) =>
        x.evaluationStatus === "evaluated" ||
        x.evaluationStatus === "completed"
    );
    const average = evaluated.length
      ? evaluated.reduce((total, x) => total + Number(x.percentage || 0), 0) /
        evaluated.length
      : 0;
    const pass = evaluated.length
      ? (evaluated.filter((x) => Number(x.percentage || 0) >= 40).length /
          evaluated.length) *
        100
      : 0;
    const counts = new Map<string, number>();
    results.forEach((x) =>
      counts.set(x.examId || "", (counts.get(x.examId || "") || 0) + 1)
    );
    return {
      evaluated,
      average,
      pass,
      most: [...counts.entries()].sort((a, b) => b[1] - a[1])[0],
    };
  }, [results]);

  const cards = [
    {
      label: "Students",
      value: users.filter((x) => x.role === "student").length,
      icon: GraduationCap,
      color: "blue",
    },
    {
      label: "Teachers",
      value: users.filter((x) => x.role === "teacher").length,
      icon: Users,
      color: "emerald",
    },
    {
      label: "Class Batches",
      value: classes,
      icon: Users,
      color: "indigo",
    },
    {
      label: "Total Exams",
      value: exams.length,
      icon: ClipboardList,
      color: "purple",
    },
    {
      label: "Published Exams",
      value: exams.filter((x) => x.status === "published").length,
      icon: BookOpen,
      color: "emerald",
    },
    {
      label: "Submissions",
      value: results.length,
      icon: Activity,
      color: "blue",
    },
    {
      label: "Pending Grades",
      value: results.filter(
        (x) =>
          x.evaluationStatus === "pending" ||
          x.evaluationStatus === "partially_evaluated"
      ).length,
      icon: ClipboardList,
      color: "amber",
    },
    {
      label: "Evaluated Tests",
      value: data.evaluated.length,
      icon: BarChart3,
      color: "indigo",
    },
  ];

  const mostAttemptedName = data.most
    ? exams.find((x) => x.id === data.most?.[0])?.title || "Unknown Exam"
    : "No attempts yet";

  return (
    <DashboardLayout
      role="admin"
      title="System Analytics"
      subtitle="High-level platform metrics, academic score aggregations, and exam distributions."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs">
                <BarChart3 size={14} className="text-amber-300" />
                <span>Institution Aggregate Metrics</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Global Performance & Stats
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-blue-100">
                System-wide evaluation accuracy, passing rates, and active cohort participation.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {/* 8 Stats Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {loading ? "..." : card.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* 3 Analytics Aggregate Cards */}
        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Platform Average Score
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {data.average.toFixed(1)}%
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Calculated across all evaluated submissions
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overall Pass Rate (≥40%)
            </p>
            <p className="mt-2 text-4xl font-black text-emerald-600">
              {data.pass.toFixed(1)}%
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Standard 40% passing benchmark
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Most Attempted Exam
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900 line-clamp-1">
              {mostAttemptedName}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {data.most?.[1] || 0} completed submissions
            </p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminAnalytics;
