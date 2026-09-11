import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileText,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

import { DateTimePicker } from "../../components/common/DateTimePicker";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { createExam } from "../../services/examService";
import type { Exam } from "../../types/exam";
import { getTeacherClasses, type ClassBatch } from "../../services/classService";
import {
  calculateExamEndTime,
  getExamScheduleDetails,
} from "../../services/serverTimeService";

function CreateExam() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(10);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (user) void getTeacherClasses(user.uid).then(setClasses).catch(() => undefined);
  }, [user]);

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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    if (!user) {
      setError("You must be logged in to create an exam.");
      return false;
    }

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

    if (duration < 1) {
      setError("Exam duration must be at least 1 minute.");
      return false;
    }

    if (!endTime || new Date(endTime) <= new Date(startTime)) {
      setError("Exam end time must be after the start time.");
      return false;
    }

    if (classId && !classes.some((item) => item.id === classId)) {
      setError("You can only assign an exam to one of your own classes.");
      return false;
    }

    return true;
  };

  const createExamData = (status: "draft" | "published"): Exam => {
    return {
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      teacherId: user!.uid,
      teacherName:
        userProfile?.name ||
        user!.displayName ||
        user!.email?.split("@")[0] ||
        "Teacher",
      duration: Number(duration),
      totalMarks: 0,
      totalQuestions: 0,
      questionCount: 0,
      startTime,
      endTime,
      status,
      questions: [],
      classIds: classId ? [classId] : [],
    };
  };

  const handleSaveDraft = async () => {
    setMessage("");
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const examId = await createExam(createExamData("draft"));

      if (!examId) {
        throw new Error("Exam ID was not returned.");
      }

      setMessage("Exam saved as draft successfully.");

      setTimeout(() => {
        navigate("/teacher/dashboard");
      }, 700);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError("Failed to save the exam draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAddQuestions = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const examId = await createExam(createExamData("draft"));

      if (!examId) {
        throw new Error("Exam ID was not returned.");
      }

      navigate(`/teacher/exams/${examId}/questions`);
    } catch (err) {
      console.error("Failed to create exam:", err);
      setError("Failed to create the exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="teacher"
      title="Create Exam"
      subtitle="Set up your examination window, duration, and details."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/teacher/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
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
                  Create New Exam
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Configure exact start time, duration, and cohort access before adding questions.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateAndAddQuestions} className="p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Mid-Term DBMS Examination"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Subject */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject / Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                    Students can access the exam only between the exact Start and End times.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Start Date & Time */}
                  <DateTimePicker
                    label="Exam Start Date & Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    required
                    placeholder="Choose exam start time"
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
                      <span>Configured Examination Window</span>
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
                  Assign to Class Batch <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">No class restriction (Available to all registered students)</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Students must join the assigned class batch to view and attempt this examination.
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instructions / Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Enter exam guidelines, negative marking rules, or topics covered..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                {message}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
                disabled={loading}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{loading ? "Saving..." : "Save Draft"}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{loading ? "Creating..." : "Create & Add Questions"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CreateExam;
