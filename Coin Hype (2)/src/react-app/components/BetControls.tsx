import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';

interface BetControlsProps {
  onBetChange?: (amount: number) => void;
  disabled?: boolean;
}

const demoPresets = [1, 5, 10, 25, 50, 100];
const solPresets = [0.001, 0.01, 0.05, 0.1, 0.25, 0.5];

export default function BetControls({ onBetChange, disabled = false }: BetControlsProps) {
  const { user } = useAuth();
  const { balance: solanaBalance } = useSolana();
  const { currentBet, setBet, balance: demoBalance } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const maxBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  const presetBets = isRealMode ? solPresets : demoPresets;
  const currency = isRealMode ? '◎' : '$';
  
  const [customBet, setCustomBet] = useState(currentBet.toString());

  const handleBetChange = (newBet: number) => {
    const minBet = isRealMode ? 0.001 : 0.01;
    const bet = Math.max(minBet, Math.min(newBet, maxBalance));
    setBet(bet);
    setCustomBet(bet.toString());
    // FIXED: Don't trigger onBetChange for slider adjustments to prevent auto-betting
    // Only call onBetChange if explicitly needed for specific games
    if (onBetChange) {
      onBetChange(bet);
    }
  };

  const adjustBet = (direction: 'up' | 'down') => {
    const current = parseFloat(customBet) || 0;
    const increment = isRealMode 
      ? (current < 0.01 ? 0.001 : current < 0.1 ? 0.01 : 0.1)
      : (current < 1 ? 0.01 : current < 10 ? 0.1 : 1);
    const newBet = direction === 'up' ? current + increment : current - increment;
    handleBetChange(newBet);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-white">Bet Amount</h3>
      
      {/* Custom bet input */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => adjustBet('down')}
          disabled={disabled || currentBet <= (isRealMode ? 0.001 : 0.01)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{currency}</span>
          <input
            type="number"
            value={customBet}
            onChange={(e) => setCustomBet(e.target.value)}
            onBlur={() => handleBetChange(parseFloat(customBet) || (isRealMode ? 0.001 : 0.01))}
            min={isRealMode ? "0.001" : "0.01"}
            max={maxBalance}
            step={isRealMode ? "0.001" : "0.01"}
            disabled={disabled}
            className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          />
        </div>
        
        <button
          onClick={() => adjustBet('up')}
          disabled={disabled || currentBet >= maxBalance}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Preset bet buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presetBets.map((bet) => (
          <motion.button
            key={bet}
            onClick={() => handleBetChange(bet)}
            disabled={disabled || bet > maxBalance}
            className={`p-2 text-xs sm:text-sm rounded-lg border transition-all ${
              Math.abs(currentBet - bet) < 0.01
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={!disabled && Math.abs(currentBet - bet) >= 0.01 ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            {currency}{bet}
          </motion.button>
        ))}
      </div>
      
      <button
        onClick={() => handleBetChange(maxBalance)}
        disabled={disabled || maxBalance <= 0}
        className="w-full p-2 text-xs sm:text-sm rounded-lg border border-yellow-500 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Max ({currency}{maxBalance.toFixed(isRealMode ? 4 : 2)})
      </button>
    </div>
  );
}
