import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export interface ExamResult {
    id: string;
    studentId: string;
    examId: string;
    examTitle?: string;
    subject?: string;
    totalQuestions?: number;
    correctAnswers?: number;
    wrongAnswers?: number;
    score?: number;
    percentage?: number;
    passed?: boolean;
    submittedAt?: { toDate?: () => Date } | string | null;
}

export const getStudentResults = async (
    studentId: string
): Promise<ExamResult[]> => {
    const resultsReference = collection(
        db,
        "results"
    );

    const resultsQuery = query(
        resultsReference,
        where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(
        resultsQuery
    );

    const results = snapshot.docs.map(
        (resultDocument) =>
            ({
                id: resultDocument.id,
                ...resultDocument.data(),
            }) as ExamResult
    );

    const getTime = (ts?: { toDate?: () => Date } | string | null) => {
        if (!ts) return 0;
        if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
            return ts.toDate().getTime();
        }
        const d = new Date(ts as string);
        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    return results.sort((a, b) => getTime(b.submittedAt) - getTime(a.submittedAt));
};