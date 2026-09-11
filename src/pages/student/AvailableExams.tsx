import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  FileQuestion,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
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
  startTime: string;
  endTime?: string;
  status: string;
  questionCount?: number;
  totalQuestions?: number;
  totalMarks?: number;
  classIds?: string[];
}

function AvailableExams() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setClockTicker] = useState(0);

  // Live 1-second ticker to update live/upcoming statuses automatically
  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTicker((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAvailableExams = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Get completed exam IDs
        const resultsRef = collection(
          db,
          "users",
          user.uid,
          "examResults"
        );

        const resultsSnapshot = await getDocs(resultsRef);

        const completedExamIds = new Set(
          resultsSnapshot.docs
            .map((doc) => doc.data().examId)
            .filter(Boolean)
        );

        // Get all published exams
        const examsQuery = query(
          collection(db, "exams"),
          where("status", "==", "published")
        );

        const examsSnapshot = await getDocs(examsQuery);

        const joinedClassIds = new Set(
          (await getStudentClasses(user.uid)).map((item) => item.id)
        );
        const loadedPublishedExams = examsSnapshot.docs.map(
          (examDoc) => ({
            id: examDoc.id,
            ...examDoc.data(),
          })
        ) as Exam[];

        const availableExams = loadedPublishedExams
          .filter((exam) => !completedExamIds.has(exam.id))
          .filter(
            (exam) =>
              !exam.classIds?.length ||
              exam.classIds.some((classId) => joinedClassIds.has(classId))
          );

        // Sort by start time
        availableExams.sort(
          (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime()
        );

        setExams(availableExams);
      } catch (err) {
        console.error("Failed to load exams:", err);
        setError("Failed to load available exams. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableExams();
  }, [user]);

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "Not scheduled";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return dateTime;
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getQuestionCount = (exam: Exam) => {
    return exam.questionCount || exam.totalQuestions || 0;
  };

  return (
    <DashboardLayout
      role="student"
      title="Available Exams"
      subtitle="View and attempt your published examinations."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {!loading && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
              <Sparkles size={14} className="text-blue-600" />
              <span>
                {exams.length} Exam{exams.length === 1 ? "" : "s"} Available
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-500">
                Loading available examinations...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && exams.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen size={28} />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              No Exams Available
            </h2>

            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              There are currently no active or published exams assigned to your joined classes.
            </p>

            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Exam Cards Grid */}
        {!loading && !error && exams.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {exams.map((exam) => {
              const schedule = getExamScheduleDetails(
                exam.startTime,
                exam.duration,
                exam.endTime
              );
              const isLive = schedule.status === "live";
              const isScheduled = schedule.status === "scheduled";
              const isClosed = schedule.status === "completed";

              return (
                <div
                  key={exam.id}
                  className="app-card flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300"
                >
                  <div>
                    {/* Top Subject & Status Badge */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        {exam.subject || "General"}
                      </span>

                      {isLive && (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-300 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Live Now</span>
                        </span>
                      )}

                      {isScheduled && (
                        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                          <Timer size={12} className="text-blue-500" />
                          <span>Starts in {formatCountdown(schedule.secondsUntilStart)}</span>
                        </span>
                      )}

                      {isClosed && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                          Window Closed
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 line-clamp-1">
                      {exam.title || "Untitled Exam"}
                    </h2>

                    {exam.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {exam.description}
                      </p>
                    )}

                    {/* Metadata Specs */}
                    <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CalendarDays size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                          Starts: <b>{formatDateTime(exam.startTime)}</b>
                        </span>
                      </div>

                      {exam.endTime && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                          <Clock3 size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            Ends: <b>{formatDateTime(exam.endTime)}</b>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Clock3 size={15} className="text-slate-400 shrink-0" />
                        <span>
                          Duration: <b>{exam.duration || 0} minutes</b>
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <FileQuestion size={15} className="text-slate-400 shrink-0" />
                        <span>
                          <b>{getQuestionCount(exam)}</b> questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Start Exam CTA */}
                  <div className="mt-6 pt-2">
                    {isClosed ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                      >
                        <span>Exam Window Closed</span>
                      </button>
                    ) : isLive ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/student/exams/${exam.id}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-98 cursor-pointer"
                      >
                        <span>Start / Attempt Exam</span>
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/student/exams/${exam.id}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 active:scale-98 cursor-pointer"
                      >
                        <span>View Guidelines & Schedule</span>
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AvailableExams;
