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

    loadQuestion();
  }, [questionId, user]);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    const oldVal = updated[index];
    updated[index] = value;
    setOptions(updated);
    if (correctAnswer === oldVal) {
      setCorrectAnswer(value);
    }
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const removed = options[index];
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctAnswer === removed) {
      setCorrectAnswer("");
    }
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setCorrectAnswer("");
    if (newType === "mcq") {
      setOptions(["", "", "", ""]);
    }
  };

  const validateForm = () => {
    if (!question.trim()) {
      setError("Please enter the question text.");
      return false;
    }

    if (!marks || Number(marks) < 1) {
      setError("Marks must be at least 1.");
      return false;
    }

    if (type === "mcq") {
      const valid = options.filter((opt) => opt.trim() !== "");
      if (valid.length < 2) {
        setError("Please provide at least two choices.");
        return false;
      }

      if (!correctAnswer) {
        setError("Please select the correct answer choice.");
        return false;
      }
    }

    if (type === "true-false" && !correctAnswer) {
      setError("Please choose True or False as correct answer.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !questionId) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      const validOptions =
        type === "mcq"
          ? options.map((opt) => opt.trim()).filter((opt) => opt !== "")
          : [];

      const questionRef = doc(db, "questionBank", questionId);
      await updateDoc(questionRef, {
        question: question.trim(),
        type,
        marks: Number(marks),
        options: validOptions,
        correctAnswer: type === "short-answer" ? "" : correctAnswer,
        updatedAt: serverTimestamp(),
      });

      setSuccess("Question updated successfully in Question Bank.");
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
            <p className="text-xs font-medium text-slate-500">
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Question Bank</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          {/* Header */}
          <div className="border-b border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileQuestion size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 md:text-xl">
                  Edit Question
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update question prompt, choices, or reference answers.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Question Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      type === item.key
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Question Text
              </label>
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question text..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Marks */}
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Marks
              </label>
              <input
                type="number"
                min="1"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* MCQ Options */}
            {type === "mcq" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Choices (Select radio for correct answer)
                  </span>

                  <button
                    type="button"
                    onClick={addOption}
                    disabled={options.length >= 6}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
                        className="h-4 w-4 accent-emerald-600"
                      />

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
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
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Select Correct Answer
                </label>
                <div className="flex gap-3">
                  {["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCorrectAnswer(opt)}
                      className={`flex-1 rounded-2xl border py-3 text-xs font-bold transition ${
                        correctAnswer === opt
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate("/teacher/questions")}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
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