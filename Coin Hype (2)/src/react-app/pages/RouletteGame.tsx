import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import SoundManager from '@/react-app/utils/sounds';
import { ROULETTE_CONFIG } from '@/react-app/config/gameConfig';

// European roulette numbers in wheel order (authentic order)
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

interface Bet {
  type: string;
  amount: number;
  numbers?: number[];
  multiplier: number;
}

interface SpinResult {
  number: number;
  color: 'red' | 'black' | 'green';
  bets: Bet[];
  totalPayout: number;
  win: boolean;
}

export default function RouletteGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  
  const soundManager = useRef(new SoundManager());
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
  };

  const addBet = (type: string, numbers?: number[], multiplier: number = 2) => {
    if (bets.reduce((sum, bet) => sum + bet.amount, 0) + currentBet > currentBalance) return;
    
    const newBet: Bet = {
      type,
      amount: currentBet,
      numbers,
      multiplier
    };
    
    setBets(prev => [...prev, newBet]);
    playSound('click');
  };

  const clearBets = () => {
    setBets([]);
  };

  const spin = async () => {
    if (bets.length === 0 || isSpinning) return;
    
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBetAmount > currentBalance) return;
    
    setIsSpinning(true);
    setPlaying(true);
    setShowResult(false);
    playSound('click');
    
    placeBet(totalBetAmount);

    // Calculate precise number using provably fair logic
    const roll = Math.random() * 100;
    const finalNumber = ROULETTE_CONFIG.calculateNumber(roll);
    
    // Clear any existing timeout
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }
    
    spinTimeoutRef.current = setTimeout(async () => {
      setCurrentNumber(finalNumber);
      setShowResult(true);
      
      const color = getNumberColor(finalNumber);
      let totalPayout = 0;
      
      // Calculate payouts using authentic roulette rules
      for (const bet of bets) {
        // Check if bet wins based on authentic roulette rules
        let wins = false;
        switch (bet.type) {
          case 'red':
            wins = RED_NUMBERS.has(finalNumber);
            break;
          case 'black':
            wins = !RED_NUMBERS.has(finalNumber) && finalNumber !== 0;
            break;
          case 'even':
            wins = finalNumber % 2 === 0 && finalNumber !== 0;
            break;
          case 'odd':
            wins = finalNumber % 2 === 1;
            break;
          case 'low':
            wins = finalNumber >= 1 && finalNumber <= 18;
            break;
          case 'high':
            wins = finalNumber >= 19 && finalNumber <= 36;
            break;
          case 'dozen1':
            wins = finalNumber >= 1 && finalNumber <= 12;
            break;
          case 'dozen2':
            wins = finalNumber >= 13 && finalNumber <= 24;
            break;
          case 'dozen3':
            wins = finalNumber >= 25 && finalNumber <= 36;
            break;
          case 'column1':
            wins = finalNumber > 0 && (finalNumber - 1) % 3 === 0;
            break;
          case 'column2':
            wins = finalNumber > 0 && (finalNumber - 2) % 3 === 0;
            break;
          case 'column3':
            wins = finalNumber > 0 && finalNumber % 3 === 0;
            break;
          case 'straight':
            wins = bet.numbers?.includes(finalNumber) || false;
            break;
          default:
            wins = false;
        }
        
        if (wins) {
          totalPayout += bet.amount * bet.multiplier;
        }
      }

      const result: SpinResult = {
        number: finalNumber,
        color,
        bets: [...bets],
        totalPayout,
        win: totalPayout > 0
      };

      setLastResult(result);
      setSpinHistory(prev => [result, ...prev.slice(0, 9)]);

      if (result.win) {
        playSound('win');
        if (!isRealMode) {
          addWin(totalPayout);
        }
      }

      if (isRealMode) {
        try {
          await fetch('/api/games/roulette/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: totalBetAmount,
              bets,
              winningNumber: finalNumber,
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Roulette game error:', error);
        }
      }

      setBets([]);
      setIsSpinning(false);
      setPlaying(false);
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const gameStats = [
    { label: 'Current Bets', value: bets.length.toString(), color: 'text-cyan-400' },
    { label: 'Total Bet', value: `◎ ${totalBetAmount.toFixed(2)}`, color: 'text-yellow-400' },
    { label: 'Last Number', value: currentNumber !== null ? currentNumber.toString() : '-', color: currentNumber !== null ? getNumberColor(currentNumber) === 'red' ? 'text-red-400' : getNumberColor(currentNumber) === 'black' ? 'text-gray-300' : 'text-green-400' : 'text-gray-400' },
    { label: 'Status', value: isSpinning ? 'Spinning' : 'Ready', color: isSpinning ? 'text-yellow-400' : 'text-green-400' }
  ];

  return (
    <UniversalGameTemplate
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-red-900/20 via-black/20 to-green-900/20"
      actions={[
        {
          text: isSpinning ? 'Spinning...' : 'SPIN WHEEL',
          onClick: spin,
          disabled: bets.length === 0 || totalBetAmount > currentBalance || isSpinning,
          loading: isSpinning
        }
      ]}
      customBetInput={
        <div className="space-y-4">
          {/* Quick Bets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addBet('red', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              Red (2x)
            </button>
            <button
              onClick={() => addBet('black', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-black rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              Black (2x)
            </button>
            <button
              onClick={() => addBet('even', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              Even (2x)
            </button>
            <button
              onClick={() => addBet('odd', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              Odd (2x)
            </button>
            <button
              onClick={() => addBet('low', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              1-18 (2x)
            </button>
            <button
              onClick={() => addBet('high', undefined, 2)}
              disabled={isSpinning}
              className="p-3 bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 rounded-lg text-white font-bold transition-all duration-200 disabled:opacity-50"
            >
              19-36 (2x)
            </button>
          </div>

          {/* Current Bets */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-bold text-white mb-2">
              Current Bets (◎ {totalBetAmount.toFixed(2)})
            </h3>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {bets.map((bet, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-700/50 rounded text-xs">
                  <span className="text-gray-300 capitalize font-medium">{bet.type}</span>
                  <span className="font-bold text-cyan-400">
                    ◎ {bet.amount.toFixed(2)} ({bet.multiplier}x)
                  </span>
                </div>
              ))}
            </div>
            {bets.length > 0 && (
              <button
                onClick={clearBets}
                disabled={isSpinning}
                className="w-full mt-2 p-2 bg-red-600 hover:bg-red-700 rounded text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                Clear Bets
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Roulette Wheel */}
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
            {/* Wheel Base */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-2xl">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Roulette Wheel */}
                <motion.div
                  className="absolute inset-4 rounded-full border-4 border-yellow-500 overflow-hidden"
                  animate={{ rotate: isSpinning && currentNumber !== null ? 
                    WHEEL_NUMBERS.indexOf(currentNumber) * (360 / WHEEL_NUMBERS.length) + 1800 : 0 }}
                  transition={{ 
                    duration: isSpinning ? 3 : 0, 
                    ease: isSpinning ? "easeOut" : "linear",
                    type: "tween"
                  }}
                >
                  {WHEEL_NUMBERS.map((number, index) => {
                    const angle = (index * 360) / WHEEL_NUMBERS.length;
                    const color = getNumberColor(number) === 'green' ? '#10B981' : 
                                 getNumberColor(number) === 'red' ? '#EF4444' : '#374151';
                    
                    return (
                      <div
                        key={index}
                        className="absolute w-full h-full"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        <div
                          className="absolute top-1 left-1/2 w-8 h-8 -ml-4 flex items-center justify-center text-white text-xs font-bold rounded-sm"
                          style={{
                            backgroundColor: color,
                            transform: `rotate(${-angle}deg)`,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {number}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
                
                {/* Center hub */}
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg border-4 border-yellow-300 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-yellow-200"></div>
                </div>
              </div>
            </div>
            
            {/* Ball indicator pointer */}
            <div className="absolute top-4 left-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white z-10 -ml-1">
            </div>
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {showResult && currentNumber !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mt-6 text-center"
              >
                <div className={`text-4xl font-bold mb-2 ${
                  getNumberColor(currentNumber) === 'red' ? 'text-red-400' :
                  getNumberColor(currentNumber) === 'black' ? 'text-gray-300' : 'text-green-400'
                }`}>
                  {currentNumber}
                </div>
                <div className={`text-lg font-bold ${
                  getNumberColor(currentNumber) === 'red' ? 'text-red-400' :
                  getNumberColor(currentNumber) === 'black' ? 'text-gray-300' : 'text-green-400'
                }`}>
                  {getNumberColor(currentNumber).toUpperCase()}
                </div>

                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <div className={`text-xl font-bold ${
                      lastResult.win ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {lastResult.win ? 
                        `+◎ ${lastResult.totalPayout.toFixed(2)}` : 
                        `-◎ ${totalBetAmount.toFixed(2)}`
                      }
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Spin History</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {spinHistory.length > 0 ? (
              spinHistory.map((result, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded text-sm ${
                    result.win 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${
                      result.color === 'red' ? 'text-red-400' :
                      result.color === 'black' ? 'text-gray-300' : 'text-green-400'
                    }`}>
                      {result.number}
                    </span>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      result.color === 'red' ? 'bg-red-500/20' :
                      result.color === 'black' ? 'bg-gray-500/20' : 'bg-green-500/20'
                    }`}>
                      {result.color}
                    </span>
                  </div>
                  <span className="font-bold">
                    {result.win ? '+' : '-'}◎ {
                      result.win ? result.totalPayout.toFixed(2) : 
                      result.bets.reduce((sum, bet) => sum + bet.amount, 0).toFixed(2)
                    }
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No spins yet
              </div>
            )}
          </div>
        </div>
      </div>
    </UniversalGameTemplate>
  );
}
