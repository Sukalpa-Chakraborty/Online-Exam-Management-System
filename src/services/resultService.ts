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
    submittedAt?: any;
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

    return results.sort((a, b) => {
        const aTime =
            a.submittedAt?.toDate?.()?.getTime?.() || 0;

        const bTime =
            b.submittedAt?.toDate?.()?.getTime?.() || 0;

        return bTime - aTime;
    });
};