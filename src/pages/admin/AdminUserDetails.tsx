import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  ClipboardList,
  GraduationCap,
  Loader2,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getAdminUserDetails,
  roleLabel,
  type AdminUser,
} from "../../services/adminService";

function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    profile: AdminUser;
    classes: number;
    exams: number;
    published: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void getAdminUserDetails(userId)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load user.")
      )
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <DashboardLayout
      role="admin"
      title="User Account Details"
      subtitle="Detailed profile information and platform activity telemetry."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to All Users</span>
        </button>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-xs text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Loading user telemetry...</span>
          </div>
        ) : (
          data && (
            <div className="space-y-6">
              {/* User Identity Header */}
              <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-2xl" />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    {data.profile.photoURL ? (
                      <img
                        src={data.profile.photoURL}
                        alt={data.profile.name || "User Avatar"}
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/20 shadow-md shadow-black/20"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-md shadow-blue-600/30">
                        {data.profile.name
                          ? data.profile.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-200 backdrop-blur-xs">
                          {data.profile.role === "admin" ? (
                            <Shield size={12} />
                          ) : data.profile.role === "teacher" ? (
                            <UserCheck size={12} />
                          ) : (
                            <GraduationCap size={12} />
                          )}
                          <span>{roleLabel(data.profile.role)}</span>
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            data.profile.status === "disabled"
                              ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                              : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                          }`}
                        >
                          {data.profile.status || "active"}
                        </span>
                      </div>

                      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                        {data.profile.name || "Unnamed User"}
                      </h1>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {data.profile.email || "No email available"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Activity Stats */}
              <section className="grid gap-4 md:grid-cols-3">
                <article className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {data.profile.role === "student"
                          ? "Joined Classes"
                          : "Class Batches"}
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {data.classes}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users size={20} />
                    </div>
                  </div>
                </article>

                <article className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {data.profile.role === "student"
                          ? "Exam Attempts"
                          : "Authored Exams"}
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">
                        {data.exams}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <ClipboardList size={20} />
                    </div>
                  </div>
                </article>

                {data.profile.role === "teacher" && (
                  <article className="app-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Published Exams
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                          {data.published}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Briefcase size={20} />
                      </div>
                    </div>
                  </article>
                )}
              </section>

              {/* Profile Details Metadata */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Account Metadata
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Phone Number
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {data.profile.phone || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Department
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {data.profile.department || "Not provided"}
                    </p>
                  </div>

                  {data.profile.role === "student" && (
                    <>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Roll Number
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {data.profile.rollNumber || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          College Institution
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {data.profile.collegeName || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {data.profile.role === "teacher" && (
                    <>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Employee ID
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {data.profile.employeeId || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Designation
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {data.profile.designation || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminUserDetails;
