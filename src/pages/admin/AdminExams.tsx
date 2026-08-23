import { useEffect, useMemo, useState } from "react";
import { Archive, Loader2, Search } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getAdminExams,
  updateExamAdministrationStatus,
  type AdminExam,
} from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

function AdminExams() {
  const { user, userProfile } = useAuth();
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    setLoading(true);
    void getAdminExams()
      .then(setExams)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load exams.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      exams.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          `${item.title || ""} ${item.teacherName || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [exams, search, filter]
  );

  const change = async (exam: AdminExam, status: "draft" | "archived") => {
    if (
      !user ||
      !window.confirm(
        `${
          status === "draft" ? "Unpublish" : "Archive"
        } this exam? All student attempt histories and results are preserved.`
      )
    ) {
      return;
    }

    try {
      setBusyId(exam.id);
      await updateExamAdministrationStatus({
        adminId: user.uid,
        adminName: userProfile?.name,
        exam,
        nextStatus: status,
      });
      setExams((items) =>
        items.map((item) => (item.id === exam.id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update exam state."
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="Exam Moderation"
      subtitle="Safely unpublish or archive exam papers across the institution while preserving historical records."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Search & Filter */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder="Search exams by title, subject, or teacher name..."
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 pl-6">Examination Paper</th>
                  <th className="p-4">Authoring Teacher</th>
                  <th className="p-4">Questions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Moderation Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin text-blue-600" />
                        <span>Loading exam registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      No examinations found matching your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.title || "Untitled Exam"}
                          </p>
                          <p className="text-slate-400">
                            {item.subject || "General Subject"}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-700">
                        {item.teacherName || item.teacherId || "—"}
                      </td>

                      <td className="p-4 font-semibold text-slate-700">
                        {item.questionCount ?? item.totalQuestions ?? 0}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === "published"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : item.status === "archived"
                              ? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {item.status || "draft"}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "published" && (
                            <button
                              disabled={busyId === item.id}
                              onClick={() => void change(item, "draft")}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
                            >
                              Unpublish
                            </button>
                          )}

                          <button
                            disabled={busyId === item.id}
                            onClick={() => void change(item, "archived")}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-2xs transition hover:bg-amber-100 disabled:opacity-50"
                          >
                            <Archive size={13} />
                            <span>Archive</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminExams;
