/**
 * Centralized error handling utilities
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  AUTHENTICATION = 'AUTHENTICATION',
  WALLET = 'WALLET',
  GAME = 'GAME',
  BLOCKCHAIN = 'BLOCKCHAIN',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

export class ErrorHandler {
  static create(type: ErrorType, message: string, code?: string, details?: any): AppError {
    return {
      type,
      message,
      code,
      details,
      timestamp: Date.now()
    };
  }

  static fromHttpResponse(response: Response, data?: any): AppError {
    if (response.status === 401) {
      return this.create(
        ErrorType.AUTHENTICATION,
        'Please sign in to continue',
        'UNAUTHORIZED'
      );
    }

    if (response.status === 403) {
      return this.create(
        ErrorType.AUTHENTICATION,
        'Access denied',
        'FORBIDDEN'
      );
    }

    if (response.status === 429) {
      return this.create(
        ErrorType.NETWORK,
        'Too many requests. Please slow down.',
        'RATE_LIMITED'
      );
    }

    if (response.status >= 500) {
      return this.create(
        ErrorType.NETWORK,
        'Server error. Please try again later.',
        'SERVER_ERROR'
      );
    }

    return this.create(
      ErrorType.NETWORK,
      data?.error || data?.message || 'Network request failed',
      `HTTP_${response.status}`
    );
  }

  static fromWalletError(error: any): AppError {
    if (error.message?.includes('User rejected')) {
      return this.create(
        ErrorType.WALLET,
        'Transaction was cancelled',
        'USER_REJECTED'
      );
    }

    if (error.message?.includes('Insufficient funds')) {
      return this.create(
        ErrorType.WALLET,
        'Insufficient funds in wallet',
        'INSUFFICIENT_FUNDS'
      );
    }

    if (error.message?.includes('Network')) {
      return this.create(
        ErrorType.BLOCKCHAIN,
        'Blockchain network error. Please try again.',
        'NETWORK_ERROR'
      );
    }

    return this.create(
      ErrorType.WALLET,
      error.message || 'Wallet operation failed',
      'WALLET_ERROR',
      error
    );
  }

  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return error.code === 'RATE_LIMITED' 
          ? 'Please wait a moment before trying again'
          : 'Connection issue. Please check your internet and try again.';
      
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue using the casino.';
      
      case ErrorType.WALLET:
        return error.code === 'USER_REJECTED'
          ? 'Transaction cancelled'
          : 'Wallet error. Please check your wallet and try again.';
      
      case ErrorType.BLOCKCHAIN:
        return 'Blockchain is busy. Please wait a moment and try again.';
      
      case ErrorType.GAME:
        return error.message || 'Game error. Please try again.';
      
      case ErrorType.VALIDATION:
        return error.message || 'Invalid input. Please check your data.';
      
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  static shouldRetry(error: AppError): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.BLOCKCHAIN
    ].includes(error.type) && error.code !== 'RATE_LIMITED';
  }

  static shouldShowDetails(error: AppError): boolean {
    return error.type === ErrorType.VALIDATION || error.type === ErrorType.GAME;
  }

  static log(error: AppError, context?: string): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (error.type === ErrorType.NETWORK || error.type === ErrorType.BLOCKCHAIN) {
      console.warn('App Error:', logData);
    } else {
      console.error('App Error:', logData);
    }

    // Send to analytics in production
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('error', logData);
    }
  }
}

export function handleApiError(error: any, context?: string): AppError {
  let appError: AppError;

  if (error instanceof Response) {
    appError = ErrorHandler.fromHttpResponse(error);
  } else if (error?.message?.includes('wallet') || error?.code === 4001) {
    appError = ErrorHandler.fromWalletError(error);
  } else if (error instanceof Error) {
    appError = ErrorHandler.create(
      ErrorType.UNKNOWN,
      error.message,
      undefined,
      error
    );
  } else {
    appError = ErrorHandler.create(
      ErrorType.UNKNOWN,
      'An unexpected error occurred'
    );
  }

  ErrorHandler.log(appError, context);
  return appError;
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        const appError = handleApiError(error, 'retry_attempt');
        
        if (retries < maxRetries && ErrorHandler.shouldRetry(appError)) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries - 1); // Exponential backoff
          
          setTimeout(attempt, delay);
        } else {
          reject(appError);
        }
      }
    };

    attempt();
  });
}
