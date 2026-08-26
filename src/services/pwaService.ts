// PWA Registration and Installation Service

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

/**
 * Registers Service Worker in production. In development, unregisters old workers to prevent Vite HMR caching collisions.
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    if (import.meta.env.DEV) {
      // In development mode, unregister any active service worker so Vite dev server & HMR are never intercepted
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log("Unregistered dev service worker to allow fresh Vite reload.");
            }
          });
        }
      });
      return;
    }

    // Production registration
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("ExamSphere ServiceWorker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("ExamSphere ServiceWorker registration skipped/failed:", err);
        });
    });

    // Capture install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      installListeners.forEach((listener) => listener(true));
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      installListeners.forEach((listener) => listener(false));
    });
  }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void) {
  installListeners.add(callback);
  callback(Boolean(deferredPrompt));
  return () => {
    installListeners.delete(callback);
  };
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installListeners.forEach((listener) => listener(false));
    return choice.outcome === "accepted";
  } catch (error) {
    console.warn("PWA install error:", error);
    return false;
  }
}
