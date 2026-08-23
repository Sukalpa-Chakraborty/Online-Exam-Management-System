import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileText,
  Plus,
  Save,
} from "lucide-react";

import { DateTimePicker } from "../../components/common/DateTimePicker";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { createExam } from "../../services/examService";
import type { Exam } from "../../types/exam";
import { getTeacherClasses, type ClassBatch } from "../../services/classService";

function CreateExam() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (user) void getTeacherClasses(user.uid).then(setClasses).catch(() => undefined);
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    if (!startTime || !endTime) {
      setError("Please select the start and end date and time.");
      return false;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after the start time.");
      return false;
    }

    if (duration < 1) {
      setError("Duration must be at least 1 minute.");
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
      subtitle="Set up your examination details before adding questions."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/teacher/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          {/* Header */}
          <div className="border-b border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 md:text-xl">
                  Create New Exam
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Save as a draft or proceed straight to adding exam questions.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateAndAddQuestions} className="p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Mid-Term DBMS Examination"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Subject / Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Database Systems"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(event) =>
                      setDuration(Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Start Date & Time */}
              <DateTimePicker
                label="Start Date & Time"
                value={startTime}
                onChange={(val) => setStartTime(val)}
                required
                placeholder="Choose start date & time"
              />

              {/* End Date & Time */}
              <DateTimePicker
                label="End Date & Time"
                value={endTime}
                onChange={(val) => setEndTime(val)}
                required
                placeholder="Choose end date & time"
              />

              {/* Class Assignment */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Assign to Class Batch <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">No class assignment (Available to all enrolled students)</option>
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Instructions / Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Enter exam guidelines, negative marking rules, or topics covered..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

            <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <Save size={15} />
                  <span>{loading ? "Saving..." : "Save Draft"}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
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
