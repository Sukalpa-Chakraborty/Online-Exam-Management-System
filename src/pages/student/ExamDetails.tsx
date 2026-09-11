import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Play,
  Award,
  Sparkles,
  Timer,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { getStudentClasses } from "../../services/classService";
import {
  formatCountdown,
  getExamScheduleDetails,
} from "../../services/serverTimeService";

interface Exam {
  id: string;
  title: string;
  subject: string;
  description?: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  totalQuestions?: number;
  questionCount?: number;
  totalMarks?: number;
  status: string;
  classIds?: string[];
}

function ExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [, setClockTicker] = useState(0);

  // Live 1-second ticker to update countdowns
  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTicker((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) {
        setError("Exam ID is missing.");
        setLoading(false);
        return;
      }
      if (!user) {
        setError("You must be logged in to view this exam.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Check if already submitted
        const resultRef = doc(db, "users", user.uid, "examResults", examId);
        const resultSnapshot = await getDoc(resultRef);
        if (resultSnapshot.exists()) {
          setAlreadySubmitted(true);
        }

        const examRef = doc(db, "exams", examId);
        const examSnapshot = await getDoc(examRef);

        if (!examSnapshot.exists()) {
          setError("This exam does not exist.");
          return;
        }

        const examData = {
          id: examSnapshot.id,
          ...examSnapshot.data(),
        } as Exam;

        if (examData.status !== "published") {
          setError("This exam is not available.");
          return;
        }

        if (examData.classIds?.length) {
          const joined = new Set(
            (await getStudentClasses(user.uid)).map((item) => item.id)
          );
          if (!examData.classIds.some((classId) => joined.has(classId))) {
            setError("This exam is assigned to a class you have not joined.");
            return;
          }
        }

        setExam(examData);
      } catch (err) {
        console.error("Failed to load exam:", err);
        setError("Unable to load the exam. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, user]);

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "Not specified";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return dateTime;
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout
        role="student"
        title="Exam Details"
        subtitle="Loading exam parameters..."
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">
              Loading examination briefing...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !exam) {
    return (
      <DashboardLayout
        role="student"
        title="Exam Details"
        subtitle="Examination information."
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <button
            type="button"
            onClick={() => navigate("/student/exams")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Back to Available Exams</span>
          </button>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <h2 className="text-sm font-bold text-red-700">
              Unable to Open Examination
            </h2>
            <p className="mt-1 text-xs text-red-600">
              {error || "Exam details could not be found."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const questions = exam.questionCount ?? exam.totalQuestions ?? 0;
  const totalMarks = exam.totalMarks ?? questions;

  const schedule = getExamScheduleDetails(
    exam.startTime,
    exam.duration,
    exam.endTime
  );

  const isLive = schedule.status === "live";
  const isScheduled = schedule.status === "scheduled";
  const isClosed = schedule.status === "completed";

  return (
    <DashboardLayout
      role="student"
      title="Exam Details"
      subtitle="Review all guidelines and rules before starting."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/student/exams")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Available Exams</span>
        </button>

        {/* Status Callout Banner */}
        {alreadySubmitted ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-emerald-900">
                  Exam Already Completed
                </h2>
                <p className="mt-0.5 text-xs text-emerald-700">
                  You have already completed and submitted this examination.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/student/exams/${exam.id}/result`)}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
            >
              View My Results
            </button>
          </div>
        ) : isScheduled ? (
          <div className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-amber-900 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                <Lock size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    Exam Not Started
                  </span>
                  <span className="text-xs text-amber-700">Scheduled Access</span>
                </div>
                <h2 className="mt-1 text-base font-bold text-amber-950">
                  Starts in {formatCountdown(schedule.secondsUntilStart)}
                </h2>
                <p className="mt-0.5 text-xs text-amber-800">
                  This exam opens promptly at <b>{formatDateTime(exam.startTime)}</b>. The start button will activate automatically.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-white/80 px-4 py-3 text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Window Opens At
              </p>
              <p className="text-sm font-extrabold text-amber-950">
                {formatDateTime(exam.startTime)}
              </p>
            </div>
          </div>
        ) : isLive ? (
          <div className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 text-emerald-950 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                <Timer size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Live Exam In Progress
                  </span>
                </div>
                <h2 className="mt-1 text-base font-bold text-emerald-950">
                  Window Closes in {formatCountdown(schedule.secondsRemainingInWindow)}
                </h2>
                <p className="mt-0.5 text-xs text-emerald-800 leading-relaxed">
                  Strict Window: The exam closes at <b>{formatDateTime(exam.endTime)}</b>. Late starts will have reduced time.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Window Closes At
              </p>
              <p className="text-sm font-extrabold text-emerald-950">
                {formatDateTime(exam.endTime)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-red-900">
                  Exam Window Closed
                </h2>
                <p className="mt-0.5 text-xs text-red-700">
                  This examination ended on <b>{formatDateTime(exam.endTime)}</b>. Submissions and new attempts are no longer accepted.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white md:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  <span>Published Examination</span>
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  {exam.subject}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {exam.title}
                </h1>

                <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-blue-100">
                  {exam.description ||
                    "Please review the duration, questions, and instructions below before beginning your attempt."}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xs">
                <BookOpen size={24} className="text-blue-100" />
              </div>
            </div>
          </div>

          {/* 5 Stat Specs */}
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Clock3 size={18} />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">Duration</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {exam.duration} Minutes
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <FileText size={18} />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">Questions</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {questions} Questions
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Award size={18} />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">Total Marks</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {totalMarks} Marks
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <CalendarDays size={18} />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">Exam Window</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-900 truncate">
                {formatDateTime(exam.startTime)}
              </p>
              {exam.endTime && (
                <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                  to {formatDateTime(exam.endTime)}
                </p>
              )}
            </div>
          </div>

          {/* Instructions List */}
          <div className="border-t border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                General Guidelines & Strict Timing Rules
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {[
                `Strict Time Window: The exam opens at ${formatDateTime(exam.startTime)} and ends strictly at ${formatDateTime(exam.endTime)}.`,
                `Late Start Policy: If you start after the start time, you only receive the time remaining until the scheduled end time (${formatDateTime(exam.endTime)}).`,
                `Automatic Submission: The exam automatically finalizes and submits when your time expires or when the scheduled end time arrives.`,
                "Integrity Monitoring: Tab switches, window minimization, and device disconnections are audited throughout your session.",
                "Ensure a stable internet connection and webcam/microphone permissions for transparent proctoring.",
              ].map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-6 sm:flex-row sm:items-center md:px-8">
            <p className="text-xs text-slate-500">
              {alreadySubmitted
                ? "You have already completed this exam."
                : isClosed
                ? "The examination window has closed."
                : isScheduled
                ? "The exam button will enable as soon as the scheduled start time arrives."
                : "Clicking below will launch the device pre-check and start your timed attempt."}
            </p>

            {alreadySubmitted ? (
              <button
                type="button"
                onClick={() => navigate(`/student/exams/${exam.id}/result`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>View My Result</span>
              </button>
            ) : isClosed ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                <AlertTriangle size={15} />
                <span>Exam Closed</span>
              </button>
            ) : isScheduled ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                <Lock size={15} />
                <span>Starts in {formatCountdown(schedule.secondsUntilStart)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/student/exams/${exam.id}/attempt`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-95 cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                <span>Start Exam Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ExamDetails;
