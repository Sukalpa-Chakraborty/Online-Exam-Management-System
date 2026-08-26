import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/30">
              <AlertTriangle size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              Something went wrong
            </h2>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {this.state.error?.message || "An unexpected application error occurred."}
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
