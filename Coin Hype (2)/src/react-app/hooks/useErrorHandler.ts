import { useState, useCallback } from 'react';
import { AppError, ErrorHandler, handleApiError } from '@/react-app/utils/errorHandler';

interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false
  });

  const setError = useCallback((error: AppError | Error | any, context?: string) => {
    const appError = error instanceof Error || typeof error === 'object' && error.type
      ? handleApiError(error, context)
      : error;
    
    setErrorState(prev => ({
      ...prev,
      error: appError,
      isLoading: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState(prev => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      const result = await asyncFn();
      setLoading(false);
      return result;
    } catch (error) {
      setError(error, context);
      return null;
    }
  }, [setLoading, clearError, setError]);

  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    if (!errorState.error || !ErrorHandler.shouldRetry(errorState.error)) {
      return null;
    }

    return handleAsync(asyncFn, context);
  }, [errorState.error, handleAsync]);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    setError,
    clearError,
    setLoading,
    handleAsync,
    retry,
    getUserFriendlyMessage: (error?: AppError) => 
      ErrorHandler.getUserFriendlyMessage(error || errorState.error!),
    shouldShowDetails: (error?: AppError) => 
      ErrorHandler.shouldShowDetails(error || errorState.error!),
    canRetry: (error?: AppError) => 
      ErrorHandler.shouldRetry(error || errorState.error!)
  };
}

export function useAsyncOperation<T>() {
  const { handleAsync, ...errorHandler } = useErrorHandler();

  const execute = useCallback(
    (asyncFn: () => Promise<T>, context?: string) => 
      handleAsync(asyncFn, context),
    [handleAsync]
  );

  return {
    execute,
    ...errorHandler
  };
}
