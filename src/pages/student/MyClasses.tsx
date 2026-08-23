import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, LogOut, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { getStudentClasses, joinClassByCode, leaveClass, type ClassBatch } from "../../services/classService";

function MyClasses() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const studentClasses = await getStudentClasses(user.uid);
      setClasses(studentClasses);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  const join = async () => {
    if (!user || !code.trim()) return;
    try {
      setJoining(true);
      setError("");
      setMessage("");
      await joinClassByCode({
        code: code.trim(),
        studentId: user.uid,
        studentName: userProfile?.name || user.displayName || "Student",
        studentEmail: user.email || "",
      });
      setCode("");
      setMessage("You have successfully enrolled in the class.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join class.");
    } finally {
      setJoining(false);
    }
  };

  const leave = async (classId: string, className: string) => {
    if (!user || !window.confirm(`Are you sure you want to leave ${className}?`)) return;
    try {
      setError("");
      setMessage("");
      await leaveClass(classId, user.uid);
      setMessage("You have left the class.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to leave class.");
    }
  };

  return (
    <DashboardLayout
      role="student"
      title="My Classes"
      subtitle="Join class batches to access assigned exams and assignments."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/student/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        {/* Join Class Card */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Enroll in a Class Batch
              </h2>
              <p className="text-xs text-slate-500">
                Enter the unique class code provided by your instructor
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS101-FALL"
              onKeyDown={(e) => {
                if (e.key === "Enter") void join();
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 font-mono text-sm font-semibold tracking-wider text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              onClick={() => void join()}
              disabled={joining || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              {joining ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>Enroll Now</span>
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{message}</span>
            </p>
          )}
        </section>

        {/* Classes List */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Enrolled Classes ({classes.length})
            </h2>
            <p className="text-xs text-slate-500">
              Your active class memberships
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 text-xs text-slate-500">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              <span>Loading enrolled classes...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Not Enrolled in Any Classes
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Ask your teacher for a class code to enroll and view class exams.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((item) => (
                <article
                  key={item.id}
                  className="app-card flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Instructor: {item.teacherName || "Teacher"}
                        </p>
                      </div>

                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Class Code
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {item.code}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 text-right">
                    <button
                      onClick={() => void leave(item.id, item.name)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 transition hover:text-red-700"
                    >
                      <LogOut size={14} />
                      <span>Leave Class</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MyClasses;
