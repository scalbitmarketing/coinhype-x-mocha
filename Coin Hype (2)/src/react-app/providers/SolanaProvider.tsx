import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { SolanaBalance, TransactionType } from '@/shared/types';

interface SolanaContextValue {
  balance: SolanaBalance | null;
  transactions: TransactionType[];
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  connectWallet: (walletAddress: string) => Promise<void>;
  deposit: (transactionSignature: string) => Promise<{ success: boolean; error?: string; amountSol?: number }>;
}

const SolanaContext = createContext<SolanaContextValue | null>(null);

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<SolanaBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/balance', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const balanceData = await response.json();
        setBalance(balanceData);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [user]);

  const refreshTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const { transactions } = await response.json();
        setTransactions(transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [user]);

  const connectWallet = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wallets/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ walletAddress }),
      });
      
      if (response.ok) {
        await refreshBalance();
      } else {
        throw new Error('Failed to connect wallet');
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  const deposit = useCallback(async (transactionSignature: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactionSignature }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await refreshBalance();
        await refreshTransactions();
        return { success: true, amountSol: result.amountSol };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Deposit error:', error);
      return { success: false, error: 'Failed to process deposit' };
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance, refreshTransactions]);

  useEffect(() => {
    if (user) {
      refreshBalance();
      refreshTransactions();
    }
  }, [user]);

  return (
    <SolanaContext.Provider value={{
      balance,
      transactions,
      isLoading,
      refreshBalance,
      refreshTransactions,
      connectWallet,
      deposit,
    }}>
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
}
