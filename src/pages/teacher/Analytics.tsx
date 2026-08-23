import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import {
  getClassMembers,
  getTeacherClasses,
  type ClassBatch,
  type ClassMember,
} from "../../services/classService";

interface Exam {
  id: string;
  title: string;
  subject?: string;
  classIds?: string[];
  status?: string;
}

interface Result {
  studentId: string;
  examId: string;
  percentage?: number;
  evaluationStatus?: string;
  submittedAt?: { toDate?: () => Date };
}

interface AnalyticsRow {
  exam: Exam;
  classBatch: ClassBatch;
  members: ClassMember[];
  results: Result[];
}

const isEvaluated = (result: Result) =>
  result.evaluationStatus === "evaluated" ||
  result.evaluationStatus === "completed";

function Analytics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError("");

        const [classes, examSnapshot, resultSnapshot] = await Promise.all([
          getTeacherClasses(user.uid),
          getDocs(
            query(
              collection(db, "exams"),
              where("teacherId", "==", user.uid)
            )
          ),
          getDocs(collectionGroup(db, "examResults")),
        ]);

        const membersByClass = new Map(
          await Promise.all(
            classes.map(
              async (item) =>
                [item.id, await getClassMembers(item.id)] as const
            )
          )
        );

        const results = resultSnapshot.docs.map(
          (item) => item.data() as Result
        );
        const next: AnalyticsRow[] = [];

        examSnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Exam))
          .filter((exam) => exam.classIds?.length)
          .forEach((exam) =>
            exam.classIds?.forEach((classId) => {
              const classBatch = classes.find((item) => item.id === classId);
              if (!classBatch) return;

              const members = membersByClass.get(classId) || [];
              const enrolledIds = new Set(
                members.map((member) => member.studentId)
              );

              const unique = new Map<string, Result>();
              results
                .filter(
                  (result) =>
                    result.examId === exam.id &&
                    enrolledIds.has(result.studentId)
                )
                .forEach((result) => {
                  const prev = unique.get(result.studentId);
                  if (
                    !prev ||
                    (result.submittedAt?.toDate?.().getTime() || 0) >
                      (prev.submittedAt?.toDate?.().getTime() || 0)
                  ) {
                    unique.set(result.studentId, result);
                  }
                });

              next.push({
                exam,
                classBatch,
                members,
                results: [...unique.values()],
              });
            })
          );

        setRows(next);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          enrolled: sum.enrolled + row.members.length,
          attempted: sum.attempted + row.results.length,
          evaluated: sum.evaluated + row.results.filter(isEvaluated).length,
          pending:
            sum.pending +
            row.results.filter((result) => !isEvaluated(result)).length,
        }),
        { enrolled: 0, attempted: 0, evaluated: 0, pending: 0 }
      ),
    [rows]
  );

  const participation = totals.enrolled
    ? Math.round((totals.attempted / totals.enrolled) * 100)
    : 0;

  return (
    <DashboardLayout
      role="teacher"
      title="Exam Analytics"
      subtitle="Comprehensive class performance insights, participation tracking, and pass rates."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs">
                <BarChart3 size={14} className="text-amber-300" />
                <span>Class Participation & Academic Insights</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Analytics & Grade Metrics
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-blue-100">
                Participation is calculated based on students enrolled in each assigned class batch.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                Overall Participation
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                {participation}%
              </p>
              <p className="mt-0.5 text-xs text-blue-200">
                {totals.attempted} of {totals.enrolled} enrolled
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Enrolled Students
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {totals.enrolled}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Across assigned batches</p>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Unique Attempts
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                  {totals.attempted}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Submitted test sessions</p>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Grades
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
                  {totals.pending}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Award size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Awaiting teacher review</p>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fully Evaluated
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">
                  {totals.evaluated}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Final scores published</p>
          </div>
        </section>

        {/* Breakdown by Class Exam */}
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center gap-3 text-xs text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Loading class breakdowns...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardList size={28} />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">
              No class exam analytics yet
            </h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              Assign an examination to one of your class batches to track student participation and scores here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Class Breakdown ({rows.length})
              </h2>
              <p className="text-xs text-slate-500">
                Participation rates, pass percentages, and score distributions
              </p>
            </div>

            {rows.map((row) => {
              const enrolled = row.members.length;
              const attempted = row.results.length;
              const evaluated = row.results.filter(isEvaluated);
              const scores = evaluated.map((result) =>
                Number(result.percentage || 0)
              );
              const notAttempted = Math.max(0, enrolled - attempted);
              const attemptRate = enrolled
                ? Math.round((attempted / enrolled) * 100)
                : 0;
              const average = scores.length
                ? (
                    scores.reduce((sum, score) => sum + score, 0) /
                    scores.length
                  ).toFixed(1)
                : "-";
              const passed = scores.filter((score) => score >= 40).length;
              const passRate = scores.length
                ? ((passed / scores.length) * 100).toFixed(1)
                : "-";

              return (
                <article
                  key={`${row.exam.id}-${row.classBatch.id}`}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs"
                >
                  <header className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center md:px-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {row.classBatch.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Pass Mark: 40%
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-bold text-slate-900">
                        {row.exam.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {row.exam.subject || "General"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        row.exam.status === "published"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {row.exam.status === "published" ? "Published" : "Draft"}
                    </span>
                  </header>

                  <div className="p-5 md:p-6">
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                      {/* Participation Gauge */}
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            Class Participation Rate
                          </span>
                          <span className="font-bold text-blue-600">
                            {attemptRate}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${attemptRate}%` }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
                            <p className="text-base font-bold text-slate-900">
                              {enrolled}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase">
                              Enrolled
                            </p>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
                            <p className="text-base font-bold text-emerald-600">
                              {attempted}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase">
                              Attempted
                            </p>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 shadow-2xs">
                            <p className="text-base font-bold text-slate-500">
                              {notAttempted}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase">
                              Missing
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Scores 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Class Average
                          </p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            {average}
                            {average !== "-" ? "%" : ""}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Evaluated attempts
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Pass Percentage
                          </p>
                          <p className="mt-1 text-xl font-bold text-emerald-600">
                            {passRate}
                            {passRate !== "-" ? "%" : ""}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {passed} passed
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Highest Score
                          </p>
                          <p className="mt-1 text-xl font-bold text-indigo-600">
                            {scores.length ? Math.max(...scores) + "%" : "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Lowest Score
                          </p>
                          <p className="mt-1 text-xl font-bold text-slate-700">
                            {scores.length ? Math.min(...scores) + "%" : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {attempted - evaluated.length > 0 && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
                        <Award size={16} className="text-amber-600 shrink-0" />
                        <span>
                          <b>{attempted - evaluated.length}</b> submission
                          {attempted - evaluated.length === 1 ? " is" : "s are"}{" "}
                          awaiting short-answer grading before final scores publish.
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
