import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { AppError, ErrorHandler } from '@/react-app/utils/errorHandler';

interface ErrorToastProps {
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function ErrorToast({ 
  error, 
  onClose, 
  onRetry, 
  autoClose = true, 
  duration = 5000 
}: ErrorToastProps) {
  useEffect(() => {
    if (error && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [error, autoClose, duration, onClose]);

  if (!error) return null;

  const canRetry = onRetry && ErrorHandler.shouldRetry(error);
  const shouldShowDetails = ErrorHandler.shouldShowDetails(error);
  const message = ErrorHandler.getUserFriendlyMessage(error);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        className="fixed top-4 right-4 z-50 max-w-md"
      >
        <div className="bg-red-900/90 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm shadow-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white mb-1">
                {error.type.replace('_', ' ')} Error
              </h4>
              
              <p className="text-sm text-red-200 break-words">
                {message}
              </p>
              
              {shouldShowDetails && error.message !== message && (
                <p className="text-xs text-red-300 mt-2 opacity-75">
                  {error.message}
                </p>
              )}
              
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 inline-flex items-center space-x-1 text-xs text-red-200 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
