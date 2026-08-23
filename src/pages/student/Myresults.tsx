import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Eye,
  FileText,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAutomatically?: boolean;
  submittedAt?: any;
  studentId?: string;
  passed?: boolean;
  evaluationStatus?: "pending" | "partially_evaluated" | "evaluated" | "completed";
}

function MyResults() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        setLoading(false);
        setError("You must be logged in to view your results.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const resultsSnapshot = await getDocs(
          collection(db, "users", user.uid, "examResults")
        );

        const loadedResults: ExamResult[] = resultsSnapshot.docs.map(
          (resultDoc) =>
            ({
              id: resultDoc.id,
              ...resultDoc.data(),
            }) as ExamResult
        );

        const finalizedResults = loadedResults.filter(
          (result) =>
            result.evaluationStatus !== "pending" &&
            result.evaluationStatus !== "partially_evaluated"
        );

        finalizedResults.sort((a, b) => {
          const firstTime = a.submittedAt?.toDate
            ? a.submittedAt.toDate().getTime()
            : 0;

          const secondTime = b.submittedAt?.toDate
            ? b.submittedAt.toDate().getTime()
            : 0;

          return secondTime - firstTime;
        });

        setResults(finalizedResults);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Unable to load your results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return results;

    return results.filter(
      (result) =>
        result.examTitle?.toLowerCase().includes(searchText) ||
        result.subject?.toLowerCase().includes(searchText)
    );
  }, [results, search]);

  const averageScore =
    results.length > 0
      ? Number(
          (
            results.reduce(
              (total, result) => total + Number(result.percentage || 0),
              0
            ) / results.length
          ).toFixed(1)
        )
      : 0;

  const passedCount = results.filter(
    (result) => Number(result.percentage || 0) >= 40
  ).length;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Date not available";

    try {
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      if (Number.isNaN(date.getTime())) return "Date not available";

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Date not available";
    }
  };

  return (
    <DashboardLayout
      role="student"
      title="My Results"
      subtitle="View your finalized examination scores and detailed reviews."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {!loading && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
              <Sparkles size={14} className="text-blue-600" />
              <span>{results.length} Completed Result{results.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Evaluated Exams
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {results.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText size={20} />
              </div>
            </div>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Average Score
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {averageScore}%
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Exams Passed
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                  {passedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Award size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Exam Results History
            </h2>
            <p className="text-xs text-slate-500">
              Check your score breakdowns and question answers
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search results by subject or title..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-500">
                Loading examination results...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResults.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Trophy size={28} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              {search ? "No matching results" : "No finalized results yet"}
            </h3>

            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              {search
                ? "Try searching with a different keyword."
                : "Results appear here once submitted exams are fully evaluated. Pending short-answer attempts can be viewed in Exam History."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => navigate("/student/exams")}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
              >
                View Available Exams
              </button>
            )}
          </div>
        )}

        {/* Result List */}
        {!loading && !error && filteredResults.length > 0 && (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const passed = Number(result.percentage || 0) >= 40;
              const awaitingEvaluation =
                result.evaluationStatus === "pending" ||
                result.evaluationStatus === "partially_evaluated";

              return (
                <div
                  key={result.id}
                  className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition md:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          passed
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {passed ? (
                          <CheckCircle2 size={22} />
                        ) : (
                          <CircleX size={22} />
                        )}
                      </div>

                      <div>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {result.subject || "General"}
                        </span>

                        <h3 className="mt-1 text-base font-bold text-slate-900">
                          {result.examTitle || "Untitled Exam"}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={14} className="text-slate-400" />
                            {formatDate(result.submittedAt)}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            {result.correctAnswers} correct
                          </span>
                          <span>•</span>
                          <span className="text-red-700 font-medium">
                            {result.wrongAnswers} incorrect
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:border-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Final Score
                        </p>

                        <p className="mt-0.5 text-lg font-bold text-slate-900">
                          {awaitingEvaluation
                            ? "Pending Grade"
                            : `${result.obtainedMarks} / ${result.totalMarks}`}
                        </p>

                        {!awaitingEvaluation && (
                          <p
                            className={`text-xs font-bold ${
                              passed ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {result.percentage}% • {passed ? "Passed" : "Failed"}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/student/exams/${result.examId}/result`, {
                            state: { result },
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                      >
                        <Eye size={15} />
                        <span>View Result</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyResults;
