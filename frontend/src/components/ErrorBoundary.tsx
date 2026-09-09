import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // swap for a real logging service later (Sentry, etc.)
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-xl font-bold">Something went wrong.</h1>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
