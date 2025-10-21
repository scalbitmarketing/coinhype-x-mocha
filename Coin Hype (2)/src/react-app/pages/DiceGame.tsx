import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import { GameAnimations } from '@/react-app/utils/gameAnimations';
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

export default function DiceGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
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
  const diceRef = useRef<HTMLDivElement>(null);

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

      // Animate dice roll
      if (diceRef.current) {
        await GameAnimations.animateDiceRoll(diceRef.current);
      }

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
    { label: 'Win Chance', value: `${winChance.toFixed(2)}%`, color: 'text-green-400' },
    { label: 'Multiplier', value: `${multiplier.toFixed(2)}x`, color: 'text-blue-400' },
    { label: 'House Edge', value: `${((1 - DICE_CONFIG.HOUSE_RETURN) * 100).toFixed(1)}%`, color: 'text-gray-400' },
    { label: 'Nonce', value: `#${gameSeeds.nonce}`, color: 'text-cyan-400' }
  ];

  return (
    <UniversalGameTemplate
      gameName="Dice"
      gameStats={gameStats}
      backgroundColor="from-cyan-900/20 via-blue-900/20 to-purple-900/20"
      actions={[
        {
          text: isRolling ? 'Rolling...' : `Roll Dice - ◎ ${currentBet.toFixed(2)}`,
          onClick: rollDice,
          disabled: currentBalance < currentBet || isRolling,
          loading: isRolling
        }
      ]}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Target Slider */}
        <div className="glass-panel p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Roll Under</span>
              <span className="text-lg font-bold text-white">{target.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={DICE_CONFIG.MIN_TARGET}
              max={DICE_CONFIG.MAX_TARGET}
              step="0.01"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              disabled={isRolling}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${((target - DICE_CONFIG.MIN_TARGET) / (DICE_CONFIG.MAX_TARGET - DICE_CONFIG.MIN_TARGET)) * 100}%, #374151 ${((target - DICE_CONFIG.MIN_TARGET) / (DICE_CONFIG.MAX_TARGET - DICE_CONFIG.MIN_TARGET)) * 100}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{DICE_CONFIG.MIN_TARGET}</span>
              <span>{DICE_CONFIG.MAX_TARGET}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-white/70">Win Chance</div>
              <div className="text-lg font-bold text-green-400">{winChance.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Multiplier</div>
              <div className="text-lg font-bold text-blue-400">{multiplier.toFixed(2)}x</div>
            </div>
          </div>
        </div>

        {/* Dice Display */}
        <div className="glass-panel p-8 text-center">
          <div className="flex-1 flex items-center justify-center mb-4">
            <motion.div
              ref={diceRef}
              className="relative text-8xl cursor-pointer"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.6))'
              }}
              whileHover={{ scale: 1.05 }}
            >
              {lastResult ? (
                <div className="text-center">
                  <div className={`text-6xl font-bold mb-2 ${
                    lastResult.win ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {lastResult.roll.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Target: &lt; {lastResult.target.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-8xl">🎲</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Roll to win!
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Result */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              <div className={`text-xl font-bold ${
                lastResult.win ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastResult.win ? 'WIN!' : 'LOSE'}
              </div>
              {lastResult.win && (
                <div className="text-lg text-green-400 font-semibold">
                  Won: ◎ {lastResult.payout.toFixed(2)}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Game History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Rolls</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {rollHistory.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  result.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span>{result.roll.toFixed(2)} &lt; {result.target.toFixed(2)}</span>
                <span>
                  {result.win ? '+' : '-'}◎ {result.win ? result.payout.toFixed(2) : currentBet.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UniversalGameTemplate>
  );
}
