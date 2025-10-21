import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dices, TrendingUp, Target, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface SicBoBet {
  type: string;
  value: any;
  amount: number;
  payout: number;
}

interface SicBoResult {
  dice: [number, number, number];
  total: number;
  bets: SicBoBet[];
  totalPayout: number;
  hash: string;
}



export default function SicBoGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [bets, setBets] = useState<SicBoBet[]>([]);
  const [betAmount, setBetAmount] = useState(0.01);
  const [dice, setDice] = useState<[number, number, number]>([1, 1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<SicBoResult | null>(null);
  const [gameHistory, setGameHistory] = useState<SicBoResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`sicbo_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved sic bo history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`sicbo_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const addBet = (type: string, value?: any) => {
    if (totalBet + betAmount > currentBalance) return;
    
    const existingBetIndex = bets.findIndex(bet => bet.type === type && JSON.stringify(bet.value) === JSON.stringify(value));
    
    if (existingBetIndex >= 0) {
      setBets(prev => prev.map((bet, index) => 
        index === existingBetIndex 
          ? { ...bet, amount: bet.amount + betAmount }
          : bet
      ));
    } else {
      const payout = type === 'specificTriple' ? 180 : 
                    type === 'total4' || type === 'total17' ? 60 :
                    type === 'triple' ? 30 : 1;
      
      setBets(prev => [...prev, {
        type,
        value,
        amount: betAmount,
        payout
      }]);
    }
    
    soundManager.current.play('click');
  };

  const clearBets = () => {
    setBets([]);
    soundManager.current.play('click');
  };

  const rollDice = async () => {
    if (bets.length === 0 || totalBet > currentBalance || isRolling) return;

    setIsRolling(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct total bet
    placeBet(totalBet);
    
    try {
      // Generate dice using seeded random
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const seedNumber = parseInt(seed.slice(-8), 16);
      let rng = seedNumber;
      
      const seededRandom = () => {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
      };

      const newDice: [number, number, number] = [
        Math.floor(seededRandom() * 6) + 1,
        Math.floor(seededRandom() * 6) + 1,
        Math.floor(seededRandom() * 6) + 1
      ];

      // Animate dice roll
      for (let i = 0; i < 10; i++) {
        setDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setDice(newDice);
      await new Promise(resolve => setTimeout(resolve, 500));

      const total = newDice.reduce((sum, die) => sum + die, 0);
      
      // Calculate winnings
      let totalPayout = 0;
      const winningBets = bets.map(bet => {
        let wins = false;
        
        switch (bet.type) {
          case 'small':
            wins = total >= 4 && total <= 10 && !(newDice[0] === newDice[1] && newDice[1] === newDice[2]);
            break;
          case 'big':
            wins = total >= 11 && total <= 17 && !(newDice[0] === newDice[1] && newDice[1] === newDice[2]);
            break;
          case 'odd':
            wins = total % 2 === 1;
            break;
          case 'even':
            wins = total % 2 === 0;
            break;
          case 'triple':
            wins = newDice[0] === newDice[1] && newDice[1] === newDice[2];
            break;
          case 'total4':
            wins = total === 4;
            break;
          case 'total17':
            wins = total === 17;
            break;
          case 'specificTriple':
            wins = newDice[0] === bet.value && newDice[1] === bet.value && newDice[2] === bet.value;
            break;
        }
        
        if (wins) {
          totalPayout += bet.amount * (bet.payout + 1); // Include original bet
        }
        
        return { ...bet, wins };
      });

      const result: SicBoResult = {
        dice: newDice,
        total,
        bets: winningBets,
        totalPayout,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      if (totalPayout > 0) {
        addWin(totalPayout);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Clear bets and increment nonce
      setBets([]);
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/sicbo/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              bets: bets,
              dice: newDice,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Sic Bo API error:', error);
        }
      }

    } catch (error) {
      console.error('Sic Bo game error:', error);
    } finally {
      setIsRolling(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Total Bets', 
      value: `◎ ${totalBet.toFixed(2)}`, 
      color: 'text-blue-400',
      icon: <Target className="w-3 h-3" />
    },
    { 
      label: 'Last Total', 
      value: lastResult ? `${lastResult.total}` : '0', 
      color: 'text-green-400',
      icon: <Dices className="w-3 h-3" />
    },
    { 
      label: 'Last Win', 
      value: lastResult ? `◎ ${lastResult.totalPayout.toFixed(2)}` : '◎ 0.00', 
      color: 'text-purple-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Nonce', 
      value: `#${gameSeeds.nonce}`, 
      color: 'text-cyan-400',
      icon: <Hash className="w-3 h-3" />
    }
  ];

  const DiceComponent = ({ value, isRolling }: { value: number; isRolling: boolean }) => (
    <motion.div
      className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-black text-2xl font-bold shadow-lg"
      animate={isRolling ? { rotateX: 360, rotateY: 360 } : {}}
      transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
    >
      {value}
    </motion.div>
  );

  return (
    <UniversalGameTemplate
      gameName="Sic Bo"
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-indigo-900/20 via-purple-900/20 to-pink-900/20"
      actions={[
        {
          text: 'Clear Bets',
          onClick: clearBets,
          disabled: isRolling || bets.length === 0,
          variant: 'secondary'
        },
        {
          text: isRolling ? 'Rolling...' : `Roll Dice - ◎ ${totalBet.toFixed(2)}`,
          onClick: rollDice,
          disabled: bets.length === 0 || totalBet > currentBalance || isRolling,
          loading: isRolling
        }
      ]}
      customBetInput={
        <div className="space-y-4">
          {/* Bet Amount Selector */}
          <div>
            <label className="block text-xs text-white/70 mb-1">Bet Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {[0.01, 0.1, 1, 10].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`btn h-10 text-sm ${
                    betAmount === amount ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  ◎ {amount}
                </button>
              ))}
            </div>
          </div>
          
          {/* Current Bets */}
          {bets.length > 0 && (
            <div className="glass-panel p-3 rounded-lg">
              <h3 className="text-xs text-white/70 mb-2">Active Bets</h3>
              <div className="space-y-1">
                {bets.map((bet, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{bet.type}</span>
                    <span>◎ {bet.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Dice Display */}
        <div className="text-center">
          <div className="flex justify-center space-x-4 mb-4">
            {dice.map((value, index) => (
              <DiceComponent key={index} value={value} isRolling={isRolling} />
            ))}
          </div>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-4 rounded-lg"
            >
              <div className="text-lg font-bold text-white mb-2">
                Total: {lastResult.total}
              </div>
              {lastResult.totalPayout > 0 ? (
                <div className="text-green-400 font-semibold">
                  Won: ◎ {lastResult.totalPayout.toFixed(2)}
                </div>
              ) : (
                <div className="text-red-400">No Win</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Betting Grid */}
        <div className="glass-panel p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            {/* Main Bets */}
            <button
              onClick={() => addBet('small')}
              className="btn btn-secondary h-12 text-sm bg-blue-500/20 hover:bg-blue-500/30"
            >
              Small (4-10)<br/>1:1
            </button>
            <button
              onClick={() => addBet('big')}
              className="btn btn-secondary h-12 text-sm bg-red-500/20 hover:bg-red-500/30"
            >
              Big (11-17)<br/>1:1
            </button>
            <button
              onClick={() => addBet('odd')}
              className="btn btn-secondary h-12 text-sm bg-green-500/20 hover:bg-green-500/30"
            >
              Odd<br/>1:1
            </button>
            <button
              onClick={() => addBet('even')}
              className="btn btn-secondary h-12 text-sm bg-purple-500/20 hover:bg-purple-500/30"
            >
              Even<br/>1:1
            </button>
          </div>
          
          {/* Special Bets */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => addBet('triple')}
              className="btn btn-secondary w-full h-10 text-sm bg-yellow-500/20 hover:bg-yellow-500/30"
            >
              Any Triple (30:1)
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addBet('total4')}
                className="btn btn-secondary h-10 text-sm bg-orange-500/20 hover:bg-orange-500/30"
              >
                Total 4 (60:1)
              </button>
              <button
                onClick={() => addBet('total17')}
                className="btn btn-secondary h-10 text-sm bg-orange-500/20 hover:bg-orange-500/30"
              >
                Total 17 (60:1)
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {bets.length === 0 && !lastResult && (
          <div className="text-center text-white/70 text-sm">
            <div className="text-2xl mb-2">🎲</div>
            <div>Place your bets on the dice combinations</div>
            <div className="text-xs text-white/50 mt-1">Different bets have different payouts</div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
