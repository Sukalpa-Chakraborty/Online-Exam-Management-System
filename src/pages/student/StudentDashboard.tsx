import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { getStudentClasses } from "../../services/classService";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  startTime: string;
  questionCount?: number;
  totalQuestions?: number;
  classIds?: string[];
}

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  percentage: number;
  obtainedMarks: number;
  totalMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [completedResults, setCompletedResults] = useState<ExamResult[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  const name =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Student";

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoadingExams(false);
        return;
      }

      try {
        setLoadingExams(true);

        // Fetch student's completed exams
        const resultsRef = collection(
          db,
          "users",
          user.uid,
          "examResults"
        );

        const resultsSnapshot = await getDocs(resultsRef);

        const results: ExamResult[] = resultsSnapshot.docs.map(
          (resultDoc) => ({
            id: resultDoc.id,
            ...resultDoc.data(),
          })
        ) as ExamResult[];

        setCompletedResults(results);

        const completedExamIds = new Set(
          results.map((result) => result.examId)
        );

        // Fetch all published exams
        const examsQuery = query(
          collection(db, "exams"),
          where("status", "==", "published")
        );

        const examsSnapshot = await getDocs(examsQuery);

        const joinedClassIds = new Set(
          (await getStudentClasses(user.uid)).map((item) => item.id)
        );

        const loadedPublishedExams = examsSnapshot.docs.map(
          (examDoc) => ({
            id: examDoc.id,
            ...examDoc.data(),
          })
        ) as Exam[];

        const publishedExams: Exam[] = loadedPublishedExams
          .filter((exam) => !completedExamIds.has(exam.id))
          .filter(
            (exam) =>
              !exam.classIds?.length ||
              exam.classIds.some((classId) => joinedClassIds.has(classId))
          );

        publishedExams.sort(
          (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime()
        );

        setExams(publishedExams);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateTime: string) => {
    if (!dateTime) return "Not scheduled";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return dateTime;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const completedCount = completedResults.length;

  const averageScore =
    completedCount > 0
      ? Number(
          (
            completedResults.reduce(
              (total, result) => total + (result.percentage || 0),
              0
            ) / completedCount
          ).toFixed(1)
        )
      : 0;

  const passedCount = completedResults.filter(
    (result) => (result.percentage || 0) >= 40
  ).length;

  const completedProgress =
    completedCount + exams.length > 0
      ? (
          (completedCount / (completedCount + exams.length)) *
          100
        ).toFixed(0)
      : "0";

  const passedProgress =
    completedCount > 0
      ? ((passedCount / completedCount) * 100).toFixed(0)
      : "0";

  const stats = [
    {
      label: "Available Exams",
      value: loadingExams ? "..." : String(exams.length),
      icon: BookOpen,
      color: "blue",
      badge: `${exams.length} Ready`,
      bgIcon: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
    },
    {
      label: "Exams Completed",
      value: loadingExams ? "..." : String(completedCount),
      icon: CheckCircle2,
      color: "emerald",
      badge: "Completed",
      bgIcon: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
    },
    {
      label: "Average Score",
      value: loadingExams ? "..." : `${averageScore}%`,
      icon: TrendingUp,
      color: "indigo",
      badge: completedCount > 0 ? "Evaluated" : "Pending",
      bgIcon: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20",
    },
    {
      label: "Passed Assessments",
      value: loadingExams ? "..." : String(passedCount),
      icon: Award,
      color: "amber",
      badge: "≥ 40% Pass Mark",
      bgIcon: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
    },
  ];

  return (
    <DashboardLayout
      role="student"
      title="Student Learning Hub"
      subtitle="Track active examinations, view historical scores, and monitor your academic progress."
    >
      <div className="space-y-8">
        {/* Welcome Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-900/15 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs">
                <Sparkles size={13} className="text-amber-300 animate-pulse" />
                <span>Student Academic Center</span>
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl lg:text-4xl">
                Welcome back, {name.split(" ")[0]} 👋
              </h1>

              <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-blue-100">
                You have{" "}
                <span className="font-bold text-white underline decoration-amber-400 underline-offset-2">
                  {exams.length} active exam{exams.length === 1 ? "" : "s"}
                </span>{" "}
                available to take for your enrolled classes. Stay focused and do your best!
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/exams")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-lg shadow-black/10 transition duration-200 hover:bg-blue-50 active:scale-95"
            >
              <span>Explore Available Exams</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* 4 Stats Cards */}
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

        {/* Main Grid: Available Exams & Performance Overview */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {/* Available Exams Panel */}
          <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 md:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Available Examinations
                </h2>
                <p className="text-xs text-slate-500">
                  Recently published exams scheduled for your batches
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/student/exams")}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1 p-5 md:p-6">
              {loadingExams ? (
                <div className="flex min-h-[220px] items-center justify-center gap-3 text-xs text-slate-500">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span>Loading available exams...</span>
                </div>
              ) : exams.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    All caught up!
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    You have completed all published examinations assigned to your cohorts.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {exams.slice(0, 3).map((exam) => {
                    const questions =
                      exam.questionCount ?? exam.totalQuestions ?? 0;

                    return (
                      <div
                        key={exam.id}
                        className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
                            <CalendarDays size={19} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                {exam.subject || "General"}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock3 size={13} className="text-slate-400" />
                                {exam.duration} mins
                              </span>
                            </div>

                            <h3 className="mt-1 text-sm font-bold text-slate-900">
                              {exam.title}
                            </h3>

                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>Scheduled: {formatDate(exam.startTime)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FileQuestion size={13} className="text-slate-400" />
                                {questions} Questions
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/student/exams/${exam.id}`)}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                        >
                          Exam Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Performance Overview Donut & Stats */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Academic Performance
              </h2>
              <p className="text-xs text-slate-500">
                Overall score accuracy across evaluated exams
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="my-6 flex justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-12 border-slate-100">
                <div
                  className="absolute inset-[-12px] rounded-full border-12 border-blue-600 border-b-transparent border-l-transparent transition-transform duration-700"
                  style={{
                    transform: `rotate(${Math.min(
                      averageScore * 3.6,
                      360
                    )}deg)`,
                  }}
                />

                <div className="text-center">
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {averageScore}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Average Score
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Completed Sessions</span>
                  <span className="text-slate-900 font-bold">
                    {completedCount} Exams
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${completedProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Passed Threshold (≥40%)</span>
                  <span className="text-emerald-600 font-bold">
                    {passedCount} Passed
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${passedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
