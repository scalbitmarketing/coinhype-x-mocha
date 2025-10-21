import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-panel p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-300 mb-6">
              We encountered an unexpected error. Don't worry, your balance is safe. 
              Try refreshing the page or go back to the home screen.
            </p>

            <div className="space-y-3">
              <motion.button
                onClick={this.handleRefresh}
                className="w-full neon-button py-3 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </motion.button>

              <motion.button
                onClick={this.handleGoHome}
                className="w-full p-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="w-5 h-5" />
                <span>Go Home</span>
              </motion.button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-300 bg-red-900/20 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GameErrorFallback({ 
  resetError, 
  gameName 
}: { 
  error: Error; 
  resetError: () => void; 
  gameName: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-6 text-center"
      >
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          {gameName} Game Error
        </h2>
        <p className="text-gray-300 mb-6">
          There was an issue loading the game. Your balance is safe.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full neon-button py-2"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/lobby'}
            className="w-full p-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
