import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Save,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

type QuestionType = "mcq" | "true-false" | "short-answer";
type OptionKey = "A" | "B" | "C" | "D";

interface QuestionForm {
  question: string;
  type: QuestionType;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  marks: number;
}

const initialQuestion: QuestionForm = {
  question: "",
  type: "mcq",
  options: {
    A: "",
    B: "",
    C: "",
    D: "",
  },
  correctAnswer: "A",
  marks: 1,
};

function AddQuestion() {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();

  const [question, setQuestion] = useState<QuestionForm>(initialQuestion);
  const [examTitle, setExamTitle] = useState("Loading exam...");
  const [loadingExam, setLoadingExam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadExam = async () => {
      if (!examId) {
        setError("Exam ID is missing.");
        setLoadingExam(false);
        return;
      }

      try {
        setLoadingExam(true);
        const examRef = doc(db, "exams", examId);
        const examSnapshot = await getDoc(examRef);

        if (!examSnapshot.exists()) {
          setError("Exam not found.");
          return;
        }

        const examData = examSnapshot.data();
        setExamTitle(examData.title || "Untitled Exam");
      } catch (err) {
        console.error("Failed to load exam:", err);
        setError("Failed to load exam details.");
      } finally {
        setLoadingExam(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleTypeChange = (type: QuestionType) => {
    setError("");
    setSuccess("");

    if (type === "mcq") {
      setQuestion({
        question: question.question,
        type: "mcq",
        options: { A: "", B: "", C: "", D: "" },
        correctAnswer: "A",
        marks: question.marks || 1,
      });
      return;
    }

    if (type === "true-false") {
      setQuestion({
        question: question.question,
        type: "true-false",
        options: { A: "True", B: "False", C: "", D: "" },
        correctAnswer: "A",
        marks: question.marks || 1,
      });
      return;
    }

    setQuestion({
      question: question.question,
      type: "short-answer",
      options: { A: "", B: "", C: "", D: "" },
      correctAnswer: "",
      marks: question.marks || 1,
    });
  };

  const handleQuestionChange = (value: string) => {
    setQuestion((prev) => ({ ...prev, question: value }));
  };

  const handleOptionChange = (option: OptionKey, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: { ...prev.options, [option]: value },
    }));
  };

  const handleCorrectAnswerChange = (value: string) => {
    setQuestion((prev) => ({ ...prev, correctAnswer: value }));
  };

  const handleMarksChange = (value: string) => {
    const marks = Number(value);
    setQuestion((prev) => ({ ...prev, marks: marks > 0 ? marks : 1 }));
  };

  const validateQuestion = () => {
    if (!question.question.trim()) {
      setError("Please enter the question text.");
      return false;
    }

    if (!question.marks || Number(question.marks) < 1) {
      setError("Marks must be at least 1.");
      return false;
    }

    if (question.type === "mcq") {
      if (!question.options.A.trim() || !question.options.B.trim()) {
        setError("Please enter at least Option A and Option B.");
        return false;
      }
    }

    if (question.type === "short-answer" && !question.correctAnswer.trim()) {
      setError("Please provide a reference grading answer.");
      return false;
    }

    return true;
  };

  const handleSaveQuestion = async () => {
    setError("");
    setSuccess("");

    if (!examId || !user) return;
    if (!validateQuestion()) return;

    try {
      setSaving(true);
      const examRef = doc(db, "exams", examId);

      const questionData: Record<string, unknown> = {
        question: question.question.trim(),
        type: question.type,
        marks: Number(question.marks),
        createdBy: user.uid,
        source: "manual",
        createdAt: serverTimestamp(),
      };

      if (question.type === "mcq") {
        questionData.options = {
          A: question.options.A.trim(),
          B: question.options.B.trim(),
          C: question.options.C.trim(),
          D: question.options.D.trim(),
        };
        questionData.correctAnswer = question.correctAnswer;
      } else if (question.type === "true-false") {
        questionData.options = {
          A: "True",
          B: "False",
          C: "",
          D: "",
        };
        questionData.correctAnswer = question.correctAnswer;
      } else {
        questionData.options = {};
        questionData.correctAnswer = question.correctAnswer.trim();
      }

      await addDoc(collection(db, "exams", examId, "questions"), questionData);

      await updateDoc(examRef, {
        questionCount: increment(1),
        totalQuestions: increment(1),
        totalMarks: increment(Number(question.marks)),
        updatedAt: serverTimestamp(),
      });

      setSuccess("Question added to exam successfully.");

      setTimeout(() => {
        navigate(`/teacher/exams/${examId}/questions`);
      }, 700);
    } catch (err) {
      console.error("Failed to add question:", err);
      setError("Failed to add the question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam) {
    return (
      <DashboardLayout
        role="teacher"
        title="Add Question"
        subtitle="Loading exam..."
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">
              Loading exam...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      title="Add Question"
      subtitle="Draft a customized question for this exam."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(`/teacher/exams/${examId}/questions`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Exam Questions</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          {/* Header */}
          <div className="border-b border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <HelpCircle size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 md:text-xl">
                  Add Question to {examTitle}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select question type and configure options and marks.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 md:p-8">
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

            {/* Type Selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Question Type
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "mcq", label: "Multiple Choice", desc: "A, B, C, D choices" },
                  { key: "true-false", label: "True / False", desc: "Binary choice" },
                  { key: "short-answer", label: "Short Answer", desc: "Subjective response" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTypeChange(item.key as QuestionType)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      question.type === item.key
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Type your examination question here..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Marks */}
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Awarded Marks
              </label>
              <input
                type="number"
                min="1"
                value={question.marks}
                onChange={(e) => handleMarksChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* MCQ Options */}
            {question.type === "mcq" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Choices & Correct Answer
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                        question.correctAnswer === key
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="mcqCorrect"
                        checked={question.correctAnswer === key}
                        onChange={() => handleCorrectAnswerChange(key)}
                        className="h-4 w-4 accent-emerald-600"
                      />

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                        {key}
                      </span>

                      <input
                        type="text"
                        value={question.options[key]}
                        onChange={(e) => handleOptionChange(key, e.target.value)}
                        placeholder={`Option ${key}`}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* True / False */}
            {question.type === "true-false" && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Select Correct Answer
                </label>

                <div className="flex gap-3">
                  {["A", "B"].map((key) => {
                    const label = key === "A" ? "True" : "False";
                    const isSelected = question.correctAnswer === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCorrectAnswerChange(key)}
                        className={`flex-1 rounded-2xl border py-3 text-xs font-bold transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Short Answer */}
            {question.type === "short-answer" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Reference Answer / Rubric
                </label>
                <textarea
                  value={question.correctAnswer}
                  onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                  placeholder="Enter reference keywords or grading guidelines..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            )}

            {/* Submit Toolbar */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => navigate(`/teacher/exams/${examId}/questions`)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveQuestion}
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
                    <span>Save Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AddQuestion;