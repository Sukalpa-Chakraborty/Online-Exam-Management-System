import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getAdminClasses } from "../../services/adminService";
import {
  getClassMembers,
  type ClassBatch,
  type ClassMember,
} from "../../services/classService";

function AdminClasses() {
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [members, setMembers] = useState<Record<string, ClassMember[]>>({});
  const [openClassId, setOpenClassId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const items = await getAdminClasses();
        setClasses(items);
        const entries = await Promise.all(
          items.map(
            async (item) =>
              [item.id, await getClassMembers(item.id)] as const
          )
        );
        setMembers(Object.fromEntries(entries));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load classes."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      classes.filter((item) =>
        `${item.name} ${item.code} ${item.teacherName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [classes, search]
  );

  return (
    <DashboardLayout
      role="admin"
      title="Class Cohorts Management"
      subtitle="System-wide audit of all class batches, instructors, and enrolled students."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="relative max-w-xl">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Search by class name, join code, or instructor name..."
            />
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center gap-3 text-xs text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Loading class cohorts...</span>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((item) => {
              const classMembers = members[item.id] || [];
              const isOpen = openClassId === item.id;

              return (
                <article
                  key={item.id}
                  className="app-card overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {item.name}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Instructor: {item.teacherName || item.teacherId}
                        </p>
                      </div>

                      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        <Users size={14} />
                        <span>{classMembers.length} Students</span>
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-slate-400">
                          Join Code
                        </p>
                        <span className="font-mono font-bold tracking-wider text-slate-900">
                          {item.code}
                        </span>
                      </div>

                      {item.description && (
                        <p className="max-w-[200px] truncate text-slate-500 text-right">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenClassId(isOpen ? "" : item.id)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-700"
                    >
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      <span>
                        {isOpen
                          ? "Hide student roster"
                          : `View student roster (${classMembers.length})`}
                      </span>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Enrolled Students
                      </h3>

                      <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                        {classMembers.length === 0 ? (
                          <p className="py-2 text-xs text-slate-400">
                            No students are currently enrolled in this batch.
                          </p>
                        ) : (
                          classMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs shadow-2xs"
                            >
                              <div>
                                <p className="font-bold text-slate-800">
                                  {member.studentName || "Student"}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {member.studentEmail || "Email unavailable"}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-2 rounded-3xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                No class batches found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminClasses;
