import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { getStudentClasses } from "../../services/classService";
import { notifyAdminsOfClassGrade, notifyTeacherOfSubmission } from "../../services/notificationService";

type QuestionType = "mcq" | "true_false" | "short_answer";
type OptionKey = "A" | "B" | "C" | "D";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  status: string;
  teacherId?: string;
}

interface QuestionOptions {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuestionOptions;
  correctAnswer?: string;
  marks: number;
}

interface ResultQuestion extends Question {
  selectedAnswer?: string;
  isCorrect: boolean | null;
  evaluationStatus: "auto_evaluated" | "pending" | "evaluated";
  awardedMarks: number;
  feedback?: string;
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
  evaluationStatus: "pending" | "partially_evaluated" | "evaluated";
  pendingEvaluationCount: number;
  questions: ResultQuestion[];
}

function AttemptExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const submittedRef = useRef(false);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        setError("Exam ID is missing from the URL.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to attempt this exam.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const existingResultRef = doc(
          db,
          "users",
          user.uid,
          "examResults",
          examId
        );

        const existingResultSnapshot = await getDoc(existingResultRef);

        if (existingResultSnapshot.exists()) {
          setError("You have already completed this exam.");
          return;
        }

        const examRef = doc(db, "exams", examId);
        const examSnapshot = await getDoc(examRef);

        if (!examSnapshot.exists()) {
          setError("Exam not found.");
          return;
        }

        const examData = examSnapshot.data();

        if (examData.status !== "published") {
          setError("This exam is not available.");
          return;
        }

        if (Array.isArray(examData.classIds) && examData.classIds.length > 0) {
          const joinedClassIds = new Set(
            (await getStudentClasses(user.uid)).map((item) => item.id)
          );
          if (
            !examData.classIds.some((classId: string) =>
              joinedClassIds.has(classId)
            )
          ) {
            setError(
              "You must join the assigned class before attempting this exam."
            );
            return;
          }
        }

        const duration = Number(examData.duration) || 30;

        setExam({
          id: examSnapshot.id,
          title: examData.title || "Untitled Exam",
          subject: examData.subject || "General",
          duration,
          status: examData.status,
          teacherId: examData.teacherId || "",
        });

        setTimeLeft(duration * 60);

        const questionsRef = collection(
          db,
          "exams",
          examId,
          "questions"
        );

        const questionsSnapshot = await getDocs(questionsRef);

        const loadedQuestions: Question[] = questionsSnapshot.docs.map(
          (questionDoc) => {
            const data = questionDoc.data();

            let questionType: QuestionType = "mcq";

            const rawType = String(
              data.type || data.questionType || "mcq"
            )
              .toLowerCase()
              .replace(/[\s\-/]+/g, "_");

            if (rawType === "true_false" || rawType === "truefalse") {
              questionType = "true_false";
            } else if (
              rawType === "short_answer" ||
              rawType === "shortanswer" ||
              rawType === "short"
            ) {
              questionType = "short_answer";
            }

            return {
              id: questionDoc.id,
              question: data.question || "",
              type: questionType,
              options: {
                A: data.options?.A || data.optionA || "",
                B: data.options?.B || data.optionB || "",
                C: data.options?.C || data.optionC || "",
                D: data.options?.D || data.optionD || "",
              },
              correctAnswer:
                data.correctAnswer || data.correctOption || "",
              marks: Number(data.marks) || 1,
            };
          }
        );

        if (loadedQuestions.length === 0) {
          setError("This exam has no questions.");
          return;
        }

        setQuestions(loadedQuestions);
      } catch (err: any) {
        console.error("FAILED TO LOAD EXAM", err);
        setError(
          `Unable to load exam: ${
            err?.message || "Unknown error occurred."
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, user]);

  const submitExam = async (
    autoSubmit = false,
    currentAnswers = answers
  ) => {
    if (
      submittedRef.current ||
      !exam ||
      !user ||
      questions.length === 0
    ) {
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;
      let obtainedMarks = 0;
      let pendingEvaluationCount = 0;

      const resultQuestions: ResultQuestion[] = questions.map(
        (question) => {
          const selectedAnswer =
            currentAnswers[question.id]?.trim() || "";

          // SHORT ANSWER
          if (question.type === "short_answer") {
            if (!selectedAnswer) unanswered++;
            pendingEvaluationCount++;

            return {
              ...question,
              selectedAnswer,
              isCorrect: null,
              evaluationStatus: "pending",
              awardedMarks: 0,
            };
          }

          // MCQ / TRUE FALSE
          const isCorrect =
            selectedAnswer.toLowerCase() ===
            String(question.correctAnswer || "")
              .trim()
              .toLowerCase();

          if (!selectedAnswer) {
            unanswered++;
          } else if (isCorrect) {
            correctAnswers++;
            obtainedMarks += question.marks;
          } else {
            wrongAnswers++;
          }

          return {
            ...question,
            selectedAnswer,
            isCorrect,
            evaluationStatus: "auto_evaluated",
            awardedMarks: isCorrect ? question.marks : 0,
          };
        }
      );

      const totalMarks = questions.reduce(
        (total, question) => total + question.marks,
        0
      );

      const percentage =
        totalMarks > 0
          ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
          : 0;

      const result: ExamResult = {
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject,
        totalQuestions: questions.length,
        correctAnswers,
        wrongAnswers,
        unanswered,
        obtainedMarks,
        totalMarks,
        percentage,
        submittedAutomatically: autoSubmit,
        evaluationStatus:
          pendingEvaluationCount > 0 ? "pending" : "evaluated",
        pendingEvaluationCount,
        questions: resultQuestions,
      };

      const resultRef = doc(
        db,
        "users",
        user.uid,
        "examResults",
        exam.id
      );

      await setDoc(resultRef, {
        ...result,
        studentId: user.uid,
        studentName:
          userProfile?.name ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "Student",
        studentEmail: user.email || userProfile?.email || "",
        teacherId: exam.teacherId || "",
        submittedAt: serverTimestamp(),
      });

      const studentName =
        userProfile?.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";

      void notifyTeacherOfSubmission({
        teacherId: exam.teacherId,
        examTitle: exam.title,
        studentName,
      }).catch((notificationError) =>
        console.error("Teacher notification failed:", notificationError)
      );

      if (pendingEvaluationCount === 0) {
        void notifyAdminsOfClassGrade({
          examId: exam.id,
          examTitle: exam.title,
        }).catch((notificationError) =>
          console.error("Admin grade notification failed:", notificationError)
        );
      }

      navigate(`/student/exams/${exam.id}/result`, {
        state: { result },
        replace: true,
      });
    } catch (err: any) {
      console.error("FAILED TO SUBMIT EXAM", err);
      submittedRef.current = false;
      setError(
        `Failed to submit exam: ${
          err?.message || "Unknown error occurred."
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      loading ||
      submitting ||
      questions.length === 0 ||
      submittedRef.current
    ) {
      return;
    }

    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previousTime) => Math.max(previousTime - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loading, submitting, timeLeft, questions, exam, user]);

  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }, [timeLeft]);

  const isLowTime = timeLeft > 0 && timeLeft <= 300; // Under 5 mins

  const selectAnswer = (questionId: string, answer: string) => {
    if (submitting || submittedRef.current) return;
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));
  };

  const handleManualSubmit = () => {
    if (
      !window.confirm(
        "Are you sure you want to submit your exam? You cannot change your answers after submission."
      )
    ) {
      return;
    }

    submitExam(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">
            Preparing your examination session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !exam || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Unable to Start Exam
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {error || "No questions found for this examination."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/student/exams")}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            Back to Available Exams
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const answeredQuestions = questions.filter((question) =>
    answers[question.id]?.trim()
  ).length;
  const progressPercentage = (answeredQuestions / questions.length) * 100;

  const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-8">
          <div>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {exam.subject}
            </span>
            <h1 className="mt-1 text-sm font-bold text-slate-900 sm:text-base line-clamp-1">
              {exam.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold transition-colors ${
                isLowTime
                  ? "animate-pulse bg-red-100 text-red-700 ring-1 ring-red-300"
                  : "bg-slate-100 text-slate-800 ring-1 ring-slate-200"
              }`}
            >
              <Clock3 size={16} className={isLowTime ? "text-red-600" : "text-slate-500"} />
              <span>{formattedTime}</span>
            </div>

            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={submitting}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60"
            >
              <Send size={13} />
              <span>{submitting ? "Submitting..." : "Submit"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Runner Area */}
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Question Viewport */}
          <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
            <div>
              {/* Question Index & Marks */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {currentQuestionData.type.replace("_", " ")}
                  </span>
                </div>

                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {currentQuestionData.marks} Mark{currentQuestionData.marks === 1 ? "" : "s"}
                </span>
              </div>

              {/* Question Prompt */}
              <h2 className="text-base font-semibold leading-relaxed text-slate-900 md:text-lg">
                {currentQuestionData.question}
              </h2>

              {/* Input Types */}
              {currentQuestionData.type === "short_answer" ? (
                <div className="mt-8">
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Your Response
                  </label>

                  <textarea
                    value={answers[currentQuestionData.id] || ""}
                    onChange={(event) =>
                      selectAnswer(currentQuestionData.id, event.target.value)
                    }
                    placeholder="Type your response here..."
                    rows={7}
                    disabled={submitting || submittedRef.current}
                    className="w-full resize-y rounded-2xl border border-slate-300 p-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Short answers will be manually reviewed and graded by your instructor.
                  </p>
                </div>
              ) : currentQuestionData.type === "true_false" ? (
                <div className="mt-8 space-y-3">
                  {["True", "False"].map((option) => {
                    const isSelected =
                      answers[currentQuestionData.id] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          selectAnswer(currentQuestionData.id, option)
                        }
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {option === "True" ? "T" : "F"}
                        </span>

                        <span className="text-sm font-semibold text-slate-800">
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 space-y-3">
                  {optionKeys.map((optionKey) => {
                    const optionText =
                      currentQuestionData.options?.[optionKey];
                    if (!optionText) return null;

                    const isSelected =
                      answers[currentQuestionData.id] === optionKey;

                    return (
                      <button
                        key={optionKey}
                        type="button"
                        onClick={() =>
                          selectAnswer(currentQuestionData.id, optionKey)
                        }
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {optionKey}
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestion((current) => Math.max(0, current - 1))
                }
                disabled={currentQuestion === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestion((current) =>
                      Math.min(questions.length - 1, current + 1)
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Send size={15} />
                  <span>{submitting ? "Submitting..." : "Submit Exam"}</span>
                </button>
              )}
            </div>
          </section>

          {/* Question Navigator Sidebar */}
          <aside className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Question Navigator
              </h3>
            </div>

            {/* Progress Meter */}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-slate-900">
                  {answeredQuestions} / {questions.length} answered
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="mt-5 grid grid-cols-5 gap-2">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestion;
                const isAnswered = Boolean(answers[question.id]?.trim());

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQuestion(index)}
                    className={`flex aspect-square items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30"
                        : isAnswered
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-600" />
                <span className="text-slate-600">Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
                <span className="text-slate-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100" />
                <span className="text-slate-600">Unanswered</span>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? "Submitting..." : "Finish & Submit"}</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AttemptExam;
