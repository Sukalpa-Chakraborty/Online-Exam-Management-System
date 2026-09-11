import {
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Server time offset in milliseconds (serverTime - localClientTime)
 */
let serverTimeOffsetMs = 0;
let lastSyncTimestamp = 0;
let syncInProgress = false;

/**
 * Synchronizes client clock with Firestore server timestamp to detect and correct local clock skew.
 */
export async function syncServerTimeOffset(): Promise<number> {
  // Only re-sync if 5 minutes passed or never synced
  const now = Date.now();
  if (lastSyncTimestamp > 0 && now - lastSyncTimestamp < 5 * 60 * 1000) {
    return serverTimeOffsetMs;
  }

  if (syncInProgress) return serverTimeOffsetMs;
  syncInProgress = true;

  try {
    const timeDocRef = doc(db, "_system", "serverTimePing");
    const clientSendTime = Date.now();

    // Write server timestamp
    await setDoc(timeDocRef, { timestamp: serverTimestamp() }, { merge: true });
    
    // Read the server-generated timestamp directly from server bypassing cache
    const snapshot = await getDocFromServer(timeDocRef);
    const clientReceiveTime = Date.now();

    if (snapshot.exists()) {
      const serverDate = snapshot.data()?.timestamp?.toDate?.() as Date | undefined;
      if (serverDate) {
        const roundTripTime = clientReceiveTime - clientSendTime;
        const estimatedServerTimeAtReceive = serverDate.getTime() + Math.floor(roundTripTime / 2);
        serverTimeOffsetMs = estimatedServerTimeAtReceive - clientReceiveTime;
        lastSyncTimestamp = Date.now();
      }
    }
  } catch (err) {
    // If permission or offline, fallback safely to client clock
    console.warn("Server time sync notice (using client clock fallback):", err);
  } finally {
    syncInProgress = false;
  }

  return serverTimeOffsetMs;
}

// Automatically trigger background sync on module load
if (typeof window !== "undefined") {
  void syncServerTimeOffset();
}

/**
 * Returns the authoritative current timestamp in milliseconds, adjusted for server time offset.
 */
export function getServerTime(): number {
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Calculates end date-time string (YYYY-MM-DDTHH:mm) given start time and duration in minutes.
 */
export function calculateExamEndTime(
  startTimeIsoOrLocal: string,
  durationMinutes: number
): string {
  if (!startTimeIsoOrLocal || !durationMinutes || durationMinutes <= 0) return "";
  const startDate = new Date(startTimeIsoOrLocal);
  if (Number.isNaN(startDate.getTime())) return "";

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, "0");
  const day = String(endDate.getDate()).padStart(2, "0");
  const hours = String(endDate.getHours()).padStart(2, "0");
  const minutes = String(endDate.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export type ExamScheduleStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled";

export interface ExamScheduleDetails {
  scheduleStatus: ExamScheduleStatus;
  status: ExamScheduleStatus; // Alias for convenience
  isUpcoming: boolean;
  isLive: boolean;
  isCompleted: boolean;
  isDraft: boolean;
  secondsUntilStart: number;
  secondsRemainingInWindow: number;
  formattedStartTime: string;
  formattedEndTime: string;
  formattedDuration: string;
  startTime: string;
  endTime: string;
  canStart: boolean;
}

/**
 * Computes strict schedule availability status based on teacher-configured start time and duration window.
 * Supports both object input { startTime, endTime, duration, status } and positional args (startTime, duration, endTime, status).
 */
export function getExamScheduleDetails(
  examOrStartTime?:
    | {
        startTime?: string;
        endTime?: string;
        duration?: number;
        status?: string;
      }
    | string,
  durationOrRefNow?: number,
  endTimeParam?: string,
  statusParam?: string,
  referenceNowMsParam?: number
): ExamScheduleDetails {
  let startTime = "";
  let endTime = "";
  let duration = 0;
  let status = "published";
  let referenceNowMs = getServerTime();

  if (typeof examOrStartTime === "object" && examOrStartTime !== null) {
    startTime = examOrStartTime.startTime || "";
    endTime = examOrStartTime.endTime || "";
    duration = Number(examOrStartTime.duration) || 0;
    status = examOrStartTime.status || "published";
    if (typeof durationOrRefNow === "number") {
      referenceNowMs = durationOrRefNow;
    }
  } else {
    startTime = typeof examOrStartTime === "string" ? examOrStartTime : "";
    duration = typeof durationOrRefNow === "number" ? durationOrRefNow : 0;
    endTime = typeof endTimeParam === "string" ? endTimeParam : "";
    status = typeof statusParam === "string" ? statusParam : "published";
    if (typeof referenceNowMsParam === "number") {
      referenceNowMs = referenceNowMsParam;
    }
  }

  const isDraft = status === "draft" || status === "Draft";
  const isCancelled = status === "cancelled";

  const durationMinutes = Number(duration) || 0;
  const startTimeMs = startTime ? new Date(startTime).getTime() : 0;

  // Calculate or derive end time
  let derivedEndTimeStr = endTime;
  let endTimeMs = endTime ? new Date(endTime).getTime() : 0;
  if (!endTimeMs && startTimeMs && durationMinutes > 0) {
    endTimeMs = startTimeMs + durationMinutes * 60 * 1000;
    derivedEndTimeStr = calculateExamEndTime(startTime, durationMinutes);
  }

  const hasValidSchedule = startTimeMs > 0 && endTimeMs > startTimeMs;

  const secondsUntilStart = hasValidSchedule
    ? Math.max(0, Math.ceil((startTimeMs - referenceNowMs) / 1000))
    : 0;

  const secondsRemainingInWindow = hasValidSchedule
    ? Math.max(0, Math.floor((endTimeMs - referenceNowMs) / 1000))
    : 0;

  let scheduleStatus: ExamScheduleStatus = "scheduled";

  if (isDraft) {
    scheduleStatus = "draft";
  } else if (isCancelled) {
    scheduleStatus = "cancelled";
  } else if (!hasValidSchedule) {
    // If no schedule provided on published legacy exams, treat as live
    scheduleStatus = "live";
  } else if (referenceNowMs < startTimeMs) {
    scheduleStatus = "scheduled";
  } else if (referenceNowMs >= startTimeMs && referenceNowMs < endTimeMs) {
    scheduleStatus = "live";
  } else {
    scheduleStatus = "completed";
  }

  const isUpcoming = scheduleStatus === "scheduled";
  const isLive = scheduleStatus === "live";
  const isCompleted = scheduleStatus === "completed";
  const canStart = isLive && !isDraft && !isCancelled;

  const formatDateTime = (timestampMs: number) => {
    if (!timestampMs || Number.isNaN(timestampMs)) return "Not specified";
    return new Date(timestampMs).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return {
    scheduleStatus,
    status: scheduleStatus,
    isUpcoming,
    isLive,
    isCompleted,
    isDraft,
    secondsUntilStart,
    secondsRemainingInWindow,
    formattedStartTime: formatDateTime(startTimeMs),
    formattedEndTime: formatDateTime(endTimeMs),
    formattedDuration: `${durationMinutes} Minute${durationMinutes === 1 ? "" : "s"}`,
    startTime,
    endTime: derivedEndTimeStr || (endTimeMs ? new Date(endTimeMs).toISOString() : ""),
    canStart,
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 */
export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
