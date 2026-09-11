import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  FileQuestion,
  Loader2,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
  Timer,
} from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { deleteExamSafely, duplicateExam, getExamAttemptCount } from "../../services/examService";
import { notifyStudentsOfPublishedExam } from "../../services/notificationService";
import {
  getExamScheduleDetails,
} from "../../services/serverTimeService";

interface Exam {
  id: string;
  title: string;
  subject: string;
  description?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  status?: "draft" | "published";
  questionCount?: number;
  totalQuestions?: number;
  totalMarks?: number;
  classIds?: string[];
}

function MyExams() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setClockTicker] = useState(0);

  // Live 1-second ticker to keep schedule statuses up to date
  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTicker((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [deletingId, setDeletingId] = useState("");
  const [publishingId, setPublishingId] = useState("");
  const [duplicatingId, setDuplicatingId] = useState("");

  const loadExams = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const examsQuery = query(
        collection(db, "exams"),
        where("teacherId", "==", user.uid)
      );

      const snapshot = await getDocs(examsQuery);

      const teacherExams = snapshot.docs.map(
        (examDoc) =>
          ({
            id: examDoc.id,
            ...examDoc.data(),
          }) as Exam
      );

      teacherExams.sort((a, b) => {
        const firstDate = a.startTime ? new Date(a.startTime).getTime() : 0;
        const secondDate = b.startTime ? new Date(b.startTime).getTime() : 0;
        return secondDate - firstDate;
      });

      setExams(teacherExams);
    } catch (err) {
      console.error("Failed to load teacher exams:", err);
      setError("Unable to load your exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [user]);

  const handlePublishExam = async (exam: Exam) => {
    const questionCount = exam.questionCount ?? exam.totalQuestions ?? 0;

    if (questionCount === 0) {
      alert("Please add at least one question before publishing this exam.");
      navigate(`/teacher/exams/${exam.id}/questions`);
      return;
    }

    const confirmed = window.confirm(
      `Publish "${exam.title}"? Students will be able to see and attempt the exam.`
    );

    if (!confirmed) return;

    try {
      setPublishingId(exam.id);

      const attempts = await getExamAttemptCount(exam.id);
      if (attempts > 0) {
        alert(
          "This exam already has attempts. Its publishing state cannot be changed to protect existing results."
        );
        return;
      }

      await updateDoc(doc(db, "exams", exam.id), { status: "published" });
      void notifyStudentsOfPublishedExam({
        examId: exam.id,
        title: exam.title,
        classIds: exam.classIds,
        teacherName: userProfile?.name || user?.displayName || "Your teacher",
      }).catch((notificationError) =>
        console.error("Exam notification failed:", notificationError)
      );

      setExams((currentExams) =>
        currentExams.map((currentExam) =>
          currentExam.id === exam.id
            ? { ...currentExam, status: "published" }
            : currentExam
        )
      );
    } catch (err) {
      console.error("Failed to publish exam:", err);
      alert("Failed to publish the exam. Please try again.");
    } finally {
      setPublishingId("");
    }
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${examTitle}"? This will remove the exam and its questions.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(examId);
      await deleteExamSafely(examId, user?.uid);
      setExams((currentExams) =>
        currentExams.filter((exam) => exam.id !== examId)
      );
    } catch (err) {
      console.error("Failed to delete exam:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete the exam. Please try again.";
      alert(errorMessage);
    } finally {
      setDeletingId("");
    }
  };

  const handleUnpublishExam = async (exam: Exam) => {
    if (
      !user ||
      !window.confirm(
        `Unpublish "${exam.title}"? Students will no longer be able to start it.`
      )
    ) {
      return;
    }

    try {
      setPublishingId(exam.id);
      if (await getExamAttemptCount(exam.id)) {
        alert(
          "This exam has student attempts and cannot be unpublished, so existing access and results remain consistent."
        );
        return;
      }
      await updateDoc(doc(db, "exams", exam.id), { status: "draft" });
      setExams((current) =>
        current.map((item) =>
          item.id === exam.id ? { ...item, status: "draft" } : item
        )
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Unable to unpublish this exam."
      );
    } finally {
      setPublishingId("");
    }
  };

  const handleDuplicateExam = async (exam: Exam) => {
    if (!user) return;
    try {
      setDuplicatingId(exam.id);
      const duplicateId = await duplicateExam(exam.id, user.uid);
      navigate(`/teacher/exams/${duplicateId}/edit`);
    } catch (err) {
      console.error("Failed to duplicate exam:", err);
      alert(
        err instanceof Error ? err.message : "Failed to duplicate the exam."
      );
    } finally {
      setDuplicatingId("");
    }
  };

  const formatDate = (dateTime?: string) => {
    if (!dateTime) return "Not scheduled";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateTime?: string) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const publishedCount = exams.filter(
    (exam) => exam.status === "published"
  ).length;

  const draftCount = exams.filter(
    (exam) => exam.status !== "published"
  ).length;

  return (
    <DashboardLayout
      role="teacher"
      title="My Exams"
      subtitle="Manage, author, duplicate, and publish all your examinations."
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
              Examination Registry
            </h1>
            <p className="text-xs text-slate-500">
              Create, edit, and organize exam papers
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/teacher/create-exam")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-95"
          >
            <Plus size={16} />
            <span>Create New Exam</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Exams
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : exams.length}
            </p>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Published (Active)
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
              {loading ? "..." : publishedCount}
            </p>
          </div>

          <div className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Drafts (Work in progress)
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
              {loading ? "..." : draftCount}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-500">
                Loading your exam registry...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && exams.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileQuestion size={28} />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              No exams created yet
            </h2>

            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              Author your first exam paper, add questions from your Question Bank, and publish for your students.
            </p>

            <button
              type="button"
              onClick={() => navigate("/teacher/create-exam")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Create Your First Exam</span>
            </button>
          </div>
        )}

        {/* Exam Cards Grid */}
        {!loading && !error && exams.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {exams.map((exam) => {
              const questionCount =
                exam.questionCount ?? exam.totalQuestions ?? 0;
              const isPublished = exam.status === "published";
              const schedule = isPublished
                ? getExamScheduleDetails(
                    exam.startTime,
                    exam.duration || 30,
                    exam.endTime
                  )
                : null;

              return (
                <div
                  key={exam.id}
                  className="app-card flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300"
                >
                  <div>
                    {/* Header Specs */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!isPublished ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                              Draft
                            </span>
                          ) : schedule?.status === "live" ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-300 animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span>Live Now</span>
                            </span>
                          ) : schedule?.status === "scheduled" ? (
                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                              <Timer size={12} className="text-blue-500" />
                              <span>Scheduled</span>
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                              Completed
                            </span>
                          )}

                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {exam.subject || "General"}
                          </span>
                        </div>

                        <h2 className="mt-2 text-base font-bold text-slate-900 line-clamp-1">
                          {exam.title || "Untitled Exam"}
                        </h2>
                      </div>

                      {isPublished && (
                        <CheckCircle2
                          size={20}
                          className="shrink-0 text-emerald-500"
                        />
                      )}
                    </div>

                    {exam.description && (
                      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {exam.description}
                      </p>
                    )}

                    {/* Stats & Schedule */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50/80 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileQuestion size={15} className="text-slate-400" />
                        <span>
                          <b>{questionCount}</b> questions
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3 size={15} className="text-slate-400" />
                        <span>
                          <b>{exam.duration || 0}</b> mins duration
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-slate-400 shrink-0" />
                        <span>
                          <b>Starts:</b> {formatDate(exam.startTime)}{" "}
                          {exam.startTime && `• ${formatTime(exam.startTime)}`}
                        </span>
                      </div>
                      {exam.endTime && (
                        <div className="flex items-center gap-2">
                          <Clock3 size={14} className="text-slate-400 shrink-0" />
                          <span>
                            <b>Ends:</b> {formatDate(exam.endTime)} •{" "}
                            {formatTime(exam.endTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/teacher/exams/${exam.id}/questions`)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                    >
                      <FileQuestion size={15} />
                      <span>
                        {questionCount > 0
                          ? "Questions (" + questionCount + ")"
                          : "Add Questions"}
                      </span>
                    </button>

                    {!isPublished ? (
                      <button
                        type="button"
                        disabled={publishingId === exam.id}
                        onClick={() => handlePublishExam(exam)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {publishingId === exam.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>Publish</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={publishingId === exam.id}
                        onClick={() => handleUnpublishExam(exam)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-60"
                      >
                        {publishingId === exam.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <span>Unpublish</span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/teacher/exams/${exam.id}/edit`)
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      title="Edit Exam"
                    >
                      <Edit3 size={15} />
                    </button>

                    {isPublished && (
                      <button
                        type="button"
                        onClick={() => navigate("/teacher/monitoring")}
                        className="inline-flex items-center justify-center rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/40 p-2 text-blue-600 dark:text-blue-400 transition hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                        title="Live Proctoring & Integrity Monitoring"
                      >
                        <ShieldAlert size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={duplicatingId === exam.id}
                      onClick={() => handleDuplicateExam(exam)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                      title="Duplicate Exam"
                    >
                      {duplicatingId === exam.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === exam.id}
                      onClick={() =>
                        handleDeleteExam(exam.id, exam.title)
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      title="Delete Exam"
                    >
                      {deletingId === exam.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
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

export default MyExams;
