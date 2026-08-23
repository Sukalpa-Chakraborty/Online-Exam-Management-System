import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import type { Exam } from "../types/exam";

const examsCollection = collection(db, "exams");

/* ================= CREATE EXAM ================= */

export const createExam = async (
  exam: Exam
): Promise<string> => {
  const examData = {
    ...exam,
    status: exam.status || "published",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentReference = await addDoc(
    examsCollection,
    examData
  );

  return documentReference.id;
};

/* ================= GET ALL EXAMS ================= */

export const getAllExams = async (): Promise<Exam[]> => {
  const snapshot = await getDocs(examsCollection);

  const exams = snapshot.docs.map(
    (examDocument) =>
      ({
        id: examDocument.id,
        ...examDocument.data(),
      }) as Exam
  );

  return exams;
};

/* ================= GET AVAILABLE EXAMS ================= */

export const getAvailableExams = async (): Promise<Exam[]> => {
  const snapshot = await getDocs(examsCollection);

  const exams = snapshot.docs
    .map(
      (examDocument) =>
        ({
          id: examDocument.id,
          ...examDocument.data(),
        }) as Exam
    )
    .filter((exam) => {
      // Show exams that are published.
      // Also supports old exams where status may not exist.
      return (
        !exam.status ||
        exam.status === "published" ||
        exam.status === "Published"
      );
    });

  return exams;
};

/* ================= GET EXAM BY ID ================= */

export const getExamById = async (
  examId: string
): Promise<Exam | null> => {
  const examReference = doc(
    db,
    "exams",
    examId
  );

  const snapshot = await getDoc(
    examReference
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Exam;
};

/* ================= UPDATE EXAM ================= */

export const updateExam = async (
  examId: string,
  updatedData: Partial<Exam>
): Promise<void> => {
  const examReference = doc(
    db,
    "exams",
    examId
  );

  await updateDoc(examReference, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });
};

export const getExamAttemptCount = async (examId: string): Promise<number> => {
  try {
    const snapshot = await getDocs(collectionGroup(db, "examResults"));
    return new Set(
      snapshot.docs
        .map((item) => item.data())
        .filter((result) => result.examId === examId)
        .map((result) => String(result.studentId || ""))
        .filter(Boolean)
    ).size;
  } catch (error) {
    console.warn("Attempt count check skipped:", error);
    return 0;
  }
};

export const deleteExamSafely = async (
  examId: string,
  teacherId?: string
): Promise<void> => {
  const examRef = doc(db, "exams", examId);
  const examSnapshot = await getDoc(examRef);

  if (!examSnapshot.exists()) {
    return;
  }

  const examData = examSnapshot.data();
  if (teacherId && examData.teacherId && examData.teacherId !== teacherId) {
    throw new Error("You can only delete your own exams.");
  }

  // Delete questions subcollection if present
  try {
    const questionsSnapshot = await getDocs(
      collection(db, "exams", examId, "questions")
    );
    if (!questionsSnapshot.empty) {
      const batch = writeBatch(db);
      questionsSnapshot.docs.forEach((question) => batch.delete(question.ref));
      await batch.commit();
    }
  } catch (questionsError) {
    console.warn("Questions cleanup issue:", questionsError);
  }

  // Delete the main exam document
  await deleteDoc(examRef);
};

export const duplicateExam = async (
  examId: string,
  teacherId: string
): Promise<string> => {
  const originalRef = doc(db, "exams", examId);
  const originalSnapshot = await getDoc(originalRef);

  if (!originalSnapshot.exists() || (teacherId && originalSnapshot.data().teacherId && originalSnapshot.data().teacherId !== teacherId)) {
    throw new Error("You can only duplicate your own exams.");
  }

  const original = originalSnapshot.data() as Exam;
  const newExamId = await createExam({
    ...original,
    title: `${original.title || "Untitled Exam"} (Copy)`,
    status: "draft",
    totalQuestions: 0,
    questionCount: 0,
    totalMarks: 0,
    questions: [],
  });

  try {
    const questionsSnapshot = await getDocs(
      collection(db, "exams", examId, "questions")
    );
    if (!questionsSnapshot.empty) {
      const batch = writeBatch(db);
      let totalMarks = 0;
      questionsSnapshot.docs.forEach((question) => {
        const data = question.data();
        totalMarks += Number(data.marks || 0);
        batch.set(doc(collection(db, "exams", newExamId, "questions")), data);
      });
      batch.update(doc(db, "exams", newExamId), {
        totalQuestions: questionsSnapshot.size,
        questionCount: questionsSnapshot.size,
        totalMarks,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    }
  } catch (questionsError) {
    console.warn("Questions duplication error:", questionsError);
  }

  return newExamId;
};
