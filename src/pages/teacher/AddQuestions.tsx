import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CirclePlus,
  FileQuestion,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { getExamAttemptCount } from "../../services/examService";
import { notifyStudentsOfPublishedExam } from "../../services/notificationService";

type QuestionType = "mcq" | "true-false" | "short-answer";
type OptionKey = "A" | "B" | "C" | "D";

interface QuestionBankQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  teacherId: string;
}

interface ExamQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctAnswer?: string;
  marks: number;
  sourceQuestionId?: string;
}

function AddQuestions() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [examTitle, setExamTitle] = useState("Loading exam...");
  const [examStatus, setExamStatus] = useState<"draft" | "published">("draft");
  const [examClassIds, setExamClassIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [loadingExam, setLoadingExam] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [deletingQuestionId, setDeletingQuestionId] = useState("");

  // Question Bank Modal State
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);
  const [addingFromBank, setAddingFromBank] = useState(false);
  const [questionBankQuestions, setQuestionBankQuestions] = useState<
    QuestionBankQuestion[]
  >([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [existingSourceIds, setExistingSourceIds] = useState<string[]>([]);
  const [bankSearch, setBankSearch] = useState("");

  const loadExamAndQuestions = async () => {
    if (!examId) {
      setError("Exam ID not found.");
      setLoadingExam(false);
      return;
    }

    try {
      setLoadingExam(true);
      setError("");

      const examRef = doc(db, "exams", examId);
      const examSnapshot = await getDoc(examRef);

      if (!examSnapshot.exists()) {
        setError("This exam was not found.");
        return;
      }

      const examData = examSnapshot.data();
      setExamTitle(examData.title || "Untitled Exam");
      setExamStatus(examData.status || "draft");
      setExamClassIds(examData.classIds || []);
      setQuestionCount(Number(examData.questionCount || 0));
      setTotalMarks(Number(examData.totalMarks || 0));

      const questionsSnapshot = await getDocs(
        collection(db, "exams", examId, "questions")
      );

      const loadedQuestions: ExamQuestion[] = questionsSnapshot.docs.map(
        (docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })
      ) as ExamQuestion[];

      setExamQuestions(loadedQuestions);

      const sourceIds = loadedQuestions
        .map((q) => q.sourceQuestionId)
        .filter((id): id is string => Boolean(id));

      setExistingSourceIds(sourceIds);
    } catch (err) {
      console.error("Failed to load exam details:", err);
      setError("Failed to load exam details.");
    } finally {
      setLoadingExam(false);
    }
  };

  const handlePublishExam = async () => {
    if (!examId) return;

    if (questionCount === 0 && examQuestions.length === 0) {
      alert("Please add at least one question before publishing this exam.");
      return;
    }

    const confirmed = window.confirm(
      `Publish "${examTitle}"? Enrolled students will immediately be able to see and attempt this exam.`
    );
    if (!confirmed) return;

    try {
      setPublishing(true);
      setError("");
      setMessage("");

      await updateDoc(doc(db, "exams", examId), {
        status: "published",
        updatedAt: serverTimestamp(),
      });

      setExamStatus("published");
      setMessage("Exam published successfully! Students can now view and attempt this exam.");

      void notifyStudentsOfPublishedExam({
        examId,
        title: examTitle,
        classIds: examClassIds,
        teacherName: userProfile?.name || user?.displayName || "Your teacher",
      }).catch((err) => console.error("Notification failed:", err));
    } catch (err) {
      console.error("Failed to publish exam:", err);
      setError("Failed to publish the exam. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublishExam = async () => {
    if (!examId) return;

    const confirmed = window.confirm(
      `Unpublish "${examTitle}"? Students will no longer be able to start new attempts.`
    );
    if (!confirmed) return;

    try {
      setPublishing(true);
      setError("");
      setMessage("");

      const attempts = await getExamAttemptCount(examId);
      if (attempts > 0) {
        alert(
          "This exam has student attempts and cannot be unpublished, so existing results and evaluations remain consistent."
        );
        return;
      }

      await updateDoc(doc(db, "exams", examId), {
        status: "draft",
        updatedAt: serverTimestamp(),
      });

      setExamStatus("draft");
      setMessage("Exam reverted to draft successfully.");
    } catch (err) {
      console.error("Failed to unpublish exam:", err);
      setError("Failed to unpublish the exam.");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    loadExamAndQuestions();
  }, [examId]);

  const loadQuestionBank = async () => {
    if (!user) {
      setError("You must be logged in to access the Question Bank.");
      return;
    }

    try {
      setLoadingQuestionBank(true);
      setError("");
      setMessage("");

      const questionBankQuery = query(
        collection(db, "questionBank"),
        where("teacherId", "==", user.uid)
      );

      const snapshot = await getDocs(questionBankQuery);
      const loadedQuestions = snapshot.docs.map(
        (questionDoc) =>
          ({
            id: questionDoc.id,
            ...questionDoc.data(),
          }) as QuestionBankQuestion
      );

      setQuestionBankQuestions(loadedQuestions);
      setSelectedQuestionIds([]);
      setBankSearch("");
      setShowQuestionBank(true);
    } catch (err) {
      console.error("Failed to load Question Bank:", err);
      setError("Failed to load Question Bank questions.");
    } finally {
      setLoadingQuestionBank(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const filteredBankQuestions = useMemo(() => {
    const searchText = bankSearch.trim().toLowerCase();
    if (!searchText) return questionBankQuestions;

    return questionBankQuestions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchText) ||
        q.type.toLowerCase().includes(searchText)
    );
  }, [questionBankQuestions, bankSearch]);

  const getTrueFalseAnswer = (answer?: string) => {
    const cleaned = String(answer || "").toLowerCase().trim();
    if (cleaned === "true" || cleaned === "t" || cleaned === "a") return "A";
    return "B";
  };

  const handleAddSelectedQuestions = async () => {
    if (!examId || !user || selectedQuestionIds.length === 0) return;

    try {
      setAddingFromBank(true);
      setError("");
      setMessage("");

      const questionsToAdd = questionBankQuestions.filter((q) =>
        selectedQuestionIds.includes(q.id)
      );

      const batch = writeBatch(db);
      const examRef = doc(db, "exams", examId);
      let addedMarks = 0;

      questionsToAdd.forEach((bankQuestion) => {
        const examQuestionRef = doc(
          collection(db, "exams", examId, "questions")
        );

        const baseQuestion = {
          question: bankQuestion.question.trim(),
          type: bankQuestion.type,
          marks: Number(bankQuestion.marks) || 1,
          createdBy: user.uid,
          source: "questionBank",
          sourceQuestionId: bankQuestion.id,
          createdAt: serverTimestamp(),
        };

        if (bankQuestion.type === "mcq") {
          const validOptions = (bankQuestion.options || [])
            .map((opt) => opt.trim())
            .filter((opt) => opt !== "");

          const correctIndex = validOptions.findIndex(
            (opt) => opt === bankQuestion.correctAnswer
          );

          const correctAnswer = (
            ["A", "B", "C", "D"][correctIndex >= 0 ? correctIndex : 0]
          ) as OptionKey;

          batch.set(examQuestionRef, {
            ...baseQuestion,
            options: {
              A: validOptions[0] || "",
              B: validOptions[1] || "",
              C: validOptions[2] || "",
              D: validOptions[3] || "",
            },
            correctAnswer,
          });
        } else if (bankQuestion.type === "true-false") {
          batch.set(examQuestionRef, {
            ...baseQuestion,
            options: {
              A: "True",
              B: "False",
              C: "",
              D: "",
            },
            correctAnswer: getTrueFalseAnswer(bankQuestion.correctAnswer),
          });
        } else {
          batch.set(examQuestionRef, {
            ...baseQuestion,
            options: {},
            correctAnswer: (bankQuestion.correctAnswer || "").trim(),
          });
        }

        addedMarks += Number(bankQuestion.marks) || 1;
      });

      batch.update(examRef, {
        questionCount: increment(questionsToAdd.length),
        totalQuestions: increment(questionsToAdd.length),
        totalMarks: increment(addedMarks),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      setShowQuestionBank(false);
      setSelectedQuestionIds([]);
      setMessage(
        `${questionsToAdd.length} question${
          questionsToAdd.length > 1 ? "s" : ""
        } imported successfully.`
      );

      await loadExamAndQuestions();
    } catch (err) {
      console.error("Failed to add selected questions:", err);
      setError("Failed to add selected questions.");
    } finally {
      setAddingFromBank(false);
    }
  };

  const handleDeleteQuestion = async (
    questionId: string,
    questionMarks: number
  ) => {
    if (!examId || !window.confirm("Remove this question from the exam?")) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      const questionRef = doc(db, "exams", examId, "questions", questionId);
      await deleteDoc(questionRef);

      const examRef = doc(db, "exams", examId);
      await updateDoc(examRef, {
        questionCount: increment(-1),
        totalQuestions: increment(-1),
        totalMarks: increment(-Number(questionMarks || 1)),
        updatedAt: serverTimestamp(),
      });

      setMessage("Question removed from exam.");
      await loadExamAndQuestions();
    } catch (err) {
      console.error("Failed to delete question:", err);
      setError("Failed to delete the question.");
    } finally {
      setDeletingQuestionId("");
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    if (type === "mcq") return "Multiple Choice";
    if (type === "true-false") return "True / False";
    return "Short Answer";
  };

  if (loadingExam) {
    return (
      <DashboardLayout
        role="teacher"
        title="Add Questions"
        subtitle="Loading exam parameters..."
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">
              Loading examination questions...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      title="Exam Questions"
      subtitle="Author or import questions for this examination."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/teacher/exams")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Back to My Exams</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
              <FileQuestion size={16} />
              <span>{questionCount} Questions</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              <Sparkles size={16} />
              <span>{totalMarks} Total Marks</span>
            </div>
          </div>
        </div>

        {/* Title Banner with Publish Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 md:text-xl">
                {examTitle}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  examStatus === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                }`}
              >
                {examStatus === "published" ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Build your assessment paper by drafting questions manually or selecting reusable items from your Question Bank.
            </p>
          </div>

          {/* Quick Publish / Unpublish Action Button in Title Banner */}
          <div className="shrink-0 flex items-center gap-2">
            {examStatus !== "published" ? (
              <button
                type="button"
                disabled={publishing || (questionCount === 0 && examQuestions.length === 0)}
                onClick={handlePublishExam}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                title={
                  questionCount === 0 && examQuestions.length === 0
                    ? "Add at least one question before publishing"
                    : "Publish exam for enrolled students"
                }
              >
                {publishing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Publish Exam</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={publishing}
                onClick={handleUnpublishExam}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition disabled:opacity-60 cursor-pointer"
                title="Unpublish this exam to make edits"
              >
                {publishing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span>Unpublish Exam</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Dual Actions Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Add Manually */}
          <div className="app-card flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <HelpCircle size={24} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Author Question Manually
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Compose a customized Multiple Choice, True / False, or Short Answer question specifically for this exam.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/teacher/exams/${examId}/questions/add`)
              }
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-95"
            >
              <CirclePlus size={16} />
              <span>Create New Question</span>
            </button>
          </div>

          {/* Question Bank Import */}
          <div className="app-card flex flex-col justify-between rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6 shadow-xs transition">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <BookOpen size={24} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Import from Question Bank
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Select and import pre-authored questions from your reusable inventory in bulk.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadQuestionBank}
              disabled={loadingQuestionBank}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
            >
              {loadingQuestionBank ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading Library...</span>
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  <span>Browse Question Bank</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Questions List */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Exam Paper ({examQuestions.length} Questions)
              </h2>
              <p className="text-xs text-slate-500">
                Questions that students will answer during this test
              </p>
            </div>
          </div>

          {examQuestions.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileQuestion size={24} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                No questions added to this exam yet
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Add questions manually or import from your Question Bank to publish this exam.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {examQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition md:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                        {idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                            {getTypeLabel(q.type)}
                          </span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                            {q.marks} Mark{q.marks === 1 ? "" : "s"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.question}
                        </h3>

                        {q.type === "mcq" && q.options && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {(["A", "B", "C", "D"] as OptionKey[]).map(
                              (optKey) => {
                                const optVal = q.options?.[optKey];
                                if (!optVal) return null;
                                const isCorrect = q.correctAnswer === optKey;

                                return (
                                  <div
                                    key={optKey}
                                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs ${
                                      isCorrect
                                        ? "border border-emerald-200 bg-emerald-50/80 font-bold text-emerald-900"
                                        : "border border-slate-200 bg-white text-slate-600"
                                    }`}
                                  >
                                    <span className="font-bold">{optKey}.</span>
                                    <span>{optVal}</span>
                                    {isCorrect && (
                                      <CheckCircle2
                                        size={13}
                                        className="ml-auto text-emerald-600"
                                      />
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        {q.type === "true-false" && (
                          <p className="mt-2 text-xs font-semibold text-emerald-700">
                            Correct: {q.correctAnswer === "A" ? "True" : "False"}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deletingQuestionId === q.id}
                      onClick={() => handleDeleteQuestion(q.id, q.marks)}
                      className="inline-flex items-center gap-1 self-end rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:self-start disabled:opacity-60"
                    >
                      {deletingQuestionId === q.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Question Bank Modal */}
        {showQuestionBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
            <div className="modal-enter flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5 md:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Import from Question Bank
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select questions to import into this exam
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuestionBank(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Search */}
              <div className="border-b border-slate-100 p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Search question library..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Questions Selection List */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
                {filteredBankQuestions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No questions available matching your search.
                  </div>
                ) : (
                  filteredBankQuestions.map((bankQ) => {
                    const isSelected = selectedQuestionIds.includes(bankQ.id);
                    const alreadyAdded = existingSourceIds.includes(bankQ.id);

                    return (
                      <label
                        key={bankQ.id}
                        className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                          alreadyAdded
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                            : isSelected
                            ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadyAdded}
                          onChange={() => toggleQuestionSelection(bankQ.id)}
                          className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                              {getTypeLabel(bankQ.type)}
                            </span>
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {bankQ.marks} Marks
                            </span>
                            {alreadyAdded && (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Already in exam
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs font-semibold text-slate-900 leading-relaxed">
                            {bankQ.question}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 p-4 md:px-6">
                <span className="text-xs font-semibold text-slate-600">
                  {selectedQuestionIds.length} question
                  {selectedQuestionIds.length === 1 ? "" : "s"} selected
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowQuestionBank(false)}
                    disabled={addingFromBank}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSelectedQuestions}
                    disabled={addingFromBank || selectedQuestionIds.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {addingFromBank ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>Import Selected</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AddQuestions;
