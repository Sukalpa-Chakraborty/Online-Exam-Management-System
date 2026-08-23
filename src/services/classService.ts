import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

export interface ClassBatch {
  id: string;
  name: string;
  description?: string;
  code: string;
  teacherId: string;
  teacherName?: string;
  createdAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
}

export interface ClassMember {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  joinedAt?: { toDate?: () => Date };
}

const codeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () => Array.from({ length: 8 }, () => codeCharacters[Math.floor(Math.random() * codeCharacters.length)]).join("");

export const getTeacherClasses = async (teacherId: string) => {
  const snapshot = await getDocs(query(collection(db, "classes"), where("teacherId", "==", teacherId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ClassBatch);
};

export const createClass = async ({ name, description, teacherId, teacherName }: Omit<ClassBatch, "id" | "code" | "createdAt" | "updatedAt">) => {
  if (!name.trim()) throw new Error("Class name is required.");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const classRef = doc(collection(db, "classes"));
    const codeRef = doc(db, "classCodes", code);
    try {
      await runTransaction(db, async (transaction) => {
        if ((await transaction.get(codeRef)).exists()) throw new Error("CODE_EXISTS");
        transaction.set(classRef, { name: name.trim(), description: description?.trim() || "", code, teacherId, teacherName: teacherName || "Teacher", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        transaction.set(codeRef, { classId: classRef.id, teacherId, createdAt: serverTimestamp() });
      });
      return classRef.id;
    } catch (error) {
      if (error instanceof Error && error.message === "CODE_EXISTS") continue;
      throw error;
    }
  }
  throw new Error("Could not create a unique class code. Please try again.");
};

export const getClassById = async (classId: string) => {
  const snapshot = await getDoc(doc(db, "classes", classId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as ClassBatch) : null;
};

export const getClassMembers = async (classId: string) => {
  const snapshot = await getDocs(collection(db, "classes", classId, "members"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ClassMember);
};

export const getStudentClasses = async (studentId: string) => {
  const snapshot = await getDocs(collection(db, "users", studentId, "classes"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ClassBatch);
};

export const joinClassByCode = async ({ code, studentId, studentName, studentEmail }: { code: string; studentId: string; studentName: string; studentEmail: string }) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) throw new Error("Enter a class code.");
  const codeRef = doc(db, "classCodes", normalizedCode);
  await runTransaction(db, async (transaction) => {
    const codeSnapshot = await transaction.get(codeRef);
    if (!codeSnapshot.exists()) throw new Error("Class code not found.");
    const classRef = doc(db, "classes", String(codeSnapshot.data().classId));
    const classSnapshot = await transaction.get(classRef);
    if (!classSnapshot.exists()) throw new Error("This class is no longer available.");
    const classData = classSnapshot.data() as Omit<ClassBatch, "id">;
    const memberRef = doc(db, "classes", classRef.id, "members", studentId);
    const studentClassRef = doc(db, "users", studentId, "classes", classRef.id);
    if ((await transaction.get(memberRef)).exists()) throw new Error("You have already joined this class.");
    transaction.set(memberRef, { studentId, studentName, studentEmail, joinedAt: serverTimestamp() });
    transaction.set(studentClassRef, { classId: classRef.id, name: classData.name, description: classData.description || "", code: classData.code, teacherId: classData.teacherId, teacherName: classData.teacherName || "Teacher", joinedAt: serverTimestamp() });
    transaction.update(classRef, { updatedAt: serverTimestamp() });
  });
};

export const updateClass = async (classId: string, teacherId: string, data: Pick<ClassBatch, "name" | "description">) => {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "classes", classId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || snapshot.data().teacherId !== teacherId) throw new Error("You cannot edit this class.");
    transaction.update(ref, { name: data.name.trim(), description: data.description?.trim() || "", updatedAt: serverTimestamp() });
  });
};

export const deleteClass = async (classId: string, teacherId: string) => {
  const classRef = doc(db, "classes", classId);
  const classSnapshot = await getDoc(classRef);
  if (!classSnapshot.exists() || classSnapshot.data().teacherId !== teacherId) throw new Error("You cannot delete this class.");
  const [members, assignedExams] = await Promise.all([
    getDocs(collection(db, "classes", classId, "members")),
    getDocs(query(collection(db, "exams"), where("classIds", "array-contains", classId))),
  ]);
  if (!members.empty) throw new Error("Remove all students before deleting this class.");
  if (!assignedExams.empty) throw new Error("Unassign this class from its exams before deleting it.");
  await Promise.all([deleteDoc(classRef), deleteDoc(doc(db, "classCodes", String(classSnapshot.data().code)))]);
};

export const leaveClass = async (classId: string, studentId: string) => {
  const attempts = await getDocs(collection(db, "users", studentId, "examResults"));
  const examSnapshot = await getDocs(collection(db, "exams"));
  const assignedExamIds = new Set(examSnapshot.docs.filter((item) => (item.data().classIds || []).includes(classId)).map((item) => item.id));
  if (attempts.docs.some((item) => assignedExamIds.has(String(item.data().examId)))) throw new Error("You cannot leave this class because you have an exam attempt in it.");
  await Promise.all([deleteDoc(doc(db, "classes", classId, "members", studentId)), deleteDoc(doc(db, "users", studentId, "classes", classId))]);
};

export const removeStudentFromClass = async (classId: string, studentId: string, teacherId: string) => {
  const classBatch = await getClassById(classId);
  if (!classBatch || classBatch.teacherId !== teacherId) throw new Error("You cannot manage this class.");
  await leaveClass(classId, studentId);
};
