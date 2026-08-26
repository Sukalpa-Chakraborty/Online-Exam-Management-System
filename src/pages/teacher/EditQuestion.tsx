import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  FileQuestion,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

type QuestionType = "mcq" | "true-false" | "short-answer";

function EditQuestion() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const { user } = useAuth();

  const [question, setQuestion] = useState("");
  const [type, setType] = useState<QuestionType>("mcq");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) {
        setError("Question ID is missing.");
        setLoading(false);
        return;
      }

      if (!user) return;

      try {
        setLoading(true);
        setError("");

        const questionRef = doc(db, "questionBank", questionId);
        const questionSnapshot = await getDoc(questionRef);

        if (!questionSnapshot.exists()) {
          setError("Question not found.");
          return;
        }

        const data = questionSnapshot.data();

        if (data.teacherId !== user.uid) {
          setError("You are not authorized to edit this question.");
          return;
        }

        setQuestion(data.question || "");
        setType((data.type as QuestionType) || "mcq");
        setMarks(Number(data.marks) || 1);
        setCorrectAnswer(data.correctAnswer || "");

        if (data.type === "mcq" && Array.isArray(data.options)) {
          const loaded = data.options.map((opt: string) => opt || "");
          while (loaded.length < 4) loaded.push("");
          setOptions(loaded);
        } else {
          setOptions(["", "", "", ""]);
        }
      } catch (err) {
        console.error("Failed to load question:", err);
        setError("Failed to load the question. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadQuestion();
  }, [questionId, user]);

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setError("");
    setSuccess("");

    if (newType === "true-false") {
      setCorrectAnswer("True");
    } else if (newType === "mcq") {
      setCorrectAnswer(options[0] || "");
    } else {
      setCorrectAnswer("");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    const previousValue = next[index];
    next[index] = value;
    setOptions(next);

    if (correctAnswer === previousValue) {
      setCorrectAnswer(value);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const removedValue = options[index];
    const next = options.filter((_, i) => i !== index);
    setOptions(next);

    if (correctAnswer === removedValue) {
      setCorrectAnswer(next[0] || "");
    }
  };

  const validate = () => {
    if (!question.trim()) {
      setError("Please provide question text.");
      return false;
    }

    if (marks <= 0) {
      setError("Marks must be at least 1.");
      return false;
    }

    if (type === "mcq") {
      const filled = options.map((opt) => opt.trim()).filter(Boolean);
      if (filled.length < 2) {
        setError("Please provide at least 2 choices.");
        return false;
      }
      if (!correctAnswer || !filled.includes(correctAnswer.trim())) {
        setError("Please designate a valid correct choice.");
        return false;
      }
    }

    if (type === "true-false") {
      if (!correctAnswer || !["True", "False"].includes(correctAnswer)) {
        setError("Please specify True or False as the answer.");
        return false;
      }
    }

    if (type === "short-answer") {
      if (!correctAnswer.trim()) {
        setError("Please provide reference guidelines for manual evaluation.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;
    if (!questionId || !user) return;

    try {
      setSaving(true);

      const updatePayload: Record<string, unknown> = {
        question: question.trim(),
        type,
        marks,
        correctAnswer: correctAnswer.trim(),
        updatedAt: serverTimestamp(),
      };

      if (type === "mcq") {
        updatePayload.options = options.map((opt) => opt.trim()).filter(Boolean);
      } else if (type === "true-false") {
        updatePayload.options = ["True", "False"];
      } else {
        updatePayload.options = [];
      }

      await updateDoc(doc(db, "questionBank", questionId), updatePayload);

      setSuccess("Question updated successfully.");

      setTimeout(() => {
        navigate("/teacher/questions");
      }, 700);
    } catch (err) {
      console.error("Failed to update question:", err);
      setError("Failed to update question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        title="Edit Question"
        subtitle="Loading question parameters..."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Loading question...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      title="Edit Question"
      subtitle="Modify and update your reusable question."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/teacher/questions")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 transition hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Question Bank</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <FileQuestion size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
                  Edit Question
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Update question prompt, choices, or reference answers.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-3 text-xs font-medium text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* Question Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Question Type
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "mcq", label: "Multiple Choice" },
                  { key: "true-false", label: "True / False" },
                  { key: "short-answer", label: "Short Answer" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTypeChange(item.key as QuestionType)}
                    className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      type === item.key
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Question Text
              </label>
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question text..."
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Marks */}
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Marks
              </label>
              <input
                type="number"
                min="1"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* MCQ Options */}
            {type === "mcq" && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Choices (Select radio for correct answer)
                  </span>

                  <button
                    type="button"
                    onClick={addOption}
                    disabled={options.length >= 6}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Choice</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctChoice"
                        checked={correctAnswer === option && option !== ""}
                        onChange={() => setCorrectAnswer(option)}
                        className="h-4 w-4 accent-emerald-600 cursor-pointer"
                      />

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 dark:border-red-900/50 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* True / False */}
            {type === "true-false" && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Correct Answer
                </label>
                <div className="flex gap-3">
                  {["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCorrectAnswer(opt)}
                      className={`flex-1 rounded-2xl border py-3 text-xs font-bold transition cursor-pointer ${
                        correctAnswer === opt
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer */}
            {type === "short-answer" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reference Guidelines / Evaluation Rubric
                </label>
                <textarea
                  rows={3}
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter reference points for evaluation..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate("/teacher/questions")}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EditQuestion;