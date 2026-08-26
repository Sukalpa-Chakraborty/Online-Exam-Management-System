import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";

interface Question {
  id: string;
  question: string;
  type: "mcq" | "true-false" | "short-answer";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  teacherId: string;
}

function QuestionBank() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadQuestions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const questionsQuery = query(
        collection(db, "questionBank"),
        where("teacherId", "==", user.uid)
      );

      const snapshot = await getDocs(questionsQuery);

      const loadedQuestions = snapshot.docs.map(
        (questionDoc) =>
          ({
            id: questionDoc.id,
            ...questionDoc.data(),
          }) as Question
      );

      setQuestions(loadedQuestions);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuestions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const handleDelete = async (questionId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this question from your Question Bank?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(questionId);
      await deleteDoc(doc(db, "questionBank", questionId));
      setQuestions((current) => current.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete the question. Please try again.");
    } finally {
      setDeletingId("");
    }
  };

  const filteredQuestions = questions.filter((question) =>
    question.question.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeLabel = (type: Question["type"]) => {
    if (type === "mcq") return "Multiple Choice";
    if (type === "true-false") return "True / False";
    return "Short Answer";
  };

  return (
    <DashboardLayout
      role="teacher"
      title="Question Bank"
      subtitle="Manage your central library of reusable questions across all exams."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              Question Library
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reusable questions that can be linked to any of your exams
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/teacher/questions/add")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Question</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Loading Question Bank...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && questions.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <BookOpen size={28} />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Your Question Bank is empty
            </h2>

            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create reusable questions that you can import into multiple exam papers at any time.
            </p>

            <button
              type="button"
              onClick={() => navigate("/teacher/questions/add")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Your First Question</span>
            </button>
          </div>
        )}

        {/* List of Questions */}
        {!loading && filteredQuestions.length > 0 && (
          <div className="space-y-3.5">
            {filteredQuestions.map((q, index) => (
              <div
                key={q.id}
                className="app-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-blue-700 dark:text-blue-300">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {getTypeLabel(q.type)}
                        </span>
                        <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {q.marks} Marks
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                        {q.question}
                      </h3>

                      {q.type === "mcq" && q.options && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`rounded-xl border px-3 py-1.5 text-xs ${
                                opt === q.correctAnswer
                                  ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300"
                                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "true-false" && q.correctAnswer && (
                        <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Correct Answer: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-start">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/teacher/questions/${q.id}/edit`)
                      }
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="Edit Question"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === q.id}
                      onClick={() => handleDelete(q.id)}
                      className="rounded-xl border border-red-100 dark:border-red-900/40 bg-white dark:bg-slate-900 p-2 text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 cursor-pointer"
                      title="Delete Question"
                    >
                      {deletingId === q.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default QuestionBank;