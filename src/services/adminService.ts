import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { ClassBatch } from "./classService";
import type { UserProfile, UserRole } from "../types/user";

export interface AdminUser extends UserProfile { id: string; status: "active" | "disabled"; }
export interface AdminExam { id: string; title?: string; subject?: string; teacherId?: string; teacherName?: string; classIds?: string[]; status?: string; questionCount?: number; totalQuestions?: number; createdAt?: { toDate?: () => Date }; }
export interface AdminResult { id: string; studentId?: string; studentName?: string; studentEmail?: string; examId?: string; examTitle?: string; teacherId?: string; percentage?: number; evaluationStatus?: string; submittedAt?: { toDate?: () => Date }; }
export interface AdminActivity { id: string; adminId?: string; adminName?: string; actionType?: string; targetType?: string; targetId?: string; details?: string; createdAt?: { toDate?: () => Date }; }

const timestamp = (value?: { toDate?: () => Date }) => value?.toDate?.().getTime?.() || 0;
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as object), status: item.data().status === "disabled" ? "disabled" as const : "active" as const }) as AdminUser).sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
};

export const getAdminExams = async (): Promise<AdminExam[]> => {
  const snapshot = await getDocs(collection(db, "exams"));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as object) }) as AdminExam).sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
};

export const getAdminClasses = async (): Promise<ClassBatch[]> => {
  const snapshot = await getDocs(collection(db, "classes"));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as object) }) as ClassBatch).sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
};

export const getAdminResults = async (): Promise<AdminResult[]> => {
  const snapshot = await getDocs(collectionGroup(db, "examResults"));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as object) }) as AdminResult).sort((a, b) => timestamp(b.submittedAt) - timestamp(a.submittedAt));
};

export const getAdminActivities = async (): Promise<AdminActivity[]> => {
  const snapshot = await getDocs(query(collection(db, "adminActivity"), orderBy("createdAt", "desc"), limit(100)));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as object) }) as AdminActivity);
};

const assertAdmin = async (adminId: string) => {
  const snapshot = await getDoc(doc(db, "users", adminId));
  if (!snapshot.exists() || snapshot.data().role !== "admin" || snapshot.data().status === "disabled") throw new Error("Admin access is required.");
  return snapshot.data() as UserProfile;
};

const recordActivity = async ({ adminId, adminName, actionType, targetType, targetId, details }: Omit<AdminActivity, "id" | "createdAt">) => {
  await runTransaction(db, async (transaction) => {
    transaction.set(doc(collection(db, "adminActivity")), { adminId, adminName: adminName || "Admin", actionType, targetType, targetId, details, createdAt: serverTimestamp() });
  });
};

export const setUserApplicationStatus = async ({ adminId, adminName, targetUser, nextStatus }: { adminId: string; adminName?: string; targetUser: AdminUser; nextStatus: "active" | "disabled" }) => {
  await assertAdmin(adminId);
  if (targetUser.role === "admin") throw new Error("Admin accounts cannot be disabled from the application.");
  await updateDoc(doc(db, "users", targetUser.id), { status: nextStatus, updatedAt: serverTimestamp() });
  await recordActivity({ adminId, adminName, actionType: nextStatus === "disabled" ? "user_disabled" : "user_enabled", targetType: "user", targetId: targetUser.id, details: `${targetUser.name || targetUser.email || "User"} was ${nextStatus}.` });
};

export const updateExamAdministrationStatus = async ({ adminId, adminName, exam, nextStatus }: { adminId: string; adminName?: string; exam: AdminExam; nextStatus: "draft" | "archived" }) => {
  await assertAdmin(adminId);
  await updateDoc(doc(db, "exams", exam.id), { status: nextStatus, updatedAt: serverTimestamp() });
  await recordActivity({ adminId, adminName, actionType: nextStatus === "archived" ? "exam_archived" : "exam_unpublished", targetType: "exam", targetId: exam.id, details: `${exam.title || "Exam"} was ${nextStatus}.` });
};

export const getAdminUserDetails = async (userId: string) => {
  const userSnapshot = await getDoc(doc(db, "users", userId));
  if (!userSnapshot.exists()) return null;
  const profile = { id: userSnapshot.id, ...userSnapshot.data() } as AdminUser;
  if (profile.role === "student") {
    const [classes, results] = await Promise.all([getDocs(collection(db, "users", userId, "classes")), getDocs(collection(db, "users", userId, "examResults"))]);
    return { profile, classes: classes.size, exams: results.size, published: 0 };
  }
  const [classes, exams] = await Promise.all([getDocs(query(collection(db, "classes"), where("teacherId", "==", userId))), getDocs(query(collection(db, "exams"), where("teacherId", "==", userId)))]);
  return { profile, classes: classes.size, exams: exams.size, published: exams.docs.filter((item) => item.data().status === "published").length };
};

export const roleLabel = (role?: UserRole) => role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Unknown";
