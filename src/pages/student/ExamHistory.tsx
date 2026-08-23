import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

interface ExamHistoryItem {
  id: string;
  examId: string;
  studentId: string;
  examTitle?: string;
  subject?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  unanswered?: number;
  obtainedMarks?: number;
  totalMarks?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: any;
  submittedAutomatically?: boolean;
  evaluationStatus?: "pending" | "partially_evaluated" | "evaluated" | "completed";
}

function ExamHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        setError("You must be logged in to view your exam history.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(
          collection(db, "users", user.uid, "examResults")
        );

        const history: ExamHistoryItem[] = snapshot.docs.map(
          (resultDoc) =>
            ({
              id: resultDoc.id,
              ...resultDoc.data(),
            }) as ExamHistoryItem
        );

        history.sort((a, b) => {
          const firstTime = a.submittedAt?.toDate
            ? a.submittedAt.toDate().getTime()
            : 0;

          const secondTime = b.submittedAt?.toDate
            ? b.submittedAt.toDate().getTime()
            : 0;

          return secondTime - firstTime;
        });

        setResults(history);
      } catch (err) {
        console.error("Failed to load exam history:", err);
        setError("Unable to load your exam history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return results;

    return results.filter((result) => {
      return (
        result.examTitle?.toLowerCase().includes(searchText) ||
        result.subject?.toLowerCase().includes(searchText)
      );
    });
  }, [results, search]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Date unavailable";

    try {
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      if (Number.isNaN(date.getTime())) return "Date unavailable";

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Date unavailable";
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      if (Number.isNaN(date.getTime())) return "";

      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <DashboardLayout
      role="student"
      title="Exam History"
      subtitle="Complete chronological timeline of all your exam submissions."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation & Header */}
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
              <span>{results.length} Attempt Record{results.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {/* Search & Intro */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Past Attempts
            </h2>
            <p className="text-xs text-slate-500">
              Review submission timestamps and answer sheets
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
              placeholder="Search past exams..."
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
                Loading attempt history...
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
              <FileText size={28} />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              {search ? "No matching exams found" : "No exam history yet"}
            </h2>

            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              {search
                ? "Try searching with a different exam title or subject."
                : "Your attempted examinations will automatically appear here."}
            </p>
          </div>
        )}

        {/* List of History Items */}
        {!loading && !error && filteredResults.length > 0 && (
          <div className="space-y-3.5">
            {filteredResults.map((result) => {
              const formattedTime = formatTime(result.submittedAt);
              const isPending =
                result.evaluationStatus === "pending" ||
                result.evaluationStatus === "partially_evaluated";

              return (
                <div
                  key={result.id}
                  className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={20} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            {result.subject || "General"}
                          </span>
                          {isPending && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                              Evaluation Pending
                            </span>
                          )}
                        </div>

                        <h2 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1">
                          {result.examTitle || "Untitled Exam"}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={14} className="text-slate-400" />
                            {formatDate(result.submittedAt)}
                          </span>
                          {formattedTime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock3 size={14} className="text-slate-400" />
                                {formattedTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!result.examId) return;
                        navigate(`/student/exams/${result.examId}/result`);
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                    >
                      <span>View Submission</span>
                    </button>
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

export default ExamHistory;
