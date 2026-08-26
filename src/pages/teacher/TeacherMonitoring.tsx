import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  History,
  Info,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  cancelStudentAttempt,
  getTeacherMonitoringRecords,
  type MonitoringAttemptRecord,
} from "../../services/examAttemptService";

type FilterStatus = "all" | "active" | "flagged" | "device_issues" | "submitted" | "cancelled";

function TeacherMonitoring() {
  const { user, userProfile } = useAuth();

  const [records, setRecords] = useState<MonitoringAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");

  // Audit Log Modal State
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<MonitoringAttemptRecord | null>(null);

  // Cancel Exam Modal State
  const [cancellingRecord, setCancellingRecord] = useState<MonitoringAttemptRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load records
  const loadRecords = async (isManualRefresh = false) => {
    if (!user) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const nextRecords = await getTeacherMonitoringRecords(user.uid);
      setRecords(nextRecords);
    } catch (err: unknown) {
      console.error("Failed to load monitoring records:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load integrity monitoring records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  // Periodic polling for live monitoring telemetry (every 15 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      void loadRecords(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [user]);

  // Unique exams for filter dropdown
  const uniqueExams = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.examId && r.examTitle) {
        map.set(r.examId, r.examTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [records]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = records.length;
    const active = records.filter((r) => r.status === "in_progress").length;
    const flagged = records.filter((r) => r.integrityWarningsCount > 0 && r.status !== "cancelled").length;
    const cancelled = records.filter((r) => r.status === "cancelled").length;
    return { total, active, flagged, cancelled };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((item) => {
      // Exam filter
      if (selectedExamFilter !== "all" && item.examId !== selectedExamFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && item.status !== "in_progress") return false;
      if (statusFilter === "submitted" && item.status !== "submitted") return false;
      if (statusFilter === "cancelled" && item.status !== "cancelled") return false;
      if (statusFilter === "flagged" && item.integrityWarningsCount === 0) return false;
      if (
        statusFilter === "device_issues" &&
        !(item.integrityLogs || []).some((l) => l.category === "device_issue")
      ) {
        return false;
      }

      // Search term
      if (!term) return true;
      return (
        item.studentName.toLowerCase().includes(term) ||
        item.studentEmail.toLowerCase().includes(term) ||
        item.examTitle.toLowerCase().includes(term)
      );
    });
  }, [records, search, statusFilter, selectedExamFilter]);

  // Action: Handle Exam Cancellation
  const handleConfirmCancel = async () => {
    if (!user || !cancellingRecord) return;

    try {
      setActionLoading(true);
      setError("");

      const teacherName =
        userProfile?.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Instructor";

      const finalReason = cancelReason.trim() || "Exam attempt invalidated by instructor due to proctoring policy.";

      await cancelStudentAttempt({
        teacherId: user.uid,
        teacherName,
        studentId: cancellingRecord.studentId,
        examId: cancellingRecord.examId,
        examTitle: cancellingRecord.examTitle,
        reason: finalReason,
      });

      setSuccessMessage(
        `Successfully cancelled active attempt for ${cancellingRecord.studentName}.`
      );

      // Dynamically update the currently open audit modal if it matches
      setSelectedAuditRecord((prev) =>
        prev && prev.id === cancellingRecord.id
          ? {
              ...prev,
              status: "cancelled",
              cancelledByName: teacherName,
              cancelledAt: new Date().toISOString(),
              cancellationReason: finalReason,
            }
          : prev
      );

      setCancellingRecord(null);
      setCancelReason("");
      await loadRecords(true);
    } catch (err: unknown) {
      console.error("Cancellation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel exam attempt."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <DashboardLayout
      role="teacher"
      title="Exam Integrity & Proctoring"
      subtitle="Real-time proctoring telemetry, browser violation logs, device health audits, and student attempt management."
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-4 text-xs font-medium text-red-700 dark:text-red-300">
            <AlertTriangle size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Metric Summary Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total Monitored */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              {metrics.total}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">All student exam attempts</p>
          </div>

          {/* Active Sessions */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Active</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                {metrics.active}
              </p>
              {metrics.active > 0 && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Currently taking exams</p>
          </div>

          {/* Flagged / Warnings */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notices / Flagged</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-amber-600 dark:text-amber-400 sm:text-3xl">
              {metrics.flagged}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Integrity notices logged</p>
          </div>

          {/* Cancelled Attempts */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cancelled</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <Ban size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-red-600 dark:text-red-400 sm:text-3xl">
              {metrics.cancelled}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Invalidated by instructor</p>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, email, or exam..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Exam Filter Dropdown */}
            {uniqueExams.length > 0 && (
              <select
                value={selectedExamFilter}
                onChange={(e) => setSelectedExamFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-blue-500"
              >
                <option value="all">All Examinations</option>
                {uniqueExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {/* Status Pills */}
            <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-950/70 p-1 border border-transparent dark:border-slate-800">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "flagged", label: "Flagged" },
                { id: "device_issues", label: "Device Issues" },
                { id: "cancelled", label: "Cancelled" },
                { id: "submitted", label: "Submitted" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as FilterStatus)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void loadRecords(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
              title="Refresh Live Telemetry"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </section>

        {/* Monitoring Data Table */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span>Loading proctoring records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              No monitoring attempts found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Student attempts and live proctoring events will appear here in real-time when students start taking your exams.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 pl-6 pr-4">Student</th>
                    <th className="py-4 px-4">Examination</th>
                    <th className="py-4 px-4">Device & Stream Status</th>
                    <th className="py-4 px-4">Integrity Notices</th>
                    <th className="py-4 px-4">Session State</th>
                    <th className="py-4 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredRecords.map((item) => {
                    const isActive = item.status === "in_progress";
                    const isCancelled = item.status === "cancelled";
                    const latestLog =
                      item.integrityLogs && item.integrityLogs.length > 0
                        ? item.integrityLogs[item.integrityLogs.length - 1]
                        : undefined;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        {/* Student Name & Email */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                              {item.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.studentName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {item.studentEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Examination Title */}
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.examTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.answeredQuestionsCount} answered{" "}
                              {item.totalQuestions ? `of ${item.totalQuestions}` : ""}
                            </p>
                          </div>
                        </td>

                        {/* Device & Stream Status */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Camera Status */}
                            <span
                              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                item.deviceStatus?.camera === "active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.deviceStatus?.camera === "denied"
                                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                              title={`Camera: ${item.deviceStatus?.camera || "Not Active"}`}
                            >
                              {item.deviceStatus?.camera === "active" ? (
                                <Camera size={11} />
                              ) : (
                                <CameraOff size={11} />
                              )}
                              <span>Cam</span>
                            </span>

                            {/* Mic Status */}
                            <span
                              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                item.deviceStatus?.mic === "active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.deviceStatus?.mic === "denied"
                                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                              title={`Mic: ${item.deviceStatus?.mic || "Not Active"}`}
                            >
                              {item.deviceStatus?.mic === "active" ? (
                                <Mic size={11} />
                              ) : (
                                <MicOff size={11} />
                              )}
                              <span>Mic</span>
                            </span>

                            {/* Fullscreen Status */}
                            <span
                              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                item.deviceStatus?.fullscreen === "active"
                                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                              title={`Screen: ${item.deviceStatus?.fullscreen || "Windowed"}`}
                            >
                              {item.deviceStatus?.fullscreen === "active" ? (
                                <Maximize2 size={11} />
                              ) : (
                                <Minimize2 size={11} />
                              )}
                              <span>FS</span>
                            </span>
                          </div>
                        </td>

                        {/* Integrity Notices & Snippet */}
                        <td className="py-4 px-4">
                          <div>
                            {item.integrityWarningsCount === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <ShieldCheck size={11} />
                                <span>No Violations</span>
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    item.integrityWarningsCount > 3
                                      ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-500/20"
                                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                  }`}
                                >
                                  <ShieldAlert size={11} />
                                  <span>
                                    {item.integrityWarningsCount} Notice
                                    {item.integrityWarningsCount > 1 ? "s" : ""}
                                  </span>
                                </span>

                                {latestLog && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                    Latest: {latestLog.details}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Session State */}
                        <td className="py-4 px-4">
                          <div>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span>Active Now</span>
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/50 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:text-red-300 border border-red-500/20">
                                <XCircle size={11} />
                                <span>Cancelled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                <span>Submitted</span>
                              </span>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                              Active: {formatTimeAgo(item.lastActiveAt)}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Audit Log Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedAuditRecord(item)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Integrity Audit Trail"
                            >
                              <History size={13} />
                              <span>Audit & Violations</span>
                            </button>

                            {/* Cancel Exam Button (Enabled for active attempts) */}
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingRecord(item);
                                  setCancelReason(
                                    item.integrityWarningsCount > 0
                                      ? `Cancelled due to ${item.integrityWarningsCount} detected integrity violation(s).`
                                      : ""
                                  );
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 shadow-2xs transition hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                                title="Cancel Student's Active Attempt"
                              >
                                <Ban size={13} />
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* AUDIT TRAIL MODAL (WITH DIRECT CANCEL EXAM ACTION) */}
        {/* ---------------------------------------------------- */}
        {selectedAuditRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Integrity Audit Trail
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedAuditRecord.examTitle}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {selectedAuditRecord.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedAuditRecord.studentEmail}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAuditRecord(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Timeline */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Attempt Status Banner */}
                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Session Status</span>
                    <p className="font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1 mt-0.5">
                      {selectedAuditRecord.status === "in_progress" ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          <span>Active Now</span>
                        </>
                      ) : selectedAuditRecord.status === "cancelled" ? (
                        <>
                          <XCircle size={13} className="text-red-500" />
                          <span>Cancelled</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Submitted</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Violations</span>
                    <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {selectedAuditRecord.integrityWarningsCount} Notice{selectedAuditRecord.integrityWarningsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Answer Progress</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedAuditRecord.answeredQuestionsCount} Question{selectedAuditRecord.answeredQuestionsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* If Cancelled, show cancellation details */}
                {selectedAuditRecord.status === "cancelled" && (
                  <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-4 text-xs">
                    <p className="font-bold text-red-700 dark:text-red-300">
                      Attempt Cancelled by {selectedAuditRecord.cancelledByName || "Instructor"}
                    </p>
                    {selectedAuditRecord.cancellationReason && (
                      <p className="mt-1 text-slate-700 dark:text-slate-300 italic">
                        "{selectedAuditRecord.cancellationReason}"
                      </p>
                    )}
                  </div>
                )}

                {/* Event Logs Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Violation History ({selectedAuditRecord.integrityLogs?.length || 0})
                  </h4>

                  {!selectedAuditRecord.integrityLogs || selectedAuditRecord.integrityLogs.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center text-xs text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck size={28} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                      <p className="font-bold">Clean Proctoring Record</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Zero tab switches, focus losses, or fullscreen interruptions were detected during this attempt.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(selectedAuditRecord.integrityLogs || []).map((log, index) => {
                        const isSuspicious = log.category === "suspicious";
                        const isDevice = log.category === "device_issue";

                        return (
                          <div
                            key={index}
                            className={`flex items-start gap-3 rounded-2xl p-3.5 text-xs border ${
                              isSuspicious
                                ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30"
                                : isDevice
                                ? "border-sky-200 dark:border-sky-900/40 bg-sky-50/60 dark:bg-sky-950/30"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30"
                            }`}
                          >
                            <div className="mt-0.5">
                              {isSuspicious ? (
                                <ShieldAlert size={16} className="text-amber-500" />
                              ) : isDevice ? (
                                <Info size={16} className="text-sky-500" />
                              ) : (
                                <Clock size={16} className="text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                                    {log.type.replace(/_/g, " ")}
                                  </span>
                                  <span
                                    className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                      isSuspicious
                                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                                        : "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300"
                                    }`}
                                  >
                                    {isSuspicious ? "Suspicious Activity" : "Device Event"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                {log.details}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer (with Direct Cancel Option) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 p-4">
                <div>
                  {selectedAuditRecord.status === "in_progress" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const record = selectedAuditRecord;
                        setCancellingRecord(record);
                        setCancelReason(
                          record.integrityWarningsCount > 0
                            ? `Cancelled by instructor due to ${record.integrityWarningsCount} detected integrity violation(s).`
                            : "Cancelled by instructor due to proctoring policy."
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 shadow-xs transition hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                      title="Cancel This Student's Active Attempt"
                    >
                      <Ban size={14} />
                      <span>Cancel This Exam Attempt</span>
                    </button>
                  ) : selectedAuditRecord.status === "cancelled" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400">
                      <XCircle size={14} />
                      <span>Attempt Already Cancelled</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Exam Completed & Submitted</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAuditRecord(null)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CANCEL EXAM CONFIRMATION MODAL */}
        {/* ---------------------------------------------------- */}
        {cancellingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <Ban size={24} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                Cancel Student Attempt
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are about to cancel <b>{cancellingRecord.studentName}</b>'s active attempt for <b>{cancellingRecord.examTitle}</b>.
              </p>

              <div className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                ⚠️ This will immediately terminate the student's active exam session, stop media streams, and prevent further answer saving. Already saved responses and logs will be kept for review.
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cancellation Reason (Optional):
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Multiple unapproved tab switches detected..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-red-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancellingRecord(null)}
                  disabled={actionLoading}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Keep Attempt Active
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Ban size={14} />
                  )}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TeacherMonitoring;
