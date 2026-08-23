import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getAdminResults, type AdminResult } from "../../services/adminService";

const label = (value?: string) =>
  value === "pending"
    ? "Pending evaluation"
    : value === "partially_evaluated"
    ? "Partially evaluated"
    : "Evaluated";

function AdminMonitoring() {
  const [results, setResults] = useState<AdminResult[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getAdminResults()
      .then(setResults)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Unable to load attempts."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      results.filter(
        (item) =>
          (status === "all" || item.evaluationStatus === status) &&
          `${item.studentName || ""} ${item.studentEmail || ""} ${
            item.examTitle || ""
          }`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [results, search, status]
  );

  return (
    <DashboardLayout
      role="admin"
      title="Attempts & Monitoring"
      subtitle="Real-time audit of student exam attempts, scores, and evaluation states."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Search & Filter */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder="Search submission by student name, email, or exam title..."
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All Evaluation States</option>
              <option value="pending">Pending Evaluation</option>
              <option value="partially_evaluated">Partially Evaluated</option>
              <option value="evaluated">Evaluated</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {/* Submissions Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Examination</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 pr-6">Evaluation State</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin text-blue-600" />
                        <span>Loading attempts telemetry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      No matching student attempts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      className="transition hover:bg-slate-50/50"
                      key={item.id}
                    >
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900">
                          {item.studentName || "Student"}
                        </p>
                        <p className="text-slate-400">
                          {item.studentEmail || "Email unavailable"}
                        </p>
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {item.examTitle || item.examId || "Exam"}
                      </td>

                      <td className="p-4">
                        {item.evaluationStatus === "evaluated" ||
                        item.evaluationStatus === "completed" ? (
                          <span className="font-bold text-slate-900">
                            {Number(item.percentage || 0).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending grade</span>
                        )}
                      </td>

                      <td className="p-4 pr-6">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.evaluationStatus === "evaluated" ||
                            item.evaluationStatus === "completed"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                          }`}
                        >
                          {label(item.evaluationStatus)}
                        </span>
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

export default AdminMonitoring;
