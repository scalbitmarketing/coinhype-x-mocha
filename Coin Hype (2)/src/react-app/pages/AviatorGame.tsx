import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, TrendingUp, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface AviatorResult {
  plane1Multiplier: number;
  plane2Multiplier: number;
  plane1CrashPoint: number;
  plane2CrashPoint: number;
  plane1Bet: number;
  plane2Bet: number;
  plane1CashOut: number;
  plane2CashOut: number;
  plane1Payout: number;
  plane2Payout: number;
  hash: string;
}

export default function AviatorGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [plane1Bet, setPlane1Bet] = useState(0);
  const [plane2Bet, setPlane2Bet] = useState(0);
  const [plane1Multiplier, setPlane1Multiplier] = useState(1.0);
  const [plane2Multiplier, setPlane2Multiplier] = useState(1.0);
  const [plane1Crashed, setPlane1Crashed] = useState(false);
  const [plane2Crashed, setPlane2Crashed] = useState(false);
  const [plane1CashedOut, setPlane1CashedOut] = useState(false);
  const [plane2CashedOut, setPlane2CashedOut] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [lastResult, setLastResult] = useState<AviatorResult | null>(null);
  const [gameHistory, setGameHistory] = useState<AviatorResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const totalBet = plane1Bet + plane2Bet;

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`aviator_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved aviator history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`aviator_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const generateCrashPoint = (seed: string, offset: number): number => {
    const seedNumber = parseInt(seed.slice(-8), 16) + offset;
    let rng = seedNumber;
    
    const seededRandom = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    const random = seededRandom();
    // Exponential distribution for crash points (most crashes are low, few are very high)
    const crashPoint = Math.max(1.01, 1 / (1 - random * 0.99));
    return Math.min(crashPoint, 1000); // Cap at 1000x
  };

  const startFlight = async () => {
    if (totalBet === 0 || totalBet > currentBalance || isFlying) return;

    setIsFlying(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Reset states
    setPlane1Multiplier(1.0);
    setPlane2Multiplier(1.0);
    setPlane1Crashed(false);
    setPlane2Crashed(false);
    setPlane1CashedOut(false);
    setPlane2CashedOut(false);
    
    // Deduct bets
    placeBet(totalBet);
    
    try {
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const plane1CrashPoint = generateCrashPoint(seed, 0);
      const plane2CrashPoint = generateCrashPoint(seed, 1000);
      
      // Animate flight
      const startTime = Date.now();
      const flightInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newMultiplier = 1 + elapsed * 0.5; // 0.5x per second growth
        
        // Update plane 1
        if (!plane1Crashed && !plane1CashedOut) {
          if (newMultiplier >= plane1CrashPoint) {
            setPlane1Crashed(true);
            setPlane1Multiplier(plane1CrashPoint);
            soundManager.current.play('lose');
          } else {
            setPlane1Multiplier(newMultiplier);
          }
        }
        
        // Update plane 2
        if (!plane2Crashed && !plane2CashedOut) {
          if (newMultiplier >= plane2CrashPoint) {
            setPlane2Crashed(true);
            setPlane2Multiplier(plane2CrashPoint);
            soundManager.current.play('lose');
          } else {
            setPlane2Multiplier(newMultiplier);
          }
        }
        
        // End if both planes crashed
        if ((plane1Crashed || plane1CashedOut || newMultiplier >= plane1CrashPoint) && 
            (plane2Crashed || plane2CashedOut || newMultiplier >= plane2CrashPoint)) {
          clearInterval(flightInterval);
          endGame(plane1CrashPoint, plane2CrashPoint);
        }
      }, 100);

    } catch (error) {
      console.error('Aviator game error:', error);
      setIsFlying(false);
      setPlaying(false);
    }
  };

  const cashOut = (plane: 1 | 2) => {
    if (!isFlying) return;
    
    if (plane === 1 && !plane1Crashed && !plane1CashedOut && plane1Bet > 0) {
      setPlane1CashedOut(true);
      const payout = plane1Bet * plane1Multiplier;
      addWin(payout);
      soundManager.current.play('win');
    } else if (plane === 2 && !plane2Crashed && !plane2CashedOut && plane2Bet > 0) {
      setPlane2CashedOut(true);
      const payout = plane2Bet * plane2Multiplier;
      addWin(payout);
      soundManager.current.play('win');
    }
  };

  const endGame = (plane1CrashPoint: number, plane2CrashPoint: number) => {
    const plane1Payout = plane1CashedOut ? plane1Bet * plane1Multiplier : 0;
    const plane2Payout = plane2CashedOut ? plane2Bet * plane2Multiplier : 0;
    
    const result: AviatorResult = {
      plane1Multiplier,
      plane2Multiplier,
      plane1CrashPoint,
      plane2CrashPoint,
      plane1Bet,
      plane2Bet,
      plane1CashOut: plane1CashedOut ? plane1Multiplier : 0,
      plane2CashOut: plane2CashedOut ? plane2Multiplier : 0,
      plane1Payout,
      plane2Payout,
      hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
    };

    setLastResult(result);
    setGameHistory(prev => [result, ...prev.slice(0, 49)]);
    
    // Clear bets and increment nonce
    setPlane1Bet(0);
    setPlane2Bet(0);
    setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));
    
    setIsFlying(false);
    setPlaying(false);

    // API call for real mode
    if (isRealMode) {
      fetch('/api/games/aviator/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plane1Bet,
          plane2Bet,
          plane1CrashPoint,
          plane2CrashPoint,
          plane1CashOut: plane1CashedOut ? plane1Multiplier : 0,
          plane2CashOut: plane2CashedOut ? plane2Multiplier : 0,
          serverSeed: result.hash.split(':')[0],
          clientSeed: result.hash.split(':')[1],
          nonce: parseInt(result.hash.split(':')[2])
        }),
      }).then(() => refreshBalance()).catch(console.error);
    }
  };

  const gameStats = [
    { 
      label: 'Plane 1', 
      value: `${plane1Multiplier.toFixed(2)}x`, 
      color: plane1Crashed ? 'text-red-400' : plane1CashedOut ? 'text-green-400' : 'text-blue-400',
      icon: <Plane className="w-3 h-3" />
    },
    { 
      label: 'Plane 2', 
      value: `${plane2Multiplier.toFixed(2)}x`, 
      color: plane2Crashed ? 'text-red-400' : plane2CashedOut ? 'text-green-400' : 'text-purple-400',
      icon: <Plane className="w-3 h-3" />
    },
    { 
      label: 'Total Bet', 
      value: `◎ ${totalBet.toFixed(2)}`, 
      color: 'text-yellow-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Nonce', 
      value: `#${gameSeeds.nonce}`, 
      color: 'text-cyan-400',
      icon: <Hash className="w-3 h-3" />
    }
  ];

  const actions = isFlying ? [
    ...(plane1Bet > 0 && !plane1Crashed && !plane1CashedOut ? [{
      text: `Cash Out Plane 1 - ${plane1Multiplier.toFixed(2)}x`,
      onClick: () => cashOut(1),
      variant: 'secondary' as const
    }] : []),
    ...(plane2Bet > 0 && !plane2Crashed && !plane2CashedOut ? [{
      text: `Cash Out Plane 2 - ${plane2Multiplier.toFixed(2)}x`,
      onClick: () => cashOut(2),
      variant: 'secondary' as const
    }] : [])
  ] : [
    {
      text: `Take Off - ◎ ${totalBet.toFixed(2)}`,
      onClick: startFlight,
      disabled: totalBet === 0 || totalBet > currentBalance
    }
  ];

  return (
    <UniversalGameTemplate
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-sky-900/20 via-blue-900/20 to-indigo-900/20"
      actions={actions}
      customBetInput={
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Plane 1</label>
            <input
              type="number"
              value={plane1Bet || ''}
              onChange={(e) => setPlane1Bet(Number(e.target.value) || 0)}
              min="0"
              max={currentBalance}
              step="0.01"
              className="input w-full text-center text-sm"
              placeholder="0.00"
              disabled={isFlying}
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Plane 2</label>
            <input
              type="number"
              value={plane2Bet || ''}
              onChange={(e) => setPlane2Bet(Number(e.target.value) || 0)}
              min="0"
              max={currentBalance}
              step="0.01"
              className="input w-full text-center text-sm"
              placeholder="0.00"
              disabled={isFlying}
            />
          </div>
        </div>
      }
    >
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Flight Display */}
        <div className="relative h-64 glass-panel rounded-lg overflow-hidden">
          {/* Sky Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-blue-600/40" />
          
          {/* Plane 1 */}
          <motion.div
            className={`absolute top-1/4 text-2xl ${
              plane1Crashed ? 'text-red-400' : plane1CashedOut ? 'text-green-400' : 'text-blue-400'
            }`}
            animate={{
              x: isFlying ? [20, 300] : 20,
              y: isFlying ? [0, -50] : 0
            }}
            transition={{
              duration: isFlying ? 20 : 0,
              ease: "linear"
            }}
          >
            ✈️
            {plane1Bet > 0 && (
              <div className="text-xs text-white mt-1 font-bold">
                {plane1Multiplier.toFixed(2)}x
              </div>
            )}
          </motion.div>
          
          {/* Plane 2 */}
          <motion.div
            className={`absolute top-3/4 text-2xl ${
              plane2Crashed ? 'text-red-400' : plane2CashedOut ? 'text-green-400' : 'text-purple-400'
            }`}
            animate={{
              x: isFlying ? [20, 300] : 20,
              y: isFlying ? [0, -50] : 0
            }}
            transition={{
              duration: isFlying ? 25 : 0,
              ease: "linear",
              delay: 1
            }}
          >
            🛩️
            {plane2Bet > 0 && (
              <div className="text-xs text-white mt-1 font-bold">
                {plane2Multiplier.toFixed(2)}x
              </div>
            )}
          </motion.div>

          {/* Multiplier Display */}
          {isFlying && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="glass-panel px-4 py-2 rounded-lg text-center">
                <div className="text-lg font-bold text-white">
                  Flying: {Math.max(plane1Multiplier, plane2Multiplier).toFixed(2)}x
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Result Display */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-lg"
          >
            <div className="text-lg font-bold text-white mb-3 text-center">Flight Results</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-blue-400 mb-1">Plane 1</div>
                <div className="text-lg font-bold">
                  {lastResult.plane1CrashPoint.toFixed(2)}x
                </div>
                {lastResult.plane1Payout > 0 && (
                  <div className="text-green-400 text-sm">
                    +◎ {lastResult.plane1Payout.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm text-purple-400 mb-1">Plane 2</div>
                <div className="text-lg font-bold">
                  {lastResult.plane2CrashPoint.toFixed(2)}x
                </div>
                {lastResult.plane2Payout > 0 && (
                  <div className="text-green-400 text-sm">
                    +◎ {lastResult.plane2Payout.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        {!isFlying && !lastResult && (
          <div className="glass-panel p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">✈️</div>
            <div className="text-sm text-white/70 mb-2">Dual Plane Crash Game</div>
            <div className="text-xs text-white/50 space-y-1">
              <div>• Bet on one or both planes</div>
              <div>• Cash out before they crash</div>
              <div>• Each plane has independent crash points</div>
              <div>• Higher risk, higher reward!</div>
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
