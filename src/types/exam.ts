export type QuestionType = "mcq" | "true_false" | "short_answer";

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  } | string[];
  correctAnswer: string;
  marks: number;
}

export type ExamStatus = "draft" | "published" | "completed" | "Published" | "cancelled";

export interface Exam {
  id?: string;
  title: string;
  subject: string;
  description: string;
  teacherId: string;
  teacherName: string;
  duration: number; // In minutes
  totalMarks: number;
  totalQuestions: number;
  startTime: string; // ISO or YYYY-MM-DDTHH:mm
  endTime: string;   // ISO or YYYY-MM-DDTHH:mm
  status: ExamStatus;
  questionCount?: number;
  classIds?: string[];
  questions?: Question[];
  createdAt?: Date;
  updatedAt?: any;
}
