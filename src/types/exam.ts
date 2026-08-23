export type QuestionType = "mcq" | "true_false";

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  marks: number;
}

export interface Exam {
  id?: string;
  title: string;
  subject: string;
  description: string;
  teacherId: string;
  teacherName: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  status: "draft" | "published" | "completed" | "Published";
  questionCount?: number;
  classIds?: string[];
  questions: Question[];
  createdAt?: Date;
}
