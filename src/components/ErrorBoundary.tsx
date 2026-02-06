import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-2">Something went wrong</h2>
                <p className="text-red-700 mb-4">An error occurred while rendering the application.</p>
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-red-800 hover:underline">
                    Error Details
                  </summary>
                  <pre className="mt-2 bg-white p-3 rounded border border-red-200 text-xs overflow-auto max-h-64">
                    {this.state.error?.toString()}
                  </pre>
                </details>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
