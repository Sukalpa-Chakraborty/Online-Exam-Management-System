import { Link } from "react-router-dom";
import ExamSphereLogo from "../../../components/common/ExamSphereLogo";

export default function Footer() {
  const handleScrollTo = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <ExamSphereLogo size={40} />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ExamSphere
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Online Examination & Assessment System
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Empowering institutions, educators, and candidates with a smarter, simpler, and more secure way to conduct digital examinations.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All platform services operational</span>
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Product */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => handleScrollTo("#features")}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo("#spotlight")}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  >
                    Exam Studio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo("#how-it-works")}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo("#security")}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  >
                    Security & Trust
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo("#faq")}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Roles */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Role Portals
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Teacher Console
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/teacher-code-verification"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Teacher Verification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account & Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Account
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Go to Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 ExamSphere. All rights reserved.</p>
          <p>Engineered for high-integrity digital examinations.</p>
        </div>
      </div>
    </footer>
  );
}
