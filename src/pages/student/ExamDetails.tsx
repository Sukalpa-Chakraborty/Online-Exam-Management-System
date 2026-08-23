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
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { getStudentClasses } from "../../services/classService";

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

          {/* 4 Stat Specs */}
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
              <p className="mt-3 text-xs font-medium text-slate-500">Scheduled Time</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                {formatDateTime(exam.startTime)}
              </p>
            </div>
          </div>

          {/* Instructions List */}
          <div className="border-t border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                General Guidelines & Instructions
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {[
                "Ensure a stable internet connection before launching your attempt.",
                `The exam is timed for ${exam.duration} minutes and will submit automatically upon timer completion.`,
                "You can navigate freely between questions using the Question Navigator.",
                "Review your responses thoroughly before selecting Submit Exam; once submitted, results cannot be retaken.",
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
              Clicking below will start the exam and activate your countdown timer.
            </p>

            <button
              type="button"
              onClick={() => navigate(`/student/exams/${exam.id}/attempt`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-95"
            >
              <Play size={15} fill="currentColor" />
              <span>Start Exam Now</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ExamDetails;
