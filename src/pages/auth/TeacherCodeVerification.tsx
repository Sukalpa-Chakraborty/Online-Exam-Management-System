import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { logoutUser } from "../../services/authService";

function TeacherCodeVerification() {
  const navigate = useNavigate();

  const {
    user,
    userProfile,
    loading,
  } = useAuth();

  const [teacherCode, setTeacherCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");

    if (!user) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    if (!teacherCode.trim()) {
      setError("Please enter your teacher verification code.");
      return;
    }

    try {
      setVerifying(true);

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError("Teacher profile was not found.");
        return;
      }

      const profileData = userDoc.data();

      if (profileData.role !== "teacher") {
        setError("This account is not registered as a teacher.");
        return;
      }

      const savedTeacherCode = profileData.teacherCode || "";

      if (teacherCode.trim() !== savedTeacherCode) {
        setError("Incorrect teacher verification code.");
        return;
      }

      sessionStorage.setItem("teacherVerifiedUid", user.uid);
      sessionStorage.removeItem("teacherVerificationPending");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Teacher verification failed:", err);
      setError("Unable to verify your code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      sessionStorage.removeItem("teacherVerificationPending");
      sessionStorage.removeItem("teacherVerifiedUid");
      await logoutUser();
      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error("Failed to return to login:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  if (!user || userProfile?.role !== "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Verification Not Available
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            This verification step is only required for teacher accounts.
          </p>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Teacher Verification"
      subtitle="Enter your verification code to access your teacher portal."
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-900">
              Welcome, {userProfile.name || "Teacher"}
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Please enter the special 4+ character verification code set during registration.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          Teacher Special Code
        </label>

        <div className="relative">
          <LockKeyhole
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="password"
            value={teacherCode}
            onChange={(event) => setTeacherCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleVerify();
              }
            }}
            placeholder="Enter your verification code"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={verifying}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Verify & Enter Dashboard</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleBackToLogin}
        disabled={verifying}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <ArrowLeft size={15} />
        <span>Back to Sign In</span>
      </button>
    </AuthLayout>
  );
}

export default TeacherCodeVerification;