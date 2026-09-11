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
  Clock,
  FileText,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

import { DateTimePicker } from "../../components/common/DateTimePicker";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getExamById,
  getExamAttemptCount,
  updateExam,
} from "../../services/examService";
import { getTeacherClasses, type ClassBatch } from "../../services/classService";
import {
  calculateExamEndTime,
  getExamScheduleDetails,
} from "../../services/serverTimeService";

function EditExam() {
  const navigate = useNavigate();

  const { examId } = useParams<{
    examId: string;
  }>();

  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(10);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [classId, setClassId] = useState("");
  const [originalClassId, setOriginalClassId] = useState("");
  const [hasAttempts, setHasAttempts] = useState(false);

  const [loadingExam, setLoadingExam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadExam = async () => {
      if (!examId) {
        setError("Invalid exam ID.");
        setLoadingExam(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to edit an exam.");
        setLoadingExam(false);
        return;
      }

      try {
        setLoadingExam(true);
        setError("");

        const exam = await getExamById(examId);

        if (!exam) {
          setError("Exam not found.");
          return;
        }

        if (exam.teacherId !== user.uid) {
          setError("You do not have permission to edit this exam.");
          return;
        }

        const dur = Number(exam.duration) || 10;
        setTitle(exam.title || "");
        setSubject(exam.subject || "");
        setDescription(exam.description || "");
        setDuration(dur);
        setStartTime(exam.startTime || "");

        // If endTime is missing on legacy records, calculate automatically
        if (exam.endTime) {
          setEndTime(exam.endTime);
        } else if (exam.startTime) {
          setEndTime(calculateExamEndTime(exam.startTime, dur));
        }

        setClassId(exam.classIds?.[0] || "");
        setOriginalClassId(exam.classIds?.[0] || "");
        setHasAttempts((await getExamAttemptCount(examId)) > 0);
        setClasses(await getTeacherClasses(user.uid));
      } catch (err) {
        console.error("Failed to load exam:", err);
        setError("Unable to load the exam. Please try again.");
      } finally {
        setLoadingExam(false);
      }
    };

    loadExam();
  }, [examId, user]);

  // Handle Start Time Change & Auto-Calculate End Time
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    if (newStartTime && duration > 0) {
      const computedEnd = calculateExamEndTime(newStartTime, duration);
      setEndTime(computedEnd);
    }
  };

  // Handle Duration Change & Auto-Update End Time
  const handleDurationChange = (newDuration: number) => {
    const safeDuration = Math.max(1, newDuration);
    setDuration(safeDuration);
    if (startTime) {
      const computedEnd = calculateExamEndTime(startTime, safeDuration);
      setEndTime(computedEnd);
    }
  };

  const scheduleInfo = getExamScheduleDetails({
    startTime,
    endTime,
    duration,
    status: "published",
  });

  const isScheduleValid =
    Boolean(startTime) &&
    Boolean(endTime) &&
    duration >= 1 &&
    new Date(endTime).getTime() > new Date(startTime).getTime();

  const validateForm = () => {
    if (!title.trim()) {
      setError("Please enter an exam title.");
      return false;
    }

    if (!subject.trim()) {
      setError("Please enter the subject.");
      return false;
    }

    if (!startTime) {
      setError("Please select the exam start date and time.");
      return false;
    }

    if (!duration || Number(duration) < 1) {
      setError("Duration must be at least 1 minute.");
      return false;
    }

    if (!endTime || new Date(endTime) <= new Date(startTime)) {
      setError("Exam end time must be after the start time.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!examId) {
      setError("Invalid exam ID.");
      return;
    }

    setMessage("");
    setError("");

    if (!validateForm()) return;

    if (hasAttempts && classId !== originalClassId) {
      setError("Class assignment cannot be changed after students have attempted this exam.");
      return;
    }

    if (!classes.some((item) => item.id === classId) && classId) {
      setError("You can only assign this exam to one of your own classes.");
      return;
    }

    if (
      hasAttempts &&
      !window.confirm(
        "Students have already attempted this exam. Changes to the exam details will not change their stored results. Continue?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await updateExam(examId, {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        duration: Number(duration),
        startTime,
        endTime,
        classIds: classId ? [classId] : [],
      });

      setMessage("Exam updated successfully.");

      setTimeout(() => {
        navigate("/teacher/exams");
      }, 700);
    } catch (err) {
      console.error("Failed to update exam:", err);
      setError("Failed to update the exam. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam) {
    return (
      <DashboardLayout
        role="teacher"
        title="Edit Exam"
        subtitle="Update your exam details."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">
              Loading examination details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      title="Edit Exam"
      subtitle="Modify examination timing, class assignment, and settings."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/teacher/exams")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to My Exams</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
                  Edit Exam Settings
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Update title, duration, schedule window, and class assignments.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {hasAttempts && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                This exam has student attempts. Class assignment is locked to ensure existing student result integrity.
              </div>
            )}

            {message && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                {message}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter exam title"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Subject */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter subject"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Schedule & Duration Group */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Schedule & Duration
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      Authoritative Window
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Modify the availability window and duration limit for this examination.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Start Date & Time */}
                  <DateTimePicker
                    label="Exam Start Date & Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    required
                    placeholder="Choose start date & time"
                  />

                  {/* Duration Input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Exam Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="pointer-events-none absolute left-3.5 flex items-center text-blue-600 dark:text-blue-400">
                        <Clock size={16} />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={duration || ""}
                        onChange={(event) =>
                          handleDurationChange(Number(event.target.value))
                        }
                        placeholder="10"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-20 text-xs font-bold text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                      <span className="pointer-events-none absolute right-3.5 text-xs font-bold text-slate-400">
                        Minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculated Live Schedule Summary Box */}
                {startTime && isScheduleValid && (
                  <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Updated Examination Window</span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Starts</span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {scheduleInfo.formattedStartTime}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                        <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          {duration} Minutes
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ends Automatically</span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {scheduleInfo.formattedEndTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Class Assignment */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assign to Class Batch
                </label>
                <select
                  value={classId}
                  disabled={hasAttempts}
                  onChange={(event) => setClassId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  <option value="">No class restriction (Public to all registered students)</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description / Guidelines
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter guidelines or syllabus..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate("/teacher/exams")}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
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

export default EditExam;
