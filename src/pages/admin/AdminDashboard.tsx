import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Clock3,
  FileQuestion,
  GraduationCap,
  Layers3,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

function AdminDashboard() {
  const navigate = useNavigate();
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
            : "Unable to load system administration data."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: users.length,
        detail: "Registered platform accounts",
        icon: Users,
        color: "blue",
      },
      {
        label: "Students",
        value: users.filter((x) => x.role === "student").length,
        detail: "Enrolled test takers",
        icon: GraduationCap,
        color: "indigo",
      },
      {
        label: "Teachers",
        value: users.filter((x) => x.role === "teacher").length,
        detail: "Instructors & examiners",
        icon: Users,
        color: "emerald",
      },
      {
        label: "Class Batches",
        value: classes,
        detail: "Active student cohorts",
        icon: Layers3,
        color: "amber",
      },
      {
        label: "Total Exams",
        value: exams.length,
        detail: "Authored examinations",
        icon: FileQuestion,
        color: "blue",
      },
      {
        label: "Published Exams",
        value: exams.filter((x) => x.status === "published").length,
        detail: "Live and accessible",
        icon: BookOpen,
        color: "emerald",
      },
      {
        label: "Total Submissions",
        value: results.length,
        detail: "Recorded student attempts",
        icon: Activity,
        color: "purple",
      },
      {
        label: "Pending Grades",
        value: results.filter(
          (x) =>
            x.evaluationStatus === "pending" ||
            x.evaluationStatus === "partially_evaluated"
        ).length,
        detail: "Awaiting teacher review",
        icon: Clock3,
        color: "amber",
      },
    ],
    [users, exams, classes, results]
  );

  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Comprehensive real-time telemetry, user cohorts, examinations, and system moderation."
    >
      <div className="space-y-8">
        {/* Admin Command Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-xs">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>System Administration Telemetry</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Platform Operations Center
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-300">
                Live metrics derived from real-time database state. Oversee users, inspect exams, and manage platform safety.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xs transition hover:bg-slate-100 active:scale-95"
              >
                <Users size={15} />
                <span>Manage Users</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/exams")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-95"
              >
                <BookOpen size={15} />
                <span>Moderate Exams</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* 8 Stats Metrics Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">{stat.detail}</p>
              </div>
            );
          })}
        </section>

        {/* Recent Activity Grid */}
        <section className="grid gap-6 xl:grid-cols-2">
          {/* Recent Users */}
          <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 md:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Registered Accounts
                </h2>
                <p className="text-xs text-slate-500">
                  Latest students and teachers joining the platform
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1 p-5 md:p-6">
              {loading ? (
                <div className="flex min-h-[180px] items-center justify-center text-xs text-slate-500">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No registered users found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 text-xs first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        {item.photoURL ? (
                          <img
                            src={item.photoURL}
                            alt={item.name || "User"}
                            className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                            {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.name || "Unnamed user"}
                          </p>
                          <p className="text-slate-500">
                            {item.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {item.role}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.status === "disabled"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item.status || "active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Exams */}
          <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 md:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Examinations
                </h2>
                <p className="text-xs text-slate-500">
                  Authored exams across all teacher accounts
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/exams")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1 p-5 md:p-6">
              {loading ? (
                <div className="flex min-h-[180px] items-center justify-center text-xs text-slate-500">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                </div>
              ) : exams.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No exams created yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {exams.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 text-xs first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.title || "Untitled exam"}
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Teacher: {item.teacherName || "Unknown"} •{" "}
                          {item.subject || "General"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "published"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {item.status || "draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
