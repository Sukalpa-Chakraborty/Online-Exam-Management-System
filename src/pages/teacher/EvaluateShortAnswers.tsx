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
    return results.filter((result) => {
      const matchingFilter =
        filter === "all" ||
        (filter === "pending" ? hasPending(result) : !hasPending(result));
      const matchingSearch =
        !term ||
        [result.studentName, result.studentEmail, result.examTitle].some(
          (val) => val?.toLowerCase().includes(term)
        );
      return matchingFilter && matchingSearch;
    });
  }, [filter, results, search]);

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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between md:p-5">
          <div className="relative flex-1 md:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, email, or exam title..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
            {(["all", "pending", "evaluated"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  filter === item
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
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
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-xs text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span>Loading submissions...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardCheck size={28} />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">
              No matching submissions
            </h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
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
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenResult(isOpen ? "" : resultId)}
                    className="flex w-full flex-col gap-4 p-5 text-left hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between md:p-6"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {result.examTitle}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            pending
                              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          }`}
                        >
                          {label(result.evaluationStatus)}
                        </span>
                      </div>

                      <h2 className="mt-2 text-base font-bold text-slate-900">
                        {result.studentName || "Student"}
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
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
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Auto / Short Marks
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {autoScore} auto •{" "}
                          {pending
                            ? `${result.pendingEvaluationCount} pending`
                            : `${result.obtainedMarks - autoScore} / ${shortMax}`}
                        </p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Accordion Area */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/40 p-5 md:p-6">
                      <div className="space-y-4">
                        {result.questions.map((question, index) => {
                          const questionId = `${result.studentId}-${question.id}`;
                          const needsGrade =
                            question.type === "short_answer" &&
                            question.evaluationStatus === "pending";

                          return (
                            <article
                              key={question.id}
                              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    Q{index + 1} • {question.type.replace("_", " ")}
                                  </span>
                                  <h3 className="mt-2 text-sm font-semibold text-slate-900 leading-relaxed">
                                    {question.question}
                                  </h3>
                                </div>

                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                  {question.awardedMarks} / {question.marks} Marks
                                </span>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                                  <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                                    Student Response
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-800">
                                    {question.selectedAnswer || "Not answered by student"}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs">
                                  <p className="font-bold text-[10px] uppercase tracking-wider text-blue-500">
                                    Reference Answer / Rubric
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-blue-900">
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
                                    className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                                  />

                                  <input
                                    value={forms[questionId]?.feedback || ""}
                                    onChange={(e) =>
                                      setForm(questionId, {
                                        feedback: e.target.value,
                                      })
                                    }
                                    placeholder="Optional instructor feedback comment..."
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => save(result, question)}
                                    disabled={saving === questionId}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
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
                                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                                    <span className="font-bold text-slate-700">
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
