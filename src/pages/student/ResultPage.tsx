import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
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
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAutomatically: boolean;
  evaluationStatus?: "pending" | "partially_evaluated" | "evaluated" | "completed";
  pendingEvaluationCount?: number;
  questions: ResultQuestion[];
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
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            View My Results
          </button>
        </div>
      </div>
    );
  }

  const awaitingEvaluation =
    result.evaluationStatus === "pending" ||
    result.evaluationStatus === "partially_evaluated";

  const evaluationLabel =
    result.evaluationStatus === "partially_evaluated"
      ? "Partially Evaluated"
      : result.evaluationStatus === "pending"
      ? "Pending Evaluation"
      : "Evaluated";

  const passed = Number(result.percentage) >= 40;

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {result.subject || "Exam Result"}
            </span>
            <h1 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
              {result.examTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <Home size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {result.submittedAutomatically && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-800">
            Time expired. Your examination was submitted automatically.
          </div>
        )}

        {awaitingEvaluation && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs leading-relaxed text-amber-900">
            <span className="font-bold">{evaluationLabel}.</span> Your short-answer response
            {result.pendingEvaluationCount === 1 ? " is" : "s are"} awaiting instructor grading. Your final score will automatically calculate once all answers are reviewed.
          </div>
        )}

        {/* Score Showcase Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${
                awaitingEvaluation
                  ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30"
                  : passed
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
              }`}
            >
              {awaitingEvaluation ? (
                <Loader2 size={36} className="animate-spin" />
              ) : passed ? (
                <Trophy size={36} />
              ) : (
                <CircleX size={36} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {awaitingEvaluation ? "Evaluation Status" : "Obtained Score"}
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {awaitingEvaluation
                  ? evaluationLabel
                  : `${result.obtainedMarks} / ${result.totalMarks}`}
              </h2>

              <p className="mt-2 text-xs text-slate-300">
                {awaitingEvaluation
                  ? "Final score is pending short-answer teacher evaluations."
                  : `You attained a score of ${result.percentage}% in this examination.`}
              </p>

              {!awaitingEvaluation && (
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider ${
                    passed
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                  }`}
                >
                  {passed ? "EXAM PASSED" : "NEEDS IMPROVEMENT"}
                </span>
              )}
            </div>

            {!awaitingEvaluation && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Percentage
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {result.percentage}%
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 3 Metric Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Correct
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {result.correctAnswers} Questions
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <CircleX size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Incorrect
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {result.wrongAnswers} Questions
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <RotateCcw size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Unanswered
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {result.unanswered} Questions
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

          <div className="space-y-4">
            {result.questions.map((question, index) => {
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
                  key={question.id}
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
                          {question.correctAnswer}. {correctAnswerText}
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
        </section>

        {/* Footer Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center pt-4">
          <button
            type="button"
            onClick={() => navigate("/student/results")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <FileText size={15} />
            <span>All My Results</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
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
