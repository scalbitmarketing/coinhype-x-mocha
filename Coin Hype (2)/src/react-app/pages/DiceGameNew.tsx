import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Percent, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';
import { calculateDiceResult, FINANCIAL_CONFIG } from '@/react-app/utils/preciseGameLogic';
import { DICE_CONFIG } from '@/react-app/config/gameConfig';

interface DiceGameResult {
  roll: number;
  target: number;
  payout: number;
  win: boolean;
  multiplier: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export default function DiceGameNew() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin, setBet } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [target, setTarget] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceGameResult | null>(null);
  const [rollHistory, setRollHistory] = useState<DiceGameResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());

  // Calculate multiplier and win chance using config
  const multiplier = DICE_CONFIG.calculateMultiplier(target);
  const winChance = ((target - DICE_CONFIG.MIN_TARGET) / (DICE_CONFIG.MAX_TARGET - DICE_CONFIG.MIN_TARGET)) * 100;

  // Load game history from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`dice_history_${user.id}`);
      if (savedHistory) {
        try {
          setRollHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved dice history:', e);
        }
      }
    }
  }, [user]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (user && rollHistory.length > 0) {
      localStorage.setItem(`dice_history_${user.id}`, JSON.stringify(rollHistory.slice(0, 50)));
    }
  }, [rollHistory, user]);

  const rollDice = async () => {
    if (currentBalance < currentBet || isRolling) return;

    setIsRolling(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Convert to integer for precise calculations
    const betInteger = FINANCIAL_CONFIG.toInteger(currentBet, !!isRealMode);
    
    // Always deduct bet immediately for instant feedback
    placeBet(currentBet);
    
    try {
      // Calculate result using precise game logic
      const gameResult = calculateDiceResult(betInteger, target, !!isRealMode);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result: DiceGameResult = {
        roll: gameResult.details.roll,
        target,
        payout: gameResult.payoutDisplay,
        win: gameResult.win,
        multiplier: gameResult.multiplier,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`,
        serverSeed: gameSeeds.serverSeed,
        clientSeed: gameSeeds.clientSeed,
        nonce: gameSeeds.nonce
      };

      if (gameResult.win) {
        addWin(gameResult.payoutDisplay);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setRollHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Increment nonce for next game
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // Make API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/dice/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              target,
              serverSeed: result.serverSeed,
              clientSeed: result.clientSeed,
              nonce: result.nonce,
              roll: result.roll
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Dice API error:', error);
        }
      }

    } catch (error) {
      console.error('Dice game error:', error);
    } finally {
      setIsRolling(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Win Chance', 
      value: `${winChance.toFixed(1)}%`, 
      color: 'text-green-400',
      icon: <Percent className="w-3 h-3" />
    },
    { 
      label: 'Multiplier', 
      value: `${multiplier.toFixed(2)}x`, 
      color: 'text-blue-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Target', 
      value: `< ${target.toFixed(2)}`, 
      color: 'text-purple-400',
      icon: <Target className="w-3 h-3" />
    },
    { 
      label: 'Nonce', 
      value: `#${gameSeeds.nonce}`, 
      color: 'text-cyan-400',
      icon: <Hash className="w-3 h-3" />
    }
  ];

  return (
    <UniversalGameTemplate
      gameStats={gameStats}
      backgroundColor="from-blue-900/20 via-purple-900/20 to-cyan-900/20"
      actions={[
        {
          text: isRolling ? 'Rolling...' : `Roll Dice - ◎ ${currentBet.toFixed(2)}`,
          onClick: rollDice,
          disabled: currentBalance < currentBet || isRolling,
          loading: isRolling
        }
      ]}
      customBetInput={
        <div className="space-y-3">
          {/* Bet Amount */}
          <div>
            <label className="block text-xs text-white/70 mb-1">Bet Amount</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={currentBet}
                    onChange={(e) => setBet(Math.max(0.01, Math.min(Number(e.target.value), currentBalance)))}
                    min="0.01"
                    max={currentBalance}
                    step="0.01"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 pr-10 text-sm h-10"
                    placeholder="0.01"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">◎</span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setBet(Math.max(0.01, currentBet / 2))}
                  className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-8 h-10"
                >
                  ½
                </button>
                <button 
                  onClick={() => setBet(Math.min(currentBet * 2, currentBalance))}
                  className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-9 h-10"
                >
                  2×
                </button>
                <button 
                  onClick={() => setBet(currentBalance)}
                  className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-10 h-10"
                >
                  Max
                </button>
              </div>
            </div>
          </div>
          
          {/* Target Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/70">Roll Under</label>
              <span className="text-sm font-bold text-white">{target.toFixed(2)}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={DICE_CONFIG.MIN_TARGET}
                max={DICE_CONFIG.MAX_TARGET}
                step="0.01"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                disabled={isRolling}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #06b6d4 0%, 
                    #8b5cf6 ${((target - DICE_CONFIG.MIN_TARGET) / (DICE_CONFIG.MAX_TARGET - DICE_CONFIG.MIN_TARGET)) * 100}%, 
                    rgba(255,255,255,0.1) ${((target - DICE_CONFIG.MIN_TARGET) / (DICE_CONFIG.MAX_TARGET - DICE_CONFIG.MIN_TARGET)) * 100}%
                  )`
                }}
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>{DICE_CONFIG.MIN_TARGET}</span>
                <span>{DICE_CONFIG.MAX_TARGET}</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full text-center">
        {/* Dice Display - Optimized for iPhone */}
        <motion.div
          className="mb-6"
          animate={isRolling ? { rotateX: 360, rotateY: 360 } : {}}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {lastResult ? (
            <div className="space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-5xl font-bold ${
                  lastResult.win ? 'text-green-400' : 'text-red-400'
                }`}
                style={{
                  filter: 'drop-shadow(0 0 20px currentColor)'
                }}
              >
                {lastResult.roll.toFixed(2)}
              </motion.div>
              <div className="glass-panel p-3 rounded-lg">
                <div className={`text-lg font-bold mb-2 ${
                  lastResult.win ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastResult.win ? 'WIN!' : 'LOSE'}
                </div>
                <div className="text-sm text-white/70">
                  {lastResult.roll.toFixed(2)} {lastResult.win ? '<' : '≥'} {lastResult.target.toFixed(2)}
                </div>
                {lastResult.win && (
                  <div className="text-sm text-green-400 mt-2">
                    +◎ {lastResult.payout.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-7xl" style={{ 
                filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.6))' 
              }}>
                🎲
              </div>
              <div className="glass-panel p-3 rounded-lg">
                <div className="text-lg text-white/70">Ready to roll!</div>
                <div className="text-sm text-white/50 mt-1">
                  Bet and roll under {target.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Results - Compact for iPhone */}
        {rollHistory.length > 0 && (
          <div className="glass-panel p-3 rounded-lg">
            <h3 className="text-sm text-white/70 mb-2">Recent Rolls</h3>
            <div className="flex justify-center space-x-1 overflow-x-auto">
              {rollHistory.slice(0, 6).map((result, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    result.win ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                  }`}
                >
                  {result.roll.toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
