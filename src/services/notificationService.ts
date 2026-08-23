import { collection, collectionGroup, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebase";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: "exam_published" | "exam_submitted" | "class_grade_updated";
  title: string;
  message: string;
  link?: string;
  read?: boolean;
  createdAt?: { toDate?: () => Date };
}

const writeNotifications = async (items: Omit<AppNotification, "id" | "createdAt">[]) => {
  for (let start = 0; start < items.length; start += 450) {
    const batch = writeBatch(db);
    items.slice(start, start + 450).forEach((item) => batch.set(doc(collection(db, "notifications")), { ...item, read: false, createdAt: serverTimestamp() }));
    await batch.commit();
  }
};

export const notifyStudentsOfPublishedExam = async ({ examId, title, classIds, teacherName }: { examId: string; title: string; classIds?: string[]; teacherName?: string }) => {
  const assignedClasses = classIds || [];
  if (!assignedClasses.length) return;
  const memberLists = await Promise.all(assignedClasses.map((classId) => getDocs(collection(db, "classes", classId, "members"))));
  const studentIds = new Set(memberLists.flatMap((snapshot) => snapshot.docs.map((member) => String(member.data().studentId || member.id))));
  await writeNotifications([...studentIds].map((recipientId) => ({ recipientId, type: "exam_published" as const, title: "New exam available", message: `${teacherName || "Your teacher"} published ${title}.`, link: `/student/exams/${examId}` })));
};

export const notifyTeacherOfSubmission = async ({ teacherId, examTitle, studentName }: { teacherId?: string; examTitle: string; studentName: string }) => {
  if (!teacherId) return;
  await writeNotifications([{ recipientId: teacherId, type: "exam_submitted", title: "New exam submission", message: `${studentName} submitted ${examTitle}.`, link: `/teacher/evaluations` }]);
};

export const notifyAdminsOfClassGrade = async ({ examId, examTitle }: { examId: string; examTitle: string }) => {
  const examSnapshot = await getDocs(query(collection(db, "exams"), where("__name__", "==", examId)));
  const classIds = examSnapshot.docs[0]?.data().classIds as string[] | undefined;
  if (!classIds?.length) return;
  const [admins, resultSnapshots, memberLists] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "admin"))),
    getDocs(collectionGroup(db, "examResults")),
    Promise.all(classIds.map((classId) => getDocs(collection(db, "classes", classId, "members")))),
  ]);
  const memberIds = new Set(memberLists.flatMap((snapshot) => snapshot.docs.map((member) => String(member.data().studentId || member.id))));
  const uniqueFinalResults = new Map<string, number>();
  resultSnapshots.docs.forEach((item) => {
    const result = item.data();
    if (result.examId === examId && memberIds.has(String(result.studentId)) && (result.evaluationStatus === "evaluated" || result.evaluationStatus === "completed")) uniqueFinalResults.set(String(result.studentId), Number(result.percentage || 0));
  });
  if (!uniqueFinalResults.size) return;
  const average = [...uniqueFinalResults.values()].reduce((total, score) => total + score, 0) / uniqueFinalResults.size;
  await writeNotifications(admins.docs.map((admin) => ({ recipientId: admin.id, type: "class_grade_updated" as const, title: "Class grade updated", message: `${examTitle}: class average is ${average.toFixed(1)}% across ${uniqueFinalResults.size} evaluated student${uniqueFinalResults.size === 1 ? "" : "s"}.`, link: "/admin/analytics" })));
};
