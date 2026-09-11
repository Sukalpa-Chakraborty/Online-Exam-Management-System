import type { ReactNode } from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ================= LANDING ================= */

import LandingPage from "../pages/landing/LandingPage";

/* ================= AUTH ================= */

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import TeacherCodeVerification from "../pages/auth/TeacherCodeVerification";

/* ================= STUDENT ================= */

import StudentDashboard from "../pages/student/StudentDashboard";
import AvailableExams from "../pages/student/AvailableExams";
import ExamDetails from "../pages/student/ExamDetails";
import AttemptExam from "../pages/student/AttemptExam";
import ResultPage from "../pages/student/ResultPage";
import MyResults from "../pages/student/Myresults";
import ExamHistory from "../pages/student/ExamHistory";
import MyClasses from "../pages/student/MyClasses";

/* ================= TEACHER ================= */

import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import CreateExam from "../pages/teacher/CreateExam";
import MyExams from "../pages/teacher/MyExams";
import EditExam from "../pages/teacher/EditExam";
import AddQuestions from "../pages/teacher/AddQuestions";
import AddQuestion from "../pages/teacher/AddQuestion";
import QuestionBank from "../pages/teacher/QuestionBank";
import EditQuestion from "../pages/teacher/EditQuestion";
import EvaluateShortAnswers from "../pages/teacher/EvaluateShortAnswers";
import Classes from "../pages/teacher/Classes";
import ClassDetails from "../pages/teacher/ClassDetails";
import Analytics from "../pages/teacher/Analytics";
import TeacherMonitoring from "../pages/teacher/TeacherMonitoring";

/* ================= ADMIN ================= */

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserDetails from "../pages/admin/AdminUserDetails";
import AdminClasses from "../pages/admin/AdminClasses";
import AdminExams from "../pages/admin/AdminExams";
import AdminMonitoring from "../pages/admin/AdminMonitoring";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminActivityLogs from "../pages/admin/AdminActivityLogs";

/* ================= PROFILE ================= */

import EditProfile from "../pages/profile/EditProfile";

/* ================= PROTECTED ROUTE ================= */

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin")[];
}

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    user,
    userProfile,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs font-medium text-slate-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (allowedRoles && !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs font-medium text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile?.status === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (
    userProfile?.role === "teacher" &&
    allowedRoles?.includes("teacher") &&
    sessionStorage.getItem("teacherVerifiedUid") !== user.uid
  ) {
    return <Navigate to="/teacher-code-verification" replace />;
  }

  if (
    allowedRoles &&
    userProfile &&
    !allowedRoles.includes(userProfile.role)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* ================= ROLE DASHBOARD ================= */

function RoleDashboard() {
  const {
    user,
    userProfile,
  } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userProfile.status === "disabled") {
    return <Navigate to="/login" replace />;
  }

  if (userProfile.role === "teacher") {
    return (
      <Navigate
        to="/teacher/dashboard"
        replace
      />
    );
  }

  if (userProfile.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/student/dashboard"
      replace
    />
  );
}

/* ================= APP ROUTES ================= */

function AppRoutes() {
  return (
    <Routes>
      {/* DEFAULT LANDING */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* AUTH */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/teacher-code-verification"
        element={<TeacherCodeVerification />}
      />

      {/* ROLE DASHBOARD */}

      <Route
        path="/dashboard"
        element={<RoleDashboard />}
      />

      {/* ================= STUDENT ================= */}

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exams"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AvailableExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exams/:examId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ExamDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exams/:examId/attempt"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AttemptExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exams/:examId/result"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ResultPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/history"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ExamHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/classes"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyClasses />
          </ProtectedRoute>
        }
      />

      {/* ================= TEACHER ================= */}

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* CREATE EXAM */}

      <Route
        path="/teacher/create-exam"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <CreateExam />
          </ProtectedRoute>
        }
      />

      {/* MY EXAMS */}

      <Route
        path="/teacher/exams"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <MyExams />
          </ProtectedRoute>
        }
      />

      {/* EDIT EXAM */}

      <Route
        path="/teacher/exams/:examId/edit"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <EditExam />
          </ProtectedRoute>
        }
      />

      {/* EXAM QUESTIONS */}

      <Route
        path="/teacher/exams/:examId/questions"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <AddQuestions />
          </ProtectedRoute>
        }
      />

      {/* ADD QUESTION TO EXAM */}

      <Route
        path="/teacher/exams/:examId/questions/add"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <AddQuestion />
          </ProtectedRoute>
        }
      />

      {/* ADD QUESTION TO EXAM - COMPATIBILITY ROUTE */}

      <Route
        path="/teacher/exams/:examId/add-question"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <AddQuestion />
          </ProtectedRoute>
        }
      />

      {/* OLD EXAM QUESTIONS URL */}

      <Route
        path="/exams/:examId/questions"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <AddQuestions />
          </ProtectedRoute>
        }
      />

      {/* QUESTION BANK */}

      <Route
        path="/teacher/questions"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <QuestionBank />
          </ProtectedRoute>
        }
      />

      {/* ADD QUESTION TO QUESTION BANK */}

      <Route
        path="/teacher/questions/add"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <AddQuestion />
          </ProtectedRoute>
        }
      />

      {/* EDIT QUESTION BANK QUESTION */}

      <Route
        path="/teacher/questions/:questionId/edit"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <EditQuestion />
          </ProtectedRoute>
        }
      />

      {/* TEACHER CLASSES */}

      <Route
        path="/teacher/classes"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Classes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/classes/:classId"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <ClassDetails />
          </ProtectedRoute>
        }
      />

      {/* EVALUATE ANSWERS */}

      <Route
        path="/teacher/evaluations"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <EvaluateShortAnswers />
          </ProtectedRoute>
        }
      />

      {/* TEACHER MONITORING */}

      <Route
        path="/teacher/monitoring"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherMonitoring />
          </ProtectedRoute>
        }
      />

      {/* TEACHER ANALYTICS */}

      <Route
        path="/teacher/analytics"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUserDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminClasses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/exams"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/monitoring"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMonitoring />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/activity-logs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminActivityLogs />
          </ProtectedRoute>
        }
      />

      {/* ================= PROFILE ================= */}

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* UNKNOWN ROUTES */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
      </Routes>
  );
}

export default AppRoutes;
