import { create } from 'zustand';

interface GameState {
  balance: number;
  isPlaying: boolean;
  soundEnabled: boolean;
  currentBet: number;
  lastWin: number;
  totalWagered: number;
  totalWon: number;
  
  // Actions
  setBet: (amount: number) => void;
  placeBet: (amount: number) => void;
  addWin: (amount: number) => void;
  toggleSound: () => void;
  setPlaying: (playing: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: 1000.00, // Demo balance
  isPlaying: false,
  soundEnabled: true,
  currentBet: 10.00,
  lastWin: 0,
  totalWagered: 0,
  totalWon: 0,
  
  setBet: (amount: number) => set({ currentBet: amount }),
  
  placeBet: (amount: number) => {
    const { balance } = get();
    if (balance >= amount) {
      set(state => ({
        balance: Math.max(0, state.balance - amount), // Ensure balance never goes negative
        totalWagered: state.totalWagered + amount,
        lastWin: 0
      }));
    } else {
      console.warn('Insufficient balance for bet:', { balance, amount });
    }
  },
  
  addWin: (amount: number) => {
    set(state => ({
      balance: state.balance + amount,
      lastWin: amount,
      totalWon: state.totalWon + amount
    }));
  },
  
  toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
  setPlaying: (playing: boolean) => set({ isPlaying: playing })
}));
