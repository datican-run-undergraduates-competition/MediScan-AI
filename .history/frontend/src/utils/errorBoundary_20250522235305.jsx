import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Custom error boundary component with fallback UI and error reporting
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Capture error details for logging
    this.setState({ errorInfo });
    
    // Report to Sentry if available
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { extra: errorInfo });
    }
    
    // Log to console in development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    const { fallback, children, resetKeys = [] } = this.props;
    
    // If there's an error, render the fallback UI
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.resetErrorBoundary) 
          : fallback;
      }
      
      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mb-4 text-gray-700">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <pre className="p-3 mb-4 overflow-auto text-sm bg-gray-100 rounded-md">
              {this.state.error?.stack?.slice(0, 200) + '...'}
            </pre>
            <button
              onClick={this.resetErrorBoundary}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return children;
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
}

/**
 * Higher-order component to wrap components with ErrorBoundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps) => {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WithErrorBoundary = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
};

export default ErrorBoundary; 
