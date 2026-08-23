import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Search,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getAdminUsers,
  roleLabel,
  setUserApplicationStatus,
  type AdminUser,
} from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

function AdminUsers() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getAdminUsers()
      .then(setUsers)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load users.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (item) =>
          (role === "all" || item.role === role) &&
          `${item.name || ""} ${item.email || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [users, search, role]
  );

  const toggle = async (targetUser: AdminUser) => {
    if (
      !user ||
      !window.confirm(
        `${
          targetUser.status === "disabled" ? "Re-enable" : "Disable"
        } platform access for ${targetUser.name || targetUser.email}?`
      )
    ) {
      return;
    }

    try {
      setBusy(targetUser.id);
      const status = targetUser.status === "disabled" ? "active" : "disabled";
      await setUserApplicationStatus({
        adminId: user.uid,
        adminName: userProfile?.name,
        targetUser,
        nextStatus: status,
      });
      setUsers((items) =>
        items.map((item) =>
          item.id === targetUser.id ? { ...item, status } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user status."
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="User Management"
      subtitle="Inspect user accounts, academic credentials, and toggle application access permissions."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Filter Toolbar */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder="Search user by name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {/* User Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 pl-6">User Account</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 pr-6 text-right">Moderation Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin text-blue-600" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/50"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {item.photoURL ? (
                            <img
                              src={item.photoURL}
                              alt={item.name || "User Avatar"}
                              className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                              {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}

                          <div>
                            <Link
                              className="font-bold text-slate-900 transition hover:text-blue-600"
                              to={`/admin/users/${item.id}`}
                            >
                              {item.name || "Unnamed User"}
                            </Link>
                            <p className="text-slate-400">
                              {item.email || "No email available"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {item.role === "admin" ? (
                            <Shield size={13} className="text-purple-600" />
                          ) : item.role === "teacher" ? (
                            <UserCheck size={13} className="text-blue-600" />
                          ) : (
                            <GraduationCap size={13} className="text-emerald-600" />
                          )}
                          <span>{roleLabel(item.role)}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.status === "disabled"
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "disabled"
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span className="capitalize">{item.status || "active"}</span>
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/users/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                          >
                            <span>Profile</span>
                            <ArrowRight size={13} />
                          </Link>

                          {item.role === "admin" ? (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                              Admin Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy === item.id}
                              onClick={() => void toggle(item)}
                              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50 ${
                                item.status === "disabled"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {busy === item.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : item.status === "disabled" ? (
                                <UserCheck size={13} />
                              ) : (
                                <UserX size={13} />
                              )}
                              <span>
                                {item.status === "disabled"
                                  ? "Enable"
                                  : "Disable"}
                              </span>
                            </button>
                          )}
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

export default AdminUsers;
