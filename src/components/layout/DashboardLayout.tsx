import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { logoutUser } from "../../services/authService";
import { db } from "../../firebase/firebase";
import type { AppNotification } from "../../services/notificationService";
import { ExamSphereLogo } from "../common/ExamSphereLogo";

interface DashboardLayoutProps {
  children: ReactNode;
  role?: "student" | "teacher" | "admin";
  title: string;
  subtitle: string;
}

interface MenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const menuItems: Record<
  "student" | "teacher" | "admin",
  MenuItem[]
> = {
  student: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      label: "Available Exams",
      icon: <ClipboardList size={18} />,
      path: "/student/exams",
    },
    {
      label: "My Classes",
      icon: <Users size={18} />,
      path: "/student/classes",
    },
    {
      label: "My Results",
      icon: <BarChart3 size={18} />,
      path: "/student/results",
    },
    {
      label: "Exam History",
      icon: <FileText size={18} />,
      path: "/student/history",
    },
  ],

  teacher: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      label: "My Exams",
      icon: <ClipboardList size={18} />,
      path: "/teacher/exams",
    },
    {
      label: "Classes",
      icon: <Users size={18} />,
      path: "/teacher/classes",
    },
    {
      label: "Question Bank",
      icon: <BookOpen size={18} />,
      path: "/teacher/questions",
    },
    {
      label: "Evaluate Answers",
      icon: <ClipboardList size={18} />,
      path: "/teacher/evaluations",
    },
    {
      label: "Exam Monitoring",
      icon: <ShieldAlert size={18} />,
      path: "/teacher/monitoring",
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={18} />,
      path: "/teacher/analytics",
    },
  ],

  admin: [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      label: "Users",
      icon: <Users size={18} />,
      path: "/admin/users",
    },
    {
      label: "Classes",
      icon: <Users size={18} />,
      path: "/admin/classes",
    },
    {
      label: "Exams",
      icon: <ClipboardList size={18} />,
      path: "/admin/exams",
    },
    {
      label: "Monitoring",
      icon: <Activity size={18} />,
      path: "/admin/monitoring",
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={18} />,
      path: "/admin/analytics",
    },
    {
      label: "Activity Logs",
      icon: <FileText size={18} />,
      path: "/admin/activity-logs",
    },
  ],
};

const roleBadgeLabels = {
  student: "Student Workspace",
  teacher: "Faculty Console",
  admin: "Admin Control",
};

function DashboardLayout({
  children,
  role,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dashboard_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Persist sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem("dashboard_sidebar_collapsed", String(sidebarCollapsed));
    } catch (e) {
      console.warn("Unable to persist sidebar preference:", e);
    }
  }, [sidebarCollapsed]);

  // Keyboard accessibility: Escape closes mobile drawer & notifications
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "notifications"), where("recipientId", "==", user.uid)),
      (snapshot) => {
        setNotifications(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }) as AppNotification)
            .sort(
              (a, b) =>
                (b.createdAt?.toDate?.().getTime() || 0) -
                (a.createdAt?.toDate?.().getTime() || 0)
            )
        );
      },
      (error) => console.error("Unable to load notifications:", error)
    );
  }, [user]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const openNotification = async (item: AppNotification) => {
    setNotificationsOpen(false);
    if (!item.read) {
      await updateDoc(doc(db, "notifications", item.id), { read: true });
    }
    if (item.link) navigate(item.link);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifications = notifications.filter((item) => !item.read);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach((item) => {
        batch.update(doc(db, "notifications", item.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const effectiveRole: "student" | "teacher" | "admin" = (
    role && menuItems[role]
      ? role
      : userProfile?.role && menuItems[userProfile.role]
      ? userProfile.role
      : "student"
  ) as "student" | "teacher" | "admin";

  const items = menuItems[effectiveRole] || [];

  const displayName =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const photoURL =
    userProfile?.photoURL ||
    user?.photoURL ||
    "";

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMenuClick = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === `/${effectiveRole}/dashboard`;
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070b14] font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Modern Gradient Dark Sidebar (Collapsible on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-[#020617] text-slate-200 border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl shadow-black/60 w-72" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
      >
        {/* Brand Header */}
        <div className={`flex h-20 items-center border-b border-slate-800/80 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-6"}`}>
          <button
            type="button"
            onClick={() => handleMenuClick("/dashboard")}
            className="group flex items-center gap-3 text-left focus:outline-hidden cursor-pointer"
            title="ExamSphere Dashboard"
          >
            <ExamSphereLogo size={44} className="transition duration-300 group-hover:scale-105" />

            {!sidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-white truncate">
                    ExamSphere
                  </span>
                  <Sparkles size={13} className="text-blue-400 shrink-0" />
                </div>
                <span className="inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-300 ring-1 ring-blue-500/20 uppercase truncate">
                  {roleBadgeLabels[effectiveRole] || "Portal"}
                </span>
              </div>
            )}
          </button>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-6">
          {!sidebarCollapsed && (
            <p className="mb-3 px-3 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
              Navigation Menu
            </p>
          )}

          <nav className="space-y-1.5">
            {items.map((item) => {
              const active = isActive(item.path);
              return (
                <div key={item.label} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(item.path)}
                    className={`flex w-full items-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3.5"
                    } ${
                      active
                        ? "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                    }`}
                    aria-label={item.label}
                  >
                    <span
                      className={`shrink-0 transition-colors duration-150 ${
                        active ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!sidebarCollapsed && (
                      <>
                        <span className="tracking-wide truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-xs shadow-white/80 animate-pulse" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Tooltip for Collapsed Mode on Desktop */}
                  {sidebarCollapsed && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden lg:block whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl shadow-black/50 ring-1 ring-white/10 opacity-0 scale-95 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0"
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout in Sidebar */}
        <div className="border-t border-slate-800/80 p-3">
          {!sidebarCollapsed ? (
            <>
              <div className="mb-2.5 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 border border-white/5 backdrop-blur-xs">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-blue-500/30 shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-[10px] capitalize text-slate-400 font-medium truncate">
                      {role} Account
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-bold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/15 active:scale-98 cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/profile/edit")}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] p-1 border border-white/5 hover:border-blue-500/40 cursor-pointer"
                title={`Signed in as ${displayName}`}
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden lg:block whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 opacity-0 scale-95 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0"
                >
                  {displayName} ({role})
                </div>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden lg:block whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-red-400 shadow-xl ring-1 ring-white/10 opacity-0 scale-95 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0"
                >
                  Sign Out
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        {/* Top Navbar with Glassmorphism */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80 px-4 backdrop-blur-xl md:px-8 shadow-2xs transition-colors duration-200">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Sidebar Open Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:hidden cursor-pointer"
              aria-label="Open sidebar drawer"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Sidebar Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle sidebar collapse"
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white md:text-xl">
                  {title}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/20">
                  {effectiveRole === "admin" ? (
                    <Shield size={11} />
                  ) : effectiveRole === "teacher" ? (
                    <UserCheck size={11} />
                  ) : (
                    <GraduationCap size={11} />
                  )}
                  <span>{roleBadgeLabels[effectiveRole] || "Portal"}</span>
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-amber-400 cursor-pointer"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={18} className="text-slate-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Notification Popover */}
            <div ref={notificationPanelRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="app-popover absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/60">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          {unreadCount} New
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition hover:underline cursor-pointer"
                        title="Mark all notifications as read"
                      >
                        <CheckCheck size={14} />
                        <span>Mark all as read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        <Bell className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={28} />
                        No new notifications at this time.
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((item) => {
                        const isUnread = !item.read;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => void openNotification(item)}
                            className={`w-full px-4 py-3.5 text-left transition cursor-pointer ${
                              isUnread
                                ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3.5px] border-l-blue-600 dark:border-l-blue-500 hover:bg-blue-100/70 dark:hover:bg-blue-950/60"
                                : "bg-slate-50/40 dark:bg-slate-900/40 border-l-[3.5px] border-l-slate-200 dark:border-l-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 opacity-85"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p
                                  className={`text-xs truncate ${
                                    isUnread
                                      ? "font-bold text-slate-900 dark:text-white"
                                      : "font-semibold text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {isUnread && (
                                  <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-extrabold text-white shadow-2xs">
                                    NEW
                                  </span>
                                )}
                              </div>

                              <div className="shrink-0 flex items-center gap-1">
                                {isUnread ? (
                                  <span className="h-2 w-2 rounded-full bg-blue-600 shadow-xs shadow-blue-500/50" />
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    <CheckCheck size={11} className="text-slate-400" />
                                    <span>Read</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <p
                              className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${
                                isUnread
                                  ? "text-slate-700 dark:text-slate-200 font-medium"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {item.message}
                            </p>

                            <p
                              className={`mt-1.5 text-[10px] ${
                                isUnread
                                  ? "font-semibold text-blue-700/80 dark:text-blue-400"
                                  : "font-normal text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {item.createdAt?.toDate?.().toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) || "Just now"}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill Button */}
            <button
              type="button"
              onClick={() => navigate("/profile/edit")}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer"
              title="Edit Profile"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-xs text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-xs font-bold text-slate-900 dark:text-white">
                  {displayName}
                </p>
                <p className="text-[10px] capitalize text-slate-400 font-medium">
                  {role}
                </p>
              </div>

              <ChevronDown
                size={14}
                className="hidden text-slate-400 sm:block shrink-0"
              />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="page-enter flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
