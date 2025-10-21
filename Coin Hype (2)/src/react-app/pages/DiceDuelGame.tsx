import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dices, Users, TrendingUp, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface DiceDuelResult {
  playerRoll: number;
  opponentRoll: number;
  playerWins: boolean;
  payout: number;
  hash: string;
}

const OPPONENT_AVATARS = [
  { name: 'Alex', avatar: '🧑‍💻', color: 'text-blue-400' },
  { name: 'Sam', avatar: '👩‍🚀', color: 'text-purple-400' },
  { name: 'Jordan', avatar: '🧑‍🎨', color: 'text-green-400' },
  { name: 'Casey', avatar: '👨‍🔬', color: 'text-red-400' },
  { name: 'Riley', avatar: '👩‍💼', color: 'text-yellow-400' },
  { name: 'Avery', avatar: '🧑‍🍳', color: 'text-pink-400' }
];

export default function DiceDuelGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [playerRoll, setPlayerRoll] = useState(0);
  const [opponentRoll, setOpponentRoll] = useState(0);
  const [currentOpponent, setCurrentOpponent] = useState(OPPONENT_AVATARS[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceDuelResult | null>(null);
  const [gameHistory, setGameHistory] = useState<DiceDuelResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`diceduel_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved dice duel history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`diceduel_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  // Select random opponent for each game
  useEffect(() => {
    const randomOpponent = OPPONENT_AVATARS[Math.floor(Math.random() * OPPONENT_AVATARS.length)];
    setCurrentOpponent(randomOpponent);
  }, [gameSeeds.nonce]);

  const rollDice = async () => {
    if (currentBalance < currentBet || isRolling) return;

    setIsRolling(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct bet
    placeBet(currentBet);
    
    try {
      // Generate rolls using seeded random
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const seedNumber = parseInt(seed.slice(-8), 16);
      let rng = seedNumber;
      
      const seededRandom = () => {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
      };

      const newPlayerRoll = Math.floor(seededRandom() * 6) + 1;
      const newOpponentRoll = Math.floor(seededRandom() * 6) + 1;

      // Animate rolling
      for (let i = 0; i < 10; i++) {
        setPlayerRoll(Math.floor(Math.random() * 6) + 1);
        setOpponentRoll(Math.floor(Math.random() * 6) + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Set final rolls
      setPlayerRoll(newPlayerRoll);
      setOpponentRoll(newOpponentRoll);
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine winner (player wins on tie for 2:1 payout balance)
      const playerWins = newPlayerRoll >= newOpponentRoll;
      const payout = playerWins ? currentBet * 1.95 : 0; // 0.95:1 to account for house edge

      const result: DiceDuelResult = {
        playerRoll: newPlayerRoll,
        opponentRoll: newOpponentRoll,
        playerWins,
        payout,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      if (playerWins) {
        addWin(payout);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Increment nonce
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/diceduel/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmount: currentBet,
              playerRoll: newPlayerRoll,
              opponentRoll: newOpponentRoll,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Dice Duel API error:', error);
        }
      }

    } catch (error) {
      console.error('Dice Duel game error:', error);
    } finally {
      setIsRolling(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Your Roll', 
      value: playerRoll ? `${playerRoll}` : '0', 
      color: 'text-blue-400',
      icon: <Dices className="w-3 h-3" />
    },
    { 
      label: 'Opponent', 
      value: opponentRoll ? `${opponentRoll}` : '0', 
      color: 'text-red-400',
      icon: <Users className="w-3 h-3" />
    },
    { 
      label: 'Win Rate', 
      value: gameHistory.length > 0 ? `${((gameHistory.filter(r => r.playerWins).length / gameHistory.length) * 100).toFixed(0)}%` : '0%', 
      color: 'text-green-400',
      icon: <TrendingUp className="w-3 h-3" />
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
      gameName="Dice Duel"
      gameStats={gameStats}
      backgroundColor="from-emerald-900/20 via-teal-900/20 to-cyan-900/20"
      actions={[
        {
          text: isRolling ? 'Rolling...' : `Challenge ${currentOpponent.name} - ◎ ${currentBet.toFixed(2)}`,
          onClick: rollDice,
          disabled: currentBalance < currentBet || isRolling,
          loading: isRolling
        }
      ]}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Duel Arena */}
        <div className="glass-panel p-6 rounded-lg">
          <div className="grid grid-cols-2 gap-6">
            {/* Player Side */}
            <div className="text-center">
              <div className="text-sm text-white/70 mb-2">You</div>
              <div className="text-4xl mb-2">👤</div>
              <motion.div
                className="w-16 h-16 mx-auto glass-panel rounded-lg flex items-center justify-center text-2xl font-bold text-blue-400"
                animate={isRolling ? { rotateX: 360, rotateY: 360 } : {}}
                transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
              >
                {playerRoll || '?'}
              </motion.div>
            </div>

            {/* Opponent Side */}
            <div className="text-center">
              <div className="text-sm text-white/70 mb-2">{currentOpponent.name}</div>
              <div className="text-4xl mb-2">{currentOpponent.avatar}</div>
              <motion.div
                className="w-16 h-16 mx-auto glass-panel rounded-lg flex items-center justify-center text-2xl font-bold text-red-400"
                animate={isRolling ? { rotateX: 360, rotateY: 360 } : {}}
                transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
              >
                {opponentRoll || '?'}
              </motion.div>
            </div>
          </div>

          {/* VS Indicator */}
          <div className="text-center mt-4">
            <div className="text-2xl font-bold text-white/50">VS</div>
          </div>
        </div>

        {/* Result Display */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-lg text-center"
          >
            <div className={`text-2xl font-bold mb-2 ${
              lastResult.playerWins ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastResult.playerWins ? 'YOU WIN!' : 'YOU LOSE!'}
            </div>
            <div className="text-sm text-white/70 mb-2">
              Your {lastResult.playerRoll} vs {currentOpponent.name}'s {lastResult.opponentRoll}
            </div>
            {lastResult.playerWins && (
              <div className="text-green-400 font-semibold">
                Won: ◎ {lastResult.payout.toFixed(2)}
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard */}
        {gameHistory.length > 0 && (
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm text-white/70 mb-3 text-center">Recent Duels</h3>
            <div className="space-y-2">
              {gameHistory.slice(0, 5).map((result, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-white/50">Duel #{gameSeeds.nonce - index}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">{result.playerRoll}</span>
                    <span className="text-white/50">vs</span>
                    <span className="text-red-400">{result.opponentRoll}</span>
                    <span className={result.playerWins ? 'text-green-400' : 'text-red-400'}>
                      {result.playerWins ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!lastResult && gameHistory.length === 0 && (
          <div className="glass-panel p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">🎲</div>
            <div className="text-sm text-white/70 mb-2">1v1 Dice Battle</div>
            <div className="text-xs text-white/50 space-y-1">
              <div>• Roll against a random opponent</div>
              <div>• Highest roll wins (ties go to player)</div>
              <div>• Win 1.95x your bet</div>
              <div>• Fair and provably random</div>
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
