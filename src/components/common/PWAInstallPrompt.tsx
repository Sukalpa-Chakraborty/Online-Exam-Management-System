import { useEffect, useState } from "react";
import { Download, Wifi, WifiOff, X } from "lucide-react";
import {
  promptPWAInstall,
  subscribeToInstallPrompt,
} from "../../services/pwaService";

export function PWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("examsphere_pwa_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showNetworkToast, setShowNetworkToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToInstallPrompt(setCanInstall);
    return () => unsubscribe();
  }, []);

  // Online / Offline Status Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkToast(true);
      const timer = setTimeout(() => setShowNetworkToast(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkToast(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    const installed = await promptPWAInstall();
    if (installed) {
      setCanInstall(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("examsphere_pwa_dismissed", "true");
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  };

  return (
    <>
      {/* Network Status Notification Toast */}
      {showNetworkToast && (
        <div
          role="status"
          className={`fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isOnline
              ? "border border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
              : "border border-amber-500/30 bg-amber-950/90 text-amber-200"
          }`}
        >
          {isOnline ? (
            <Wifi size={16} className="text-emerald-400" />
          ) : (
            <WifiOff size={16} className="text-amber-400 animate-pulse" />
          )}
          <span>
            {isOnline
              ? "Connection restored. Synchronization active."
              : "You are offline. Active exam answers are saved locally."}
          </span>
          <button
            type="button"
            onClick={() => setShowNetworkToast(false)}
            className="ml-2 rounded p-0.5 hover:bg-white/10 text-white/60 hover:text-white"
            aria-label="Dismiss toast"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Subtle PWA Install Banner */}
      {canInstall && !isDismissed && (
        <aside
          aria-label="Install ExamSphere App"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-slate-900/95 p-3.5 text-white shadow-2xl shadow-blue-950/50 backdrop-blur-xl transition-all duration-300"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <Download size={18} />
          </div>

          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white">Install ExamSphere App</p>
            <p className="text-[11px] text-slate-400">
              Access exams faster and offline
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95 cursor-pointer"
          >
            Install
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </>
  );
}
