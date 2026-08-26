import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getTeacherEvaluationResults,
  saveShortAnswerEvaluation,
  type EvaluationResult,
  type ResultQuestion,
} from "../../services/evaluationService";
import { notifyStudentOfResultEvaluated } from "../../services/notificationService";

type Filter = "all" | "pending" | "evaluated";

const hasPending = (result: EvaluationResult) =>
  result.questions.some(
    (q) => q.type === "short_answer" && q.evaluationStatus === "pending"
  );

const label = (status: EvaluationResult["evaluationStatus"]) =>
  status === "pending"
    ? "Pending Evaluation"
    : status === "partially_evaluated"
    ? "Partially Evaluated"
    : "Evaluated";

function EvaluateShortAnswers() {
  const { user } = useAuth();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [openResult, setOpenResult] = useState("");
  const [forms, setForms] = useState<
    Record<string, { marks: string; feedback: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const next = await getTeacherEvaluationResults(user.uid);
      next.sort(
        (a, b) =>
          (b.submittedAt?.toDate?.().getTime() || 0) -
          (a.submittedAt?.toDate?.().getTime() || 0)
      );
      setResults(next);
    } catch (err: unknown) {
      console.error("Failed to load teacher results:", err);
      setError(
        err instanceof Error
          ? `Unable to load submissions: ${err.message}`
          : "Unable to load submissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return results.filter((item) => {
      const matchFilter =
        filter === "all"
          ? true
          : filter === "pending"
          ? hasPending(item)
          : !hasPending(item);
      if (!matchFilter) return false;
      if (!term) return true;

      const title = (item.examTitle || "").toLowerCase();
      const name = (item.studentName || "").toLowerCase();
      const email = (item.studentEmail || "").toLowerCase();
      return (
        title.includes(term) || name.includes(term) || email.includes(term)
      );
    });
  }, [results, filter, search]);

  const setForm = (
    id: string,
    patch: Partial<{ marks: string; feedback: string }>
  ) =>
    setForms((current) => ({
      ...current,
      [id]: {
        ...{ marks: "", feedback: "" },
        ...current[id],
        ...patch,
      },
    }));

  const save = async (
    result: EvaluationResult,
    question: ResultQuestion
  ) => {
    if (!user) return;
    const id = `${result.studentId}-${question.id}`;
    const form = forms[id] || { marks: "", feedback: "" };
    const marks = Number(form.marks);

    if (
      !form.marks.trim() ||
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > question.marks
    ) {
      setError(`Please enter a valid mark between 0 and ${question.marks}.`);
      return;
    }

    try {
      setSaving(id);
      setError("");
      setSuccessMessage("");

      await saveShortAnswerEvaluation({
        teacherId: user.uid,
        studentId: result.studentId,
        examId: result.examId,
        questionId: question.id,
        awardedMarks: marks,
        feedback: form.feedback,
      });

      // Dispatch evaluation notification & email
      void notifyStudentOfResultEvaluated({
        studentId: result.studentId,
        examId: result.examId,
        examTitle: result.examTitle,
        percentage: result.percentage,
      }).catch((e) => console.warn("Result notification failed:", e));

      setSuccessMessage("Score and feedback saved successfully.");
      await load();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save evaluation."
      );
    } finally {
      setSaving("");
    }
  };

  return (
    <DashboardLayout
      role="teacher"
      title="Short Answer Evaluation"
      subtitle="Review written student responses, assign marks, and provide personalized feedback."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-4 text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs md:flex-row md:items-center md:justify-between md:p-5">
          <div className="relative flex-1 md:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, email, or exam title..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 p-1 border border-transparent dark:border-slate-800">
            {(["all", "pending", "evaluated"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filter === item
                    ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item === "all"
                  ? "All Submissions"
                  : item === "pending"
                  ? "Pending Review"
                  : "Fully Evaluated"}
              </button>
            ))}
          </div>
        </section>

        {/* Submissions List */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
            <span>Loading submissions...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ClipboardCheck size={28} />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              No matching submissions
            </h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Student attempts from your published exams will appear here for grading and evaluation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((result) => {
              const resultId = `${result.studentId}-${result.examId}`;
              const pending = hasPending(result);
              const isOpen = openResult === resultId;
              const autoScore = result.questions
                .filter((q) => q.type !== "short_answer")
                .reduce((t, q) => t + Number(q.awardedMarks || 0), 0);
              const shortMax = result.questions
                .filter((q) => q.type === "short_answer")
                .reduce((t, q) => t + Number(q.marks || 0), 0);
              const submitted = result.submittedAt?.toDate?.();

              return (
                <section
                  key={resultId}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenResult(isOpen ? "" : resultId)}
                    className={`flex w-full flex-col gap-4 p-5 text-left transition md:flex-row md:items-center md:justify-between md:p-6 cursor-pointer ${
                      isOpen
                        ? "bg-slate-50/70 dark:bg-slate-800/50"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
                          {result.examTitle}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            pending
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/30"
                              : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                          }`}
                        >
                          {label(result.evaluationStatus)}
                        </span>
                      </div>

                      <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {result.studentName || "Student"}
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {result.studentEmail || "Email unavailable"}
                        {submitted
                          ? ` • Submitted ${submitted.toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Auto / Short Marks
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                          {autoScore} auto •{" "}
                          {pending
                            ? `${result.pendingEvaluationCount} pending`
                            : `${result.obtainedMarks - autoScore} / ${shortMax}`}
                        </p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Accordion Area */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-5 md:p-6">
                      <div className="space-y-4">
                        {result.questions.map((question, index) => {
                          const questionId = `${result.studentId}-${question.id}`;
                          const needsGrade =
                            question.type === "short_answer" &&
                            question.evaluationStatus === "pending";

                          return (
                            <article
                              key={question.id}
                              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Q{index + 1} • {question.type.replace("_", " ")}
                                  </span>
                                  <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                                    {question.question}
                                  </h3>
                                </div>

                                <span className="rounded-lg bg-blue-50 dark:bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
                                  {question.awardedMarks} / {question.marks} Marks
                                </span>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 text-xs">
                                  <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Student Response
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                                    {question.selectedAnswer || "Not answered by student"}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 text-xs">
                                  <p className="font-bold text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    Reference Answer / Rubric
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-blue-950 dark:text-blue-200 font-medium">
                                    {question.correctAnswer || "No rubric reference provided"}
                                  </p>
                                </div>
                              </div>

                              {needsGrade ? (
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={question.marks}
                                    step="0.5"
                                    value={forms[questionId]?.marks || ""}
                                    onChange={(e) =>
                                      setForm(questionId, {
                                        marks: e.target.value,
                                      })
                                    }
                                    placeholder={`Marks (0 - ${question.marks})`}
                                    className="w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                  />

                                  <input
                                    value={forms[questionId]?.feedback || ""}
                                    onChange={(e) =>
                                      setForm(questionId, {
                                        feedback: e.target.value,
                                      })
                                    }
                                    placeholder="Optional instructor feedback comment..."
                                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => save(result, question)}
                                    disabled={saving === questionId}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 cursor-pointer"
                                  >
                                    {saving === questionId ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Save size={14} />
                                    )}
                                    <span>Save Grade</span>
                                  </button>
                                </div>
                              ) : (
                                question.feedback && (
                                  <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs text-slate-600 dark:text-slate-300">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                      Instructor Feedback:
                                    </span>{" "}
                                    {question.feedback}
                                  </div>
                                )
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EvaluateShortAnswers;
