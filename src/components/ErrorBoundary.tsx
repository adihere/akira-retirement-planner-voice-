import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * This prevents the entire application from crashing and showing a blank white screen,
 * providing a better user experience with graceful degradation.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly state: ErrorBoundaryState;
  readonly props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static lifecycle method called when an error is thrown in a child component.
   * Updates state to trigger the fallback UI.
   * 
   * @param error - The error that was thrown
   * @returns Updated state with hasError set to true
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Logs the error details to the console for debugging purposes.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Additional information about the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);
    console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack);
  }

  /**
   * Handles the refresh button click to reload the page and recover from the error.
   */
  handleRefresh = (): void => {
    window.location.reload();
  };

  /**
   * Renders the fallback error UI when an error has been caught.
   * Shows error details only in development mode for debugging.
   * 
   * @returns The error UI component
   */
  renderErrorUI(): ReactNode {
    const { error } = this.state;
    const isDevelopment = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-olive/10 p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-olive/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-olive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Heading */}
          <h1 className="text-3xl font-serif text-olive mb-4">
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            We apologize for the inconvenience. An unexpected error occurred. 
            Please try refreshing the page to continue.
          </p>

          {/* Refresh Button */}
          <button
            onClick={this.handleRefresh}
            className="inline-flex items-center justify-center px-8 py-3 bg-olive text-white font-medium rounded-full hover:bg-olive-light transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Page
          </button>

          {/* Error Details - Development Only */}
          {isDevelopment && error && (
            <div className="mt-8 text-left">
              <details className="bg-warm-white rounded-xl border border-olive/10 overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-olive hover:bg-olive/5 transition-colors">
                  Error Details (Development Only)
                </summary>
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-olive-light uppercase tracking-wider mb-1">
                        Error Message
                      </h4>
                      <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border border-gray-200">
                        {error.message}
                      </p>
                    </div>
                    {error.stack && (
                      <div>
                        <h4 className="text-xs font-semibold text-olive-light uppercase tracking-wider mb-1">
                          Stack Trace
                        </h4>
                        <pre className="text-xs text-gray-600 font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* Support Message */}
          <p className="mt-6 text-sm text-olive-light">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Renders the children if no error has occurred, otherwise renders the error UI.
   * 
   * @returns Either the children or the error UI
   */
  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
