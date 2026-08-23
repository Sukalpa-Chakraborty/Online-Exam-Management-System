import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  createClass,
  deleteClass,
  getClassMembers,
  getTeacherClasses,
  updateClass,
  type ClassBatch,
} from "../../services/classService";

function Classes() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<
    (ClassBatch & { memberCount: number })[]
  >([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const load = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const items = await getTeacherClasses(user.uid);
      const withCounts = await Promise.all(
        items.map(async (item) => ({
          ...item,
          memberCount: (await getClassMembers(item.id)).length,
        }))
      );
      setClasses(withCounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load class batches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  const create = async () => {
    if (!user || !name.trim()) return;
    try {
      setCreating(true);
      setError("");
      await createClass({
        name: name.trim(),
        description: description.trim(),
        teacherId: user.uid,
        teacherName:
          userProfile?.name || user.displayName || "Teacher",
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create class batch."
      );
    } finally {
      setCreating(false);
    }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((current) => (current === code ? "" : current));
    }, 1600);
  };

  const edit = async (item: ClassBatch) => {
    if (!user) return;
    const nextName = window.prompt("Class batch name", item.name);
    if (!nextName?.trim()) return;
    const nextDescription =
      window.prompt("Description", item.description || "") ??
      (item.description || "");

    try {
      await updateClass(item.id, user.uid, {
        name: nextName.trim(),
        description: nextDescription.trim(),
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update class batch."
      );
    }
  };

  const remove = async (item: ClassBatch) => {
    if (
      !user ||
      !window.confirm(
        `Delete class batch "${item.name}"? This is only permitted when the batch has 0 enrolled students and no active exam assignments.`
      )
    ) {
      return;
    }

    try {
      await deleteClass(item.id, user.uid);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete class batch."
      );
    }
  };

  return (
    <DashboardLayout
      role="teacher"
      title="Classes & Batches"
      subtitle="Create student cohorts, distribute join codes, and control class-assigned exams."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Create Batch Card */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create New Class Batch
              </h2>
              <p className="text-xs text-slate-500">
                A unique join code will automatically generate for student enrollment
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Class name, e.g. CSE 3rd Sem - Sec A"
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional course or term details"
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              onClick={() => void create()}
              disabled={creating || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>Create Batch</span>
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </section>

        {/* Classes List */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Your Class Batches ({classes.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage student memberships and batch codes
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 text-xs text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span>Loading class batches...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Clipboard size={26} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                No class batches created yet
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Create a class batch above to group students and restrict exam assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {classes.map((item) => {
                const copied = copiedCode === item.code;
                return (
                  <article
                    key={item.id}
                    className="app-card flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.description || "No description provided"}
                          </p>
                        </div>

                        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          <Users size={14} />
                          <span>{item.memberCount} Students</span>
                        </span>
                      </div>

                      {/* Code Chip */}
                      <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Student Join Code
                          </p>
                          <span className="font-mono text-sm font-bold tracking-wider text-slate-900">
                            {item.code}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void copy(item.code)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            copied
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied ? "Copied" : "Copy Code"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/teacher/classes/${item.id}`)
                        }
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                      >
                        <span>Details</span>
                        <ArrowRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void edit(item)}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void remove(item)}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-100 bg-white py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Classes;
