import { useEffect, useState } from "react";
import {
  Activity,
  ClipboardList,
  Loader2,
  Shield,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getAdminActivities,
  type AdminActivity,
} from "../../services/adminService";

function AdminActivityLogs() {
  const [items, setItems] = useState<AdminActivity[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getAdminActivities()
      .then(setItems)
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load system activity logs."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="admin"
      title="Audit & Activity Logs"
      subtitle="Chronological audit trail of sensitive administrative actions and moderation events."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                System Audit Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail for user permission changes, exam moderations, and security events
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 text-xs text-slate-500">
              <Loader2 size={22} className="animate-spin text-blue-600" />
              <span>Loading audit logs...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
              <ClipboardList size={32} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No administrative events logged yet</p>
              <p className="text-slate-400 mt-1">Actions taken by administrators will be recorded here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Shield size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">
                      {item.details || item.actionType || "Administrative Action"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        Operator: <b>{item.adminName || "System Admin"}</b>
                      </span>
                      <span>•</span>
                      <span>Target: {item.targetType || "Record"}</span>
                    </div>

                    <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                      {item.createdAt?.toDate?.().toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }) || "Timestamp unavailable"}
                    </p>
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

export default AdminActivityLogs;
