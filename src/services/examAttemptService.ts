import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export type IntegrityEventCategory = "suspicious" | "device_issue" | "permission";

export type IntegrityEventType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "visibility_loss"
  | "camera_disconnected"
  | "mic_disconnected"
  | "camera_denied"
  | "mic_denied"
  | "stream_interrupted";

export interface IntegrityEvent {
  type: IntegrityEventType;
  category: IntegrityEventCategory;
  timestamp: string; // ISO String
  details: string;
}

export type AttemptStatus = "in_progress" | "submitted" | "cancelled";

export interface DeviceStatus {
  camera: "ready" | "active" | "denied" | "not_found" | "offline";
  mic: "ready" | "active" | "denied" | "not_found" | "offline";
  fullscreen: "active" | "inactive" | "unsupported";
}

export interface DraftExamAttempt {
  id?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  examId: string;
  examTitle?: string;
  teacherId?: string;
  answers: Record<string, string>;
  startedAt: string; // ISO String
  lastSavedAt: string; // ISO String
  integrityWarningsCount: number;
  integrityLogs: IntegrityEvent[];
  deviceStatus?: DeviceStatus;
  status: AttemptStatus;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string; // ISO String
  cancellationReason?: string;
}

export interface MonitoringAttemptRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examTitle: string;
  teacherId: string;
  status: AttemptStatus;
  startedAt: string;
  lastActiveAt: string;
  integrityWarningsCount: number;
  integrityLogs: IntegrityEvent[];
  deviceStatus?: DeviceStatus;
  totalQuestions?: number;
  answeredQuestionsCount: number;
  score?: number;
  totalMarks?: number;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

const getLocalKey = (studentId: string, examId: string) =>
  `examsphere_draft_${studentId}_${examId}`;

/**
 * Persists student draft answers, device statuses, and integrity logs to Firestore with LocalStorage fallback.
 * Will not overwrite if the attempt has been cancelled by the teacher.
 */
export async function saveDraftAttempt(
  studentId: string,
  examId: string,
  draft: {
    studentName?: string;
    studentEmail?: string;
    examTitle?: string;
    teacherId?: string;
    answers: Record<string, string>;
    startedAt: string;
    integrityWarningsCount: number;
    integrityLogs: IntegrityEvent[];
    deviceStatus?: DeviceStatus;
    status?: AttemptStatus;
  }
): Promise<{ syncedToServer: boolean; cancelled?: boolean }> {
  const lastSavedAt = new Date().toISOString();
  const draftData: DraftExamAttempt = {
    studentId,
    studentName: draft.studentName,
    studentEmail: draft.studentEmail,
    examId,
    examTitle: draft.examTitle,
    teacherId: draft.teacherId,
    answers: draft.answers,
    startedAt: draft.startedAt,
    lastSavedAt,
    integrityWarningsCount: draft.integrityWarningsCount,
    integrityLogs: draft.integrityLogs,
    deviceStatus: draft.deviceStatus,
    status: draft.status || "in_progress",
  };

  // Always cache locally first for resilience
  try {
    localStorage.setItem(getLocalKey(studentId, examId), JSON.stringify(draftData));
  } catch (localError) {
    console.warn("Local storage cache warning:", localError);
  }

  // If offline, return gracefully
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedToServer: false };
  }

  try {
    const draftRef = doc(db, "users", studentId, "activeExamAttempts", examId);
    
    // Check if attempt document is already cancelled before saving
    const existingSnap = await getDoc(draftRef);
    if (existingSnap.exists()) {
      const serverData = existingSnap.data() as DraftExamAttempt;
      if (serverData.status === "cancelled") {
        return { syncedToServer: false, cancelled: true };
      }
    }

    await setDoc(
      draftRef,
      {
        ...draftData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { syncedToServer: true };
  } catch (error) {
    console.warn("Server draft save skipped/failed (cached locally):", error);
    return { syncedToServer: false };
  }
}

/**
 * Retrieves existing draft answers to restore student progress on page refresh or return
 */
export async function getDraftAttempt(
  studentId: string,
  examId: string
): Promise<DraftExamAttempt | null> {
  let localDraft: DraftExamAttempt | null = null;

  try {
    const localRaw = localStorage.getItem(getLocalKey(studentId, examId));
    if (localRaw) {
      localDraft = JSON.parse(localRaw) as DraftExamAttempt;
    }
  } catch (e) {
    console.warn("Unable to parse local draft:", e);
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return localDraft;
  }

  try {
    const draftRef = doc(db, "users", studentId, "activeExamAttempts", examId);
    const snap = await getDoc(draftRef);

    if (snap.exists()) {
      const serverDraft = snap.data() as DraftExamAttempt;
      // If server draft is cancelled, return server draft immediately
      if (serverDraft.status === "cancelled") {
        return serverDraft;
      }
      // If local draft is newer than server draft, use local
      if (
        localDraft &&
        new Date(localDraft.lastSavedAt).getTime() >
          new Date(serverDraft.lastSavedAt || 0).getTime()
      ) {
        return localDraft;
      }
      return serverDraft;
    }
  } catch (serverError) {
    console.warn("Unable to fetch server draft, relying on local draft:", serverError);
  }

  return localDraft;
}

/**
 * Real-time listener for an active student attempt (to detect teacher cancellation immediately)
 */
export function subscribeToAttempt(
  studentId: string,
  examId: string,
  onUpdate: (attempt: DraftExamAttempt | null) => void
): Unsubscribe {
  const draftRef = doc(db, "users", studentId, "activeExamAttempts", examId);
  return onSnapshot(
    draftRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as DraftExamAttempt);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn("Attempt subscription notice:", err);
    }
  );
}

/**
 * Clears active draft attempt upon official submission
 */
export async function clearDraftAttempt(
  studentId: string,
  examId: string
): Promise<void> {
  try {
    localStorage.removeItem(getLocalKey(studentId, examId));
  } catch (localError) {
    console.warn("Local storage clear warning:", localError);
  }

  try {
    const draftRef = doc(db, "users", studentId, "activeExamAttempts", examId);
    await deleteDoc(draftRef);
  } catch (error) {
    console.warn("Server draft cleanup warning:", error);
  }
}

/**
 * Teacher action: Cancel a student's active exam attempt safely & idempotently
 */
export async function cancelStudentAttempt({
  teacherId,
  teacherName,
  studentId,
  examId,
  examTitle,
  reason,
}: {
  teacherId: string;
  teacherName: string;
  studentId: string;
  examId: string;
  examTitle?: string;
  reason?: string;
}): Promise<void> {
  const cancelledAt = new Date().toISOString();
  const cancellationReason = reason?.trim() || "Exam attempt invalidated by instructor due to proctoring policy.";

  const draftRef = doc(db, "users", studentId, "activeExamAttempts", examId);
  const draftSnap = await getDoc(draftRef);
  const existingData = draftSnap.exists() ? (draftSnap.data() as DraftExamAttempt) : null;

  // 1. Update active attempt document to cancelled state
  await setDoc(
    draftRef,
    {
      status: "cancelled",
      cancelledBy: teacherId,
      cancelledByName: teacherName,
      cancelledAt,
      cancellationReason,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 2. Also register in student's permanent examResults as a cancelled attempt for audit records
  const resultRef = doc(db, "users", studentId, "examResults", examId);
  await setDoc(
    resultRef,
    {
      examId,
      examTitle: examTitle || existingData?.examTitle || "Examination",
      studentId,
      teacherId,
      status: "cancelled",
      evaluationStatus: "completed",
      obtainedMarks: 0,
      totalMarks: 0,
      percentage: 0,
      cancelledBy: teacherId,
      cancelledByName: teacherName,
      cancelledAt,
      cancellationReason,
      integrityWarningsCount: existingData?.integrityWarningsCount || 0,
      integrityLogs: existingData?.integrityLogs || [],
      answers: existingData?.answers || {},
      submittedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Fetches all monitoring records (both active and completed attempts) for exams created by the teacher
 */
export async function getTeacherMonitoringRecords(
  teacherId: string
): Promise<MonitoringAttemptRecord[]> {
  const recordsMap = new Map<string, MonitoringAttemptRecord>();

  // 1. Fetch active draft attempts for this teacher
  try {
    const activeSnap = await getDocs(collectionGroup(db, "activeExamAttempts"));
    activeSnap.docs.forEach((itemDoc) => {
      const data = itemDoc.data() as DraftExamAttempt;
      if (data.teacherId === teacherId) {
        const key = `${data.studentId}_${data.examId}`;
        const answeredCount = Object.values(data.answers || {}).filter(
          (val) => typeof val === "string" && val.trim().length > 0
        ).length;

        recordsMap.set(key, {
          id: key,
          studentId: data.studentId,
          studentName: data.studentName || "Student",
          studentEmail: data.studentEmail || "No email",
          examId: data.examId,
          examTitle: data.examTitle || "Examination",
          teacherId: data.teacherId || teacherId,
          status: data.status || "in_progress",
          startedAt: data.startedAt,
          lastActiveAt: data.lastSavedAt || data.startedAt,
          integrityWarningsCount: data.integrityWarningsCount || 0,
          integrityLogs: data.integrityLogs || [],
          deviceStatus: data.deviceStatus,
          answeredQuestionsCount: answeredCount,
          cancelledBy: data.cancelledBy,
          cancelledByName: data.cancelledByName,
          cancelledAt: data.cancelledAt,
          cancellationReason: data.cancellationReason,
        });
      }
    });
  } catch (activeErr) {
    console.warn("Active attempts monitoring fetch notice:", activeErr);
  }

  // 2. Fetch submitted/cancelled results
  try {
    const resultsSnap = await getDocs(collectionGroup(db, "examResults"));
    resultsSnap.docs.forEach((itemDoc) => {
      const data = itemDoc.data();
      if (data.teacherId === teacherId) {
        const key = `${data.studentId}_${data.examId}`;
        const isCancelled = data.status === "cancelled";
        const answeredCount = Array.isArray(data.questions)
          ? data.questions.filter((q: { selectedAnswer?: string }) => Boolean(q.selectedAnswer?.trim())).length
          : 0;

        // If an active attempt already exists and is not cancelled on server, keep active. Otherwise use result
        if (!recordsMap.has(key) || isCancelled) {
          recordsMap.set(key, {
            id: key,
            studentId: data.studentId,
            studentName: data.studentName || "Student",
            studentEmail: data.studentEmail || "No email",
            examId: data.examId,
            examTitle: data.examTitle || "Examination",
            teacherId: data.teacherId || teacherId,
            status: isCancelled ? "cancelled" : "submitted",
            startedAt: data.startedAt || data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            lastActiveAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            integrityWarningsCount: data.integrityWarningsCount || 0,
            integrityLogs: data.integrityLogs || [],
            totalQuestions: Array.isArray(data.questions) ? data.questions.length : undefined,
            answeredQuestionsCount: answeredCount,
            score: data.obtainedMarks,
            totalMarks: data.totalMarks,
            cancelledBy: data.cancelledBy,
            cancelledByName: data.cancelledByName,
            cancelledAt: data.cancelledAt,
            cancellationReason: data.cancellationReason,
          });
        }
      }
    });
  } catch (resultsErr) {
    console.warn("Results monitoring fetch notice:", resultsErr);
  }

  return Array.from(recordsMap.values()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}
