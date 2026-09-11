import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Shield,
  Layers,
  HelpCircle,
  Cpu,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import ExamSphereLogo from "../../../components/common/ExamSphereLogo";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features", icon: Layers },
    { label: "Spotlight", href: "#spotlight", icon: Cpu },
    { label: "Roles", href: "#roles", icon: Users },
    { label: "How It Works", href: "#how-it-works", icon: Sparkles },
    { label: "Security", href: "#security", icon: Shield },
    { label: "FAQ", href: "#faq", icon: HelpCircle },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-xs shadow-slate-900/5 dark:shadow-black/20"
          : "border-b border-transparent bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="group flex items-center gap-3 focus:outline-none"
          aria-label="ExamSphere Home"
        >
          <ExamSphereLogo size={42} className="transition-transform duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ExamSphere
              </span>
              <span className="rounded-md bg-blue-600/10 dark:bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
              Next-Gen Examination Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60 px-3 py-1.5 backdrop-blur-md">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>

          {/* Dynamic Auth Buttons */}
          {user ? (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition duration-200 cursor-pointer"
            >
              <LayoutDashboard size={15} />
              <span>Go to Dashboard</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full uppercase">
                {userProfile?.role || "User"}
              </span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition duration-200 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open mobile menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:hidden transition cursor-pointer"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-5 md:hidden space-y-3 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer"
                >
                  <Icon size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/dashboard");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                <LayoutDashboard size={15} />
                <span>Go to Dashboard ({userProfile?.role || "User"})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
