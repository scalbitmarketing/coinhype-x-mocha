import { useCallback } from 'react';
import { analytics, GameAnalytics } from '@/react-app/utils/analytics';

export function useGameAnalytics() {
  const trackGameStart = useCallback((gameType: string, betAmount: number) => {
    analytics.trackGameStart(gameType, betAmount);
  }, []);

  const trackGameEnd = useCallback((gameAnalytics: GameAnalytics) => {
    analytics.trackGameEnd(gameAnalytics);
  }, []);

  const trackWalletConnection = useCallback((walletType: string, success: boolean) => {
    analytics.trackWalletConnection(walletType, success);
  }, []);

  const trackDeposit = useCallback((amount: number, method: string) => {
    analytics.trackDeposit(amount, method);
  }, []);

  const trackWithdrawal = useCallback((amount: number, method: string) => {
    analytics.trackWithdrawal(amount, method);
  }, []);

  const trackError = useCallback((error: Error, context?: string) => {
    analytics.trackError(error, context);
  }, []);

  const trackConversion = useCallback((type: string, value?: number) => {
    analytics.trackConversion(type, value);
  }, []);

  return {
    trackGameStart,
    trackGameEnd,
    trackWalletConnection,
    trackDeposit,
    trackWithdrawal,
    trackError,
    trackConversion
  };
}
