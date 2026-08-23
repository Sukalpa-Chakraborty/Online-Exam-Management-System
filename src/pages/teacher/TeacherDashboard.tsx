import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { collection, collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { getClassMembers, getTeacherClasses } from "../../services/classService";

interface Exam {
  id: string;
  title: string;
  subject?: string;
  status?: string;
  totalQuestions?: number;
  questionCount?: number;
  createdAt?: { toDate?: () => Date };
}

interface Result {
  teacherId?: string;
  percentage?: number;
  evaluationStatus?: string;
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const name =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Teacher";

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubscribeExams = onSnapshot(
      query(collection(db, "exams"), where("teacherId", "==", user.uid)),
      (snapshot) => {
        setExams(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Exam))
        );
        setLoading(false);
      }
    );

    const unsubscribeResults = onSnapshot(
      collectionGroup(db, "examResults"),
      (snapshot) =>
        setResults(
          snapshot.docs
            .map((item) => item.data() as Result)
            .filter((item) => item.teacherId === user.uid)
        )
    );

    void (async () => {
      const classes = await getTeacherClasses(user.uid);
      const memberships = await Promise.all(
        classes.map((item) => getClassMembers(item.id))
      );
      setStudentCount(
        new Set(memberships.flat().map((member) => member.studentId)).size
      );
    })();

    return () => {
      unsubscribeExams();
      unsubscribeResults();
    };
  }, [user]);

  const stats = useMemo(() => {
    const finalResults = results.filter(
      (result) =>
        result.evaluationStatus === "evaluated" ||
        result.evaluationStatus === "completed"
    );

    const average = finalResults.length
      ? (
          finalResults.reduce(
            (total, result) => total + Number(result.percentage || 0),
            0
          ) / finalResults.length
        ).toFixed(1)
      : "-";

    return [
      {
        label: "Total Exams",
        value: exams.length,
        detail: "Authored papers",
        icon: FileText,
        badge: "Exam Library",
        bgIcon: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
      },
      {
        label: "Published Exams",
        value: exams.filter((exam) => exam.status === "published").length,
        detail: "Active for students",
        icon: CheckCircle2,
        badge: "Live Tests",
        bgIcon: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
      },
      {
        label: "Enrolled Students",
        value: studentCount,
        detail: "Across your batches",
        icon: Users,
        badge: "Active Cohorts",
        bgIcon: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20",
      },
      {
        label: "Class Average",
        value: average === "-" ? "-" : `${average}%`,
        detail: "Evaluated results",
        icon: BarChart3,
        badge: "Pass Average",
        bgIcon: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
      },
    ];
  }, [exams, results, studentCount]);

  const recent = [...exams]
    .sort(
      (a, b) =>
        (b.createdAt?.toDate?.().getTime() || 0) -
        (a.createdAt?.toDate?.().getTime() || 0)
    )
    .slice(0, 5);

  return (
    <DashboardLayout
      role="teacher"
      title="Instructor Workspace"
      subtitle="Manage examination papers, student rosters, question inventories, and grading queues."
    >
      <div className="space-y-8">
        {/* Workspace Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-900/15 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Instructor Command Hub</span>
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl lg:text-4xl">
                Welcome, {name}
              </h1>

              <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-blue-100">
                You have{" "}
                <span className="font-bold text-white">
                  {exams.length} examination paper{exams.length === 1 ? "" : "s"}
                </span>{" "}
                and {studentCount} enrolled student{studentCount === 1 ? "" : "s"} in your active class cohorts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/teacher/create-exam")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-lg shadow-black/10 transition duration-200 hover:bg-blue-50 active:scale-95"
            >
              <Plus size={16} />
              <span>Create New Exam</span>
            </button>
          </div>
        </section>

        {/* 4 Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-12 text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="app-card relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                          {stat.value}
                        </p>
                      </div>

                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.bgIcon}`}>
                        <Icon size={20} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        {stat.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Recent Exams & Quick Actions */}
            <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Recent Exams Card */}
              <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 p-5 md:px-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Recent Examinations
                    </h2>
                    <p className="text-xs text-slate-500">
                      Live sync of authored assessment papers
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/teacher/exams")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>View all</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="flex-1 p-5 md:p-6">
                  {recent.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-slate-800">
                        No exams created yet
                      </h3>
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        Get started by clicking Create New Exam to author your first assessment.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recent.map((exam) => (
                        <div
                          key={exam.id}
                          className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
                              <BookOpen size={19} />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                  {exam.subject || "General"}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    exam.status === "published"
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                  }`}
                                >
                                  {exam.status === "published"
                                    ? "Published"
                                    : "Draft"}
                                </span>
                              </div>

                              <h3 className="mt-1 text-sm font-bold text-slate-900">
                                {exam.title || "Untitled Exam"}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                {exam.questionCount ?? exam.totalQuestions ?? 0}{" "}
                                questions on paper
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/teacher/exams/${exam.id}/edit`)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                          >
                            <span>Manage</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Quick Actions
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Direct shortcuts to key teacher workflows
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    {
                      label: "Create New Exam",
                      detail: "Author and publish a new examination",
                      path: "/teacher/create-exam",
                      icon: Plus,
                    },
                    {
                      label: "Manage Classes",
                      detail: "View student enrollments & batch codes",
                      path: "/teacher/classes",
                      icon: Users,
                    },
                    {
                      label: "Question Bank",
                      detail: "Manage reusable question inventory",
                      path: "/teacher/questions",
                      icon: BookOpen,
                    },
                    {
                      label: "Evaluate Short Answers",
                      detail: "Grade student text responses",
                      path: "/teacher/evaluations",
                      icon: GraduationCap,
                    },
                    {
                      label: "View Class Analytics",
                      detail: "Analyze participation and pass rates",
                      path: "/teacher/analytics",
                      icon: BarChart3,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 p-3 text-left transition duration-200 hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-200 group-hover:bg-blue-600 group-hover:text-white">
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                            {item.label}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {item.detail}
                          </p>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboard;
