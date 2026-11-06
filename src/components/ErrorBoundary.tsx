import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo): void {
    // Intentionally suppress stack traces in user-facing UI (A5 Client-Side Data Exposure)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6 py-12">
          <div
            role="alert"
            className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-7 shadow-xs text-center space-y-5"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 text-amber-700" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-lg font-bold text-slate-900">
                Unable to render this view
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected application state occurred while loading this page. Your saved skill
                profile and checklist progress are intact.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-display font-semibold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to Overview</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
