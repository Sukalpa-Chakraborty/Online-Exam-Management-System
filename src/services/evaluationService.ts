import {
  collectionGroup,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { notifyAdminsOfClassGrade } from "./notificationService";

export type EvaluationStatus = "pending" | "partially_evaluated" | "evaluated" | "completed";

export interface ResultQuestion {
  id: string;
  question: string;
  type: "mcq" | "true_false" | "short_answer";
  correctAnswer?: string;
  selectedAnswer?: string;
  marks: number;
  awardedMarks: number;
  feedback?: string;
  evaluationStatus: "auto_evaluated" | "pending" | "evaluated";
  isCorrect: boolean | null;
}

export interface EvaluationResult {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  examId: string;
  examTitle: string;
  subject?: string;
  teacherId?: string;
  questions: ResultQuestion[];
  evaluationStatus: EvaluationStatus;
  pendingEvaluationCount: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAt?: { toDate?: () => Date };
}

export const getTeacherEvaluationResults = async (teacherId: string) => {
  // A filtered collection-group query requires a Firestore composite index.
  // Read the result documents and apply the teacher boundary locally so this
  // screen works immediately without any Firebase Console configuration.
  const snapshot = await getDocs(collectionGroup(db, "examResults"));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as EvaluationResult)
    .filter((result) => result.teacherId === teacherId)
    .filter((result) => result.questions?.length);
};

export const saveShortAnswerEvaluation = async ({
  teacherId,
  studentId,
  examId,
  questionId,
  awardedMarks,
  feedback,
}: {
  teacherId: string;
  studentId: string;
  examId: string;
  questionId: string;
  awardedMarks: number;
  feedback?: string;
}) => {
  if (!Number.isFinite(awardedMarks) || awardedMarks < 0) {
    throw new Error("Awarded marks must be a non-negative number.");
  }

  const examRef = doc(db, "exams", examId);
  const resultRef = doc(db, "users", studentId, "examResults", examId);

  const isFullyEvaluated = await runTransaction(db, async (transaction) => {
    const [examSnapshot, resultSnapshot] = await Promise.all([
      transaction.get(examRef),
      transaction.get(resultRef),
    ]);

    if (!examSnapshot.exists() || examSnapshot.data().teacherId !== teacherId) {
      throw new Error("You can only evaluate submissions for your own exams.");
    }
    if (!resultSnapshot.exists()) throw new Error("Submission no longer exists.");

    const data = resultSnapshot.data() as EvaluationResult;
    if (data.teacherId && data.teacherId !== teacherId) {
      throw new Error("This submission does not belong to your exam.");
    }

    const question = data.questions.find((item) => item.id === questionId);
    if (!question || question.type !== "short_answer") throw new Error("Short-answer question not found.");
    if (question.evaluationStatus !== "pending") throw new Error("This answer has already been evaluated.");
    if (awardedMarks > Number(question.marks)) {
      throw new Error(`Marks cannot exceed the maximum of ${question.marks}.`);
    }

    const questions = data.questions.map((item) => item.id === questionId
      ? { ...item, awardedMarks, feedback: feedback?.trim() || "", evaluationStatus: "evaluated" as const }
      : item);
    const pendingEvaluationCount = questions.filter((item) => item.type === "short_answer" && item.evaluationStatus === "pending").length;
    const obtainedMarks = questions.reduce((total, item) => total + Number(item.awardedMarks || 0), 0);
    const totalMarks = questions.reduce((total, item) => total + Number(item.marks || 0), 0);
    const percentage = totalMarks ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;
    const evaluationStatus: EvaluationStatus = pendingEvaluationCount === 0
      ? "evaluated"
      : pendingEvaluationCount === questions.filter((item) => item.type === "short_answer").length
        ? "pending"
        : "partially_evaluated";

    transaction.update(resultRef, {
      questions,
      pendingEvaluationCount,
      obtainedMarks,
      totalMarks,
      percentage,
      evaluationStatus,
      evaluatedAt: serverTimestamp(),
    });
    return evaluationStatus === "evaluated";
  });

  if (isFullyEvaluated) {
    void notifyAdminsOfClassGrade({ examId, examTitle: "An exam" }).catch((error) => console.error("Admin grade notification failed:", error));
  }
};
