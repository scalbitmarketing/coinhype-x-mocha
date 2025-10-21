import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import StandardGameUI from '@/react-app/components/StandardGameUI';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import Logo from '@/react-app/components/Logo';
import SoundManager from '@/react-app/utils/sounds';


const SYMBOLS = [
  { name: 'Cherry', icon: '🍒', multiplier: 2, weight: 25, color: 'text-red-400' },
  { name: 'Lemon', icon: '🍋', multiplier: 3, weight: 20, color: 'text-yellow-400' },
  { name: 'Orange', icon: '🍊', multiplier: 4, weight: 18, color: 'text-orange-400' },
  { name: 'Grape', icon: '🍇', multiplier: 5, weight: 15, color: 'text-purple-400' },
  { name: 'Bell', icon: '🔔', multiplier: 10, weight: 10, color: 'text-blue-400' },
  { name: 'Star', icon: '⭐', multiplier: 15, weight: 7, color: 'text-cyan-400' },
  { name: 'Diamond', icon: '💎', multiplier: 25, weight: 4, color: 'text-pink-400' },
  { name: 'Seven', icon: '7️⃣', multiplier: 50, weight: 1, color: 'text-green-400' },
];

interface SpinResult {
  reels: number[];
  multiplier: number;
  payout: number;
  win: boolean;
  winType: string;
}

const GAME_RULES = [
  '3 matching symbols = full multiplier payout',
  '2 high-value symbols = 30% multiplier payout',
  'Any 2 Sevens = special 3x multiplier',
  '2+ high-value mixed = 1.5x bonus multiplier',
  'House edge: 5% for balanced gameplay'
];

export default function SlotsGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  // Weighted random symbol selection for realistic slot machine behavior
  const getRandomSymbol = (): number => {
    const totalWeight = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < SYMBOLS.length; i++) {
      random -= SYMBOLS[i].weight;
      if (random <= 0) {
        return i;
      }
    }
    return 0;
  };

  const calculateWin = (reelResults: number[]) => {
    const [reel1, reel2, reel3] = reelResults;
    const houseEdge = 0.05; // 5% house edge
    
    // Three of a kind - highest priority
    if (reel1 === reel2 && reel2 === reel3) {
      return {
        multiplier: SYMBOLS[reel1].multiplier * (1 - houseEdge),
        winType: `Three ${SYMBOLS[reel1].name}s`
      };
    }
    
    // Two of a kind - Enhanced logic
    if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      let symbol: number;
      if (reel1 === reel2) symbol = reel1;
      else if (reel2 === reel3) symbol = reel2;
      else symbol = reel1;
      
      // Two of a kind pays for Bell and higher (index 4+)
      if (symbol >= 4) {
        return {
          multiplier: SYMBOLS[symbol].multiplier * 0.3 * (1 - houseEdge),
          winType: `Two ${SYMBOLS[symbol].name}s`
        };
      }
    }
    
    // Special cases for better gameplay
    const sevenCount = reelResults.filter(r => r === 7).length;
    if (sevenCount === 2) {
      return {
        multiplier: 3 * (1 - houseEdge),
        winType: 'Two Sevens'
      };
    }
    
    // Mixed high-value symbols bonus
    const highValueSymbols = reelResults.filter(r => r >= 5).length;
    if (highValueSymbols >= 2) {
      return {
        multiplier: 1.5 * (1 - houseEdge),
        winType: 'High Value Mix'
      };
    }
    
    return { multiplier: 0, winType: 'No Match' };
  };

  const spin = async () => {
    if (currentBalance < currentBet || isSpinning) return;
    
    setIsSpinning(true);
    setPlaying(true);
    playSound('click');
    
    placeBet(currentBet);

    // Animate spinning with realistic slot machine behavior
    const spinDuration = 2500;
    let spinCount = 0;
    const maxSpins = 25;
    
    const spinInterval = setInterval(() => {
      setReels([
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
      ]);
      spinCount++;
      
      if (spinCount >= maxSpins) {
        clearInterval(spinInterval);
      }
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);
      
      const finalReels = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
      ];
      
      setReels(finalReels);
      
      const winInfo = calculateWin(finalReels);
      const payout = currentBet * winInfo.multiplier;
      const win = winInfo.multiplier > 0;

      const result: SpinResult = {
        reels: finalReels,
        multiplier: winInfo.multiplier,
        payout,
        win,
        winType: winInfo.winType
      };

      setLastResult(result);
      setSpinHistory(prev => [result, ...prev.slice(0, 9)]);

      if (win) {
        playSound('win');
        if (!isRealMode) {
          addWin(payout);
        }
      }

      if (isRealMode) {
        try {
          await fetch('/api/games/slots/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              reels: finalReels,
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Slots game error:', error);
        }
      }

      setIsSpinning(false);
      setPlaying(false);
    }, spinDuration);
  };

  const gameStats = [
    { label: 'Spin Status', value: isSpinning ? 'Spinning' : 'Ready', color: isSpinning ? 'text-yellow-400' : 'text-green-400' },
    { label: 'Last Win Type', value: lastResult?.winType || 'None', color: 'text-cyan-400' },
    { label: 'Last Multiplier', value: lastResult ? `${lastResult.multiplier.toFixed(2)}x` : '0x', color: lastResult?.win ? 'text-green-400' : 'text-gray-400' },
    { label: 'Win Rate', value: `${spinHistory.length ? ((spinHistory.filter(r => r.win).length / spinHistory.length) * 100).toFixed(1) : '0'}%`, color: 'text-purple-400' }
  ];

  // Custom paytable component
  const paytableComponent = (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-white mb-4">Paytable</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {SYMBOLS.map((symbol, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-700/50">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{symbol.icon}</span>
              <span className="text-sm text-gray-300">{symbol.name}</span>
            </div>
            <span className={`text-sm font-bold ${symbol.color}`}>
              {symbol.multiplier}x
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <p>• 3 matching symbols = full multiplier</p>
        <p>• 2 high-value symbols = 30% multiplier</p>
        <p>• 2 sevens = 3x multiplier</p>
      </div>
    </div>
  );

  return (
    <GameBackground theme="slots">
      <header className="px-6 py-4 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 flex justify-center">
            <Logo size="medium" />
          </div>
          <div className="flex-shrink-0">
            <BalanceDisplay />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StandardGameUI
          gameTitle="Slots"
          gameRules={GAME_RULES}
          gameStats={gameStats}
          actionButton={{
            text: isSpinning ? 'Spinning...' : `Spin - ${isRealMode ? '◎' : '$'}${currentBet.toFixed(isRealMode ? 4 : 2)}`,
            onClick: spin,
            disabled: currentBalance < currentBet || isSpinning,
            loading: isSpinning
          }}
          disabled={isSpinning}
        >
          {paytableComponent}

          {/* Slot Machine */}
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-green-500/5 to-yellow-500/5 pointer-events-none"></div>
            <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-lg p-6 border-4 relative overflow-hidden"
                 style={{
                   borderImage: 'linear-gradient(135deg, #00D9FF, #8B5CF6, #FF0080, #FFD700) 1',
                   boxShadow: '0 0 30px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.2)'
                 }}>
              
              <div className="text-center mb-4">
                <div className="text-lg text-white font-bold">LUCKY SLOTS</div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {reels.map((symbolIndex, reelIndex) => (
                  <motion.div
                    key={reelIndex}
                    className="bg-gradient-to-br from-white to-gray-100 rounded-lg aspect-square flex items-center justify-center text-6xl border-4 relative overflow-hidden"
                    style={{
                      borderImage: 'linear-gradient(135deg, #00D9FF, #8B5CF6, #FF0080) 1',
                      boxShadow: 'inset 0 0 25px rgba(0, 217, 255, 0.2), 0 0 15px rgba(139, 92, 246, 0.3)'
                    }}
                    animate={isSpinning ? { 
                      rotateY: [0, 360],
                      scale: [1, 1.1, 1] 
                    } : {}}
                    transition={{ 
                      duration: 0.5, 
                      repeat: isSpinning ? Infinity : 0,
                      delay: reelIndex * 0.1 
                    }}
                  >
                    <motion.div
                      animate={isSpinning ? {
                        filter: [
                          'drop-shadow(0 0 10px rgba(0, 217, 255, 0.6))',
                          'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))',
                          'drop-shadow(0 0 10px rgba(255, 0, 128, 0.6))'
                        ]
                      } : {}}
                      transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
                    >
                      {SYMBOLS[symbolIndex].icon}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-2"
                >
                  <p className="text-lg font-bold text-white">
                    {lastResult.winType}
                  </p>
                  {lastResult.win ? (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-400">
                        {lastResult.multiplier.toFixed(2)}x
                      </p>
                      <p className="text-xl text-green-400">
                        +{isRealMode ? '◎' : '$'}{lastResult.payout.toFixed(isRealMode ? 4 : 2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xl text-red-400">
                      -{isRealMode ? '◎' : '$'}{currentBet.toFixed(isRealMode ? 4 : 2)}
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Spin History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {spinHistory.length > 0 ? (
                spinHistory.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${
                      result.win 
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex space-x-1">
                        {result.reels.map((symbolIndex, i) => (
                          <span key={i} className="text-lg">
                            {SYMBOLS[symbolIndex].icon}
                          </span>
                        ))}
                      </div>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? `${result.multiplier.toFixed(2)}x` : 'Loss'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {result.winType}
                      </span>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{(result.win ? result.payout : currentBet).toFixed(isRealMode ? 4 : 2)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No spins yet</p>
                </div>
              )}
            </div>
          </div>
        </StandardGameUI>
      </main>
    </GameBackground>
  );
}
