import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  FileQuestion,
  GraduationCap,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import {
  getClassById,
  getClassMembers,
  removeStudentFromClass,
  type ClassBatch,
  type ClassMember,
} from "../../services/classService";

interface Exam {
  id: string;
  title: string;
  status?: string;
  classIds?: string[];
  duration?: number;
}

interface Result {
  studentId: string;
  examId: string;
  evaluationStatus?: string;
  submittedAt?: { toDate?: () => Date };
}

function ClassDetails() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classBatch, setClassBatch] = useState<ClassBatch | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!classId || !user) return;
      try {
        setLoading(true);
        const item = await getClassById(classId);
        if (!item || item.teacherId !== user.uid) {
          throw new Error("Class not found or access denied.");
        }

        const [nextMembers, examsSnapshot, resultsSnapshot] = await Promise.all([
          getClassMembers(classId),
          getDocs(
            query(
              collection(db, "exams"),
              where("classIds", "array-contains", classId)
            )
          ),
          getDocs(collectionGroup(db, "examResults")),
        ]);

        setClassBatch(item);
        setMembers(nextMembers);
        setExams(
          examsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Exam[]
        );
        setResults(resultsSnapshot.docs.map((doc) => doc.data() as Result));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load class.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classId, user]);

  const copy = async () => {
    if (!classBatch) return;
    await navigator.clipboard.writeText(classBatch.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const removeMember = async (member: ClassMember) => {
    if (
      !classId ||
      !user ||
      !window.confirm(
        `Remove ${member.studentName || "this student"} from the class batch?`
      )
    ) {
      return;
    }

    try {
      setRemovingId(member.studentId);
      setError("");
      await removeStudentFromClass(classId, member.studentId, user.uid);
      setMembers((current) =>
        current.filter((item) => item.studentId !== member.studentId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove student."
      );
    } finally {
      setRemovingId("");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        title="Class Batch Details"
        subtitle="Loading roster and statistics..."
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classBatch) {
    return (
      <DashboardLayout
        role="teacher"
        title="Class Batch Details"
        subtitle="Manage students and exams."
      >
        <div className="mx-auto max-w-4xl space-y-4">
          <button
            onClick={() => navigate("/teacher/classes")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Back to All Classes</span>
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-xs font-medium text-red-700">
            {error || "Class batch not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      title="Class Batch Details"
      subtitle="Students, assigned exams, and participation breakdown."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          onClick={() => navigate("/teacher/classes")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to All Classes</span>
        </button>

        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200">
                <GraduationCap size={14} />
                <span>Class Batch Cohort</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {classBatch.name}
              </h1>

              <p className="mt-1 text-xs text-slate-300">
                {classBatch.description || "No description provided"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:items-end backdrop-blur-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Enrollment Code
              </span>
              <button
                onClick={() => void copy()}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-sm font-bold transition ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Copied to Clipboard" : classBatch.code}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Enrolled Students Table */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Enrolled Students ({members.length})
              </h2>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No students have enrolled in this batch yet. Share the code with students to join.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                      {member.studentName?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {member.studentName || "Student"}
                      </p>
                      <p className="text-slate-500">
                        {member.studentEmail || "No email available"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => void removeMember(member)}
                    disabled={removingId === member.studentId}
                    title="Remove from batch"
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === member.studentId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assigned Exams Participation */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <FileQuestion size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Assigned Exams ({exams.length})
              </h2>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No exams assigned directly to this class batch.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {exams.map((exam) => {
                const attempts = new Map(
                  results
                    .filter(
                      (res) =>
                        res.examId === exam.id &&
                        members.some((m) => m.studentId === res.studentId)
                    )
                    .map((res) => [res.studentId, res])
                );

                const pending = [...attempts.values()].filter(
                  (res) =>
                    res.evaluationStatus === "pending" ||
                    res.evaluationStatus === "partially_evaluated"
                ).length;

                return (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {exam.title}
                        </h3>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            exam.status === "published"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {exam.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white p-3 text-xs shadow-2xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Attempted
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {attempts.size} / {members.length}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Pending Grade
                        </p>
                        <p className="text-sm font-bold text-amber-700">
                          {pending}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default ClassDetails;
