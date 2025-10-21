import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Zap, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface WheelSegment {
  value: number;
  color: string;
  probability: number;
}

interface WheelResult {
  segment: WheelSegment;
  rotation: number;
  payout: number;
  hash: string;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { value: 1, color: '#ef4444', probability: 0.4 },      // 40%
  { value: 2, color: '#f97316', probability: 0.25 },     // 25%
  { value: 5, color: '#eab308', probability: 0.15 },     // 15%
  { value: 10, color: '#22c55e', probability: 0.1 },     // 10%
  { value: 25, color: '#3b82f6', probability: 0.05 },    // 5%
  { value: 50, color: '#8b5cf6', probability: 0.03 },    // 3%
  { value: 100, color: '#ec4899', probability: 0.02 }    // 2%
];

export default function WheelOfFortuneGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<WheelResult | null>(null);
  const [gameHistory, setGameHistory] = useState<WheelResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const wheelRef = useRef<HTMLDivElement>(null);

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`wheel_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved wheel history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`wheel_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const getRandomSegment = (seed: string): { segment: WheelSegment; rotation: number } => {
    const seedNumber = parseInt(seed.slice(-8), 16);
    let rng = seedNumber;
    
    const seededRandom = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    const random = seededRandom();
    let cumulative = 0;
    
    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
      cumulative += WHEEL_SEGMENTS[i].probability;
      if (random <= cumulative) {
        const segmentAngle = 360 / WHEEL_SEGMENTS.length;
        const targetAngle = i * segmentAngle + (segmentAngle / 2);
        const totalRotation = 1800 + targetAngle; // 5 full spins + target
        
        return {
          segment: WHEEL_SEGMENTS[i],
          rotation: totalRotation
        };
      }
    }
    
    // Fallback
    return {
      segment: WHEEL_SEGMENTS[0],
      rotation: 1800
    };
  };

  const spinWheel = async () => {
    if (currentBalance < currentBet || isSpinning) return;

    setIsSpinning(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct bet
    placeBet(currentBet);
    
    try {
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const { segment, rotation: newRotation } = getRandomSegment(seed);
      
      // Animate wheel spin
      setRotation(prev => prev + newRotation);
      
      // Wait for spin animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const payout = currentBet * segment.value;
      
      const result: WheelResult = {
        segment,
        rotation: newRotation,
        payout,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      addWin(payout);
      soundManager.current.play('win');

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Increment nonce
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/wheel/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmount: currentBet,
              multiplier: segment.value,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Wheel API error:', error);
        }
      }

    } catch (error) {
      console.error('Wheel game error:', error);
    } finally {
      setIsSpinning(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Last Win', 
      value: lastResult ? `${lastResult.segment.value}x` : '0x', 
      color: 'text-green-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Payout', 
      value: lastResult ? `◎ ${lastResult.payout.toFixed(2)}` : '◎ 0.00', 
      color: 'text-blue-400',
      icon: <Star className="w-3 h-3" />
    },
    { 
      label: 'Max Win', 
      value: '100x', 
      color: 'text-purple-400',
      icon: <Zap className="w-3 h-3" />
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
      gameName="Wheel of Fortune"
      gameStats={gameStats}
      backgroundColor="from-yellow-900/20 via-orange-900/20 to-red-900/20"
      actions={[
        {
          text: isSpinning ? 'Spinning...' : `Spin Wheel - ◎ ${currentBet.toFixed(2)}`,
          onClick: spinWheel,
          disabled: currentBalance < currentBet || isSpinning,
          loading: isSpinning
        }
      ]}
    >
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        {/* Wheel Container */}
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white" />
          </div>
          
          {/* Wheel */}
          <motion.div
            ref={wheelRef}
            className="w-64 h-64 rounded-full border-4 border-white/20 relative overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ 
              duration: isSpinning ? 3 : 0, 
              ease: isSpinning ? "easeOut" : "linear"
            }}
            style={{
              background: `conic-gradient(${WHEEL_SEGMENTS.map((segment, index) => {
                const startAngle = (index / WHEEL_SEGMENTS.length) * 100;
                const endAngle = ((index + 1) / WHEEL_SEGMENTS.length) * 100;
                return `${segment.color} ${startAngle}% ${endAngle}%`;
              }).join(', ')})`
            }}
          >
            {/* Segment Labels */}
            {WHEEL_SEGMENTS.map((segment, index) => {
              const angle = (index / WHEEL_SEGMENTS.length) * 360 + (360 / WHEEL_SEGMENTS.length / 2);
              return (
                <div
                  key={index}
                  className="absolute w-full h-full flex items-center justify-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div 
                    className="text-white font-bold text-lg"
                    style={{
                      transform: `translateY(-45%) rotate(${-angle}deg)`
                    }}
                  >
                    {segment.value}x
                  </div>
                </div>
              );
            })}
            
            {/* Center Hub */}
            <div className="absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-2 border-gray-800" />
          </motion.div>
        </div>

        {/* Result Display */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-lg"
          >
            <div className="text-2xl font-bold text-green-400 mb-2">
              {lastResult.segment.value}x WIN!
            </div>
            <div className="text-lg text-white mb-2">
              ◎ {lastResult.payout.toFixed(2)}
            </div>
            <div className="text-sm text-white/70">
              Multiplier: {lastResult.segment.value}x
            </div>
          </motion.div>
        )}

        {/* Probability Table */}
        <div className="glass-panel p-4 rounded-lg">
          <h3 className="text-sm text-white/70 mb-3">Probabilities</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {WHEEL_SEGMENTS.map((segment, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-full h-6 rounded flex items-center justify-center text-white font-bold mb-1"
                  style={{ backgroundColor: segment.color }}
                >
                  {segment.value}x
                </div>
                <div className="text-white/50">
                  {(segment.probability * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {!lastResult && !isSpinning && (
          <div className="text-center text-white/70 text-sm">
            <div className="text-2xl mb-2">🎡</div>
            <div>Spin the wheel for instant multipliers!</div>
            <div className="text-xs text-white/50 mt-1">Win up to 100x your bet</div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
