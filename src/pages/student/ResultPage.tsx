import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Ban,
  CheckCircle2,
  CircleX,
  FileText,
  Home,
  Loader2,
  RotateCcw,
  Trophy,
} from "lucide-react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

type OptionKey = "A" | "B" | "C" | "D";

interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

interface ResultQuestion {
  id: string;
  question: string;
  type?: "mcq" | "true_false" | "short_answer";
  options?: QuestionOptions;
  correctAnswer?: OptionKey | string;
  selectedAnswer?: OptionKey | string;
  isCorrect: boolean | null;
  marks: number;
  awardedMarks?: number;
  feedback?: string;
  evaluationStatus?: "auto_evaluated" | "pending" | "evaluated";
}

interface ExamResult {
  examId: string;
  examTitle: string;
  subject: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  unanswered?: number;
  obtainedMarks?: number;
  totalMarks?: number;
  percentage?: number;
  submittedAutomatically?: boolean;
  evaluationStatus?: "pending" | "partially_evaluated" | "evaluated" | "completed";
  pendingEvaluationCount?: number;
  questions?: ResultQuestion[];
  status?: "completed" | "evaluated" | "cancelled" | "in_progress" | "submitted";
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  integrityWarningsCount?: number;
  integrityLogs?: Array<{ type: string; timestamp: string; details: string }>;
}

interface LocationState {
  result?: ExamResult;
}

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();
  const { user } = useAuth();

  const state = location.state as LocationState | null;

  const [result, setResult] = useState<ExamResult | null>(
    state?.result || null
  );

  const [loading, setLoading] = useState(!state?.result);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      if (state?.result) {
        setResult(state.result);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to view this result.");
        setLoading(false);
        return;
      }

      if (!examId) {
        setError("Exam ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const resultRef = doc(
          db,
          "users",
          user.uid,
          "examResults",
          examId
        );

        const resultSnapshot = await getDoc(resultRef);

        if (!resultSnapshot.exists()) {
          setError("This exam result was not found.");
          return;
        }

        setResult(resultSnapshot.data() as ExamResult);
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Unable to load the exam result. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [examId, user, state?.result]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">
            Calculating score results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <CircleX size={28} />
          </div>

          <h1 className="mt-4 text-base font-bold text-slate-900">
            Result Not Found
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {error || "The exam result is currently unavailable."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/student/results")}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
          >
            View My Results
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = result.status === "cancelled";

  const awaitingEvaluation =
    !isCancelled &&
    (result.evaluationStatus === "pending" ||
      result.evaluationStatus === "partially_evaluated");

  const evaluationLabel = isCancelled
    ? "Session Cancelled"
    : result.evaluationStatus === "partially_evaluated"
    ? "Partially Evaluated"
    : result.evaluationStatus === "pending"
    ? "Pending Evaluation"
    : "Evaluated";

  const percentage = Number(result.percentage || 0);
  const passed = !isCancelled && percentage >= 40;
  const questionsList = Array.isArray(result.questions) ? result.questions : [];

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {result.subject || "Exam Result"}
            </span>
            <h1 className="mt-1 text-base font-bold tracking-tight text-slate-900 md:text-lg">
              {result.examTitle || "Examination"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
          >
            <Home size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
        {/* Cancelled Banner if applicable */}
        {isCancelled && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-xs text-red-900 shadow-sm">
            <div className="flex items-center gap-2.5 font-bold text-red-700 text-sm">
              <Ban size={20} />
              <span>Exam Session Cancelled by Instructor</span>
            </div>
            <p className="mt-2 text-slate-700 leading-relaxed">
              This examination attempt was invalidated by {result.cancelledByName || "your instructor"}.
            </p>
            {result.cancellationReason && (
              <div className="mt-3 rounded-2xl bg-white/80 border border-red-100 p-3.5 italic text-slate-800">
                "{result.cancellationReason}"
              </div>
            )}
            {result.cancelledAt && (
              <p className="mt-3 text-[11px] text-slate-500">
                Cancelled on: {new Date(result.cancelledAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}

        {/* Score Summary Card */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-5">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                  isCancelled
                    ? "bg-red-50 text-red-600"
                    : passed
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isCancelled ? (
                  <Ban size={32} />
                ) : passed ? (
                  <Trophy size={32} />
                ) : (
                  <RotateCcw size={32} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isCancelled
                        ? "bg-red-100 text-red-800"
                        : passed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isCancelled ? "Cancelled" : passed ? "Passed" : "Failed"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {evaluationLabel}
                  </span>
                </div>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  {awaitingEvaluation ? (
                    "Score Pending"
                  ) : (
                    <>
                      {result.obtainedMarks ?? 0}{" "}
                      <span className="text-sm font-normal text-slate-400">
                        / {result.totalMarks ?? 0} Marks
                      </span>
                    </>
                  )}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {awaitingEvaluation
                    ? "Your submission has been saved. Final grades will appear once short-answers are evaluated."
                    : isCancelled
                    ? "Attempt was cancelled by faculty."
                    : `Final Score: ${percentage.toFixed(1)}%`}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid w-full grid-cols-3 gap-3 border-t border-slate-100 pt-4 md:w-auto md:border-0 md:pt-0">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Correct
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {result.correctAnswers ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Incorrect
                </p>
                <p className="text-xl font-bold text-red-600">
                  {result.wrongAnswers ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Unanswered
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {result.unanswered ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Answer Breakdown */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Question Review & Analysis
              </h2>
              <p className="text-xs text-slate-500">
                Detailed review of your answers and reference explanations.
              </p>
            </div>
          </div>

          {questionsList.length > 0 ? (
            <div className="space-y-4">
              {questionsList.map((question, index) => {
                const isShortAnswer = question.type === "short_answer";
                const selectedAnswerText = question.selectedAnswer
                  ? question.options?.[question.selectedAnswer as OptionKey] ||
                    question.selectedAnswer
                  : "Not Answered";

                const correctAnswerText =
                  question.correctAnswer &&
                  question.options?.[question.correctAnswer as OptionKey];

                return (
                  <div
                    key={question.id || index}
                    className={`rounded-2xl border bg-white p-5 shadow-xs transition md:p-6 ${
                      isShortAnswer
                        ? "border-blue-200/80"
                        : question.isCorrect
                        ? "border-emerald-200/80"
                        : "border-red-200/80"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            Q{index + 1}
                          </span>

                          {isShortAnswer ? (
                            <span
                              className={`text-xs font-bold ${
                                question.evaluationStatus === "evaluated"
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {question.evaluationStatus === "evaluated"
                                ? `Graded: ${question.awardedMarks} / ${question.marks} Marks`
                                : "Pending Teacher Grade"}
                            </span>
                          ) : question.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <CheckCircle2 size={15} />
                              Correct (+{question.marks} Marks)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                              <CircleX size={15} />
                              {question.selectedAnswer
                                ? "Incorrect (0 Marks)"
                                : "Unanswered (0 Marks)"}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-sm font-semibold leading-relaxed text-slate-900">
                          {question.question}
                        </h3>
                      </div>

                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {question.marks} Mark{question.marks === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Answers Comparison */}
                    <div
                      className={`mt-4 grid gap-3 ${
                        isShortAnswer ? "" : "sm:grid-cols-2"
                      }`}
                    >
                      <div
                        className={`rounded-xl p-3.5 text-xs ${
                          isShortAnswer
                            ? "bg-blue-50/70 border border-blue-100"
                            : question.isCorrect
                            ? "bg-emerald-50/70 border border-emerald-100 text-emerald-900"
                            : "bg-red-50/70 border border-red-100 text-red-900"
                        }`}
                      >
                        <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                          Your Submission
                        </p>
                        <p className="mt-1 font-semibold">
                          {isShortAnswer
                            ? question.selectedAnswer || "Not Answered"
                            : question.selectedAnswer
                            ? `${question.selectedAnswer}. ${selectedAnswerText}`
                            : "Not Answered"}
                        </p>
                      </div>

                      {!isShortAnswer && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                            Correct Answer
                          </p>
                          <p className="mt-1 font-semibold">
                            {question.correctAnswer}. {correctAnswerText || question.correctAnswer}
                          </p>
                        </div>
                      )}

                      {isShortAnswer &&
                        question.evaluationStatus === "evaluated" &&
                        question.feedback && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                              Instructor Feedback
                            </p>
                            <p className="mt-1 text-slate-700 leading-relaxed">
                              {question.feedback}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              <FileText size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="font-semibold text-slate-700">No question breakdown available</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Question-by-question review data is not recorded for this session.
              </p>
            </div>
          )}
        </section>

        {/* Footer Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center pt-4">
          <button
            type="button"
            onClick={() => navigate("/student/results")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
          >
            <FileText size={15} />
            <span>All My Results</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
          >
            <Home size={15} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResultPage;
