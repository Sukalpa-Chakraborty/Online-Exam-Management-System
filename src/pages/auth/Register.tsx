import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  UserCheck,
  UserRound,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import {
  loginWithGoogle,
  registerUser,
} from "../../services/authService";
import type { UserRole } from "../../types/user";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  // Student fields
  const [rollNumber, setRollNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");

  // Teacher field
  const [teacherCode, setTeacherCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Student validation
    if (role === "student") {
      if (!rollNumber.trim()) {
        setError("Please enter your roll number.");
        return;
      }

      if (!collegeName.trim()) {
        setError("Please enter your college name.");
        return;
      }
    }

    // Teacher validation
    if (role === "teacher") {
      if (!teacherCode.trim()) {
        setError("Please create your teacher special code.");
        return;
      }

      if (teacherCode.trim().length < 4) {
        setError("Teacher special code must contain at least 4 characters.");
        return;
      }
    }

    try {
      setLoading(true);

      await registerUser(
        name.trim(),
        email.trim(),
        password,
        role,
        {
          rollNumber: rollNumber.trim(),
          collegeName: collegeName.trim(),
          teacherCode: teacherCode.trim(),
        }
      );

      navigate("/dashboard");
    } catch (registerError) {
      console.error(registerError);
      setError("Unable to create your account. The email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");

    if (role === "teacher") {
      setError(
        "Teacher registration with Google requires additional profile details. Please register using email and password."
      );
      return;
    }

    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (googleError) {
      console.error(googleError);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to start using ExamSphere today."
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Segmented Role Selector */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          Account Type
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleRoleChange("student")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              role === "student"
                ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("teacher")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              role === "teacher"
                ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck size={16} />
            <span>Teacher</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
      </button>

      <div className="my-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200/80" />
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Or register with email
        </span>
        <div className="h-px flex-1 bg-slate-200/80" />
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Full Name
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Student Fields */}
        {role === "student" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Roll Number
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                placeholder="Roll number"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                College Name
              </label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={collegeName}
                  onChange={(event) => setCollegeName(event.target.value)}
                  placeholder="College"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Teacher Special Code */}
        {role === "teacher" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Create Teacher Code
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={teacherCode}
                onChange={(event) => setTeacherCode(event.target.value)}
                placeholder="4+ character special code"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Required each time you sign in to confirm teacher privileges.
            </p>
          </div>
        )}

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;