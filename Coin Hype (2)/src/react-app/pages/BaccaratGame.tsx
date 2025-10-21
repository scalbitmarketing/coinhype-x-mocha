import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, Zap, Star } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface Card {
  suit: string;
  rank: string;
  value: number;
}

interface BaccaratResult {
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  winner: 'player' | 'banker' | 'tie';
  playerBet: number;
  bankerBet: number;
  tieBet: number;
  payout: number;
  hash: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const value = rank === 'A' ? 1 : ['J', 'Q', 'K'].includes(rank) ? 0 : parseInt(rank) || 10;
      deck.push({ suit, rank, value });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[], seed: string): Card[] => {
  const shuffled = [...deck];
  let currentIndex = shuffled.length;
  let temporaryValue: Card;
  let randomIndex: number;

  // Convert seed to number for seeded random
  const seedNumber = parseInt(seed.slice(-8), 16);
  let rng = seedNumber;

  const seededRandom = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  while (currentIndex !== 0) {
    randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex -= 1;
    temporaryValue = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryValue;
  }

  return shuffled;
};

const calculateTotal = (cards: Card[]): number => {
  return cards.reduce((sum, card) => sum + card.value, 0) % 10;
};

export default function BaccaratGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [playerBet, setPlayerBet] = useState(0);
  const [bankerBet, setBankerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [lastResult, setLastResult] = useState<BaccaratResult | null>(null);
  const [gameHistory, setGameHistory] = useState<BaccaratResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const totalBet = playerBet + bankerBet + tieBet;

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`baccarat_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved baccarat history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`baccarat_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const dealCards = async () => {
    if (totalBet === 0 || totalBet > currentBalance || isDealing) return;

    setIsDealing(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct total bet
    placeBet(totalBet);

    try {
      // Create and shuffle deck
      const deck = createDeck();
      const shuffledDeck = shuffleDeck(deck, `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`);
      
      // Deal initial cards (authentic baccarat dealing pattern)
      const playerCards = [shuffledDeck[0], shuffledDeck[2]];
      const bankerCards = [shuffledDeck[1], shuffledDeck[3]];
      let cardIndex = 4;
      
      // Calculate totals
      let playerTotal = calculateTotal(playerCards);
      let bankerTotal = calculateTotal(bankerCards);
      
      // Natural win check (8 or 9) - authentic baccarat rule
      const isNatural = playerTotal >= 8 || bankerTotal >= 8;
      
      if (!isNatural) {
        // Player third card rule: Player draws if total is 0-5, stands on 6-7
        if (playerTotal <= 5) {
          playerCards.push(shuffledDeck[cardIndex++]);
          playerTotal = calculateTotal(playerCards);
        }
        
        // Banker third card rules (authentic baccarat rules)
        const playerThirdCard = playerCards[2];
        const shouldBankerDraw = () => {
          if (bankerTotal <= 2) return true;
          if (bankerTotal === 3 && (!playerThirdCard || playerThirdCard.value !== 8)) return true;
          if (bankerTotal === 4 && playerThirdCard && [2, 3, 4, 5, 6, 7].includes(playerThirdCard.value)) return true;
          if (bankerTotal === 5 && playerThirdCard && [4, 5, 6, 7].includes(playerThirdCard.value)) return true;
          if (bankerTotal === 6 && playerThirdCard && [6, 7].includes(playerThirdCard.value)) return true;
          return false;
        };
        
        if (shouldBankerDraw()) {
          bankerCards.push(shuffledDeck[cardIndex++]);
          bankerTotal = calculateTotal(bankerCards);
        }
      }

      // Determine winner
      let winner: 'player' | 'banker' | 'tie';
      if (playerTotal > bankerTotal) winner = 'player';
      else if (bankerTotal > playerTotal) winner = 'banker';
      else winner = 'tie';

      // Calculate payout (authentic baccarat payouts)
      let payout = 0;
      if (winner === 'player' && playerBet > 0) payout += playerBet * 2; // 1:1
      if (winner === 'banker' && bankerBet > 0) payout += bankerBet * 1.95; // 1:1 minus 5% commission
      if (winner === 'tie' && tieBet > 0) payout += tieBet * 9; // 8:1

      const result: BaccaratResult = {
        playerCards,
        bankerCards,
        playerTotal,
        bankerTotal,
        winner,
        playerBet,
        bankerBet,
        tieBet,
        payout,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      // Add win to balance
      if (payout > 0) {
        addWin(payout);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Clear bets
      setPlayerBet(0);
      setBankerBet(0);
      setTieBet(0);
      
      // Increment nonce
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/baccarat/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              playerBet,
              bankerBet,
              tieBet,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Baccarat API error:', error);
        }
      }

    } catch (error) {
      console.error('Baccarat game error:', error);
    } finally {
      setIsDealing(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Player Bet', 
      value: `◎ ${playerBet.toFixed(2)}`, 
      color: 'text-blue-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Banker Bet', 
      value: `◎ ${bankerBet.toFixed(2)}`, 
      color: 'text-red-400',
      icon: <Crown className="w-3 h-3" />
    },
    { 
      label: 'Tie Bet', 
      value: `◎ ${tieBet.toFixed(2)}`, 
      color: 'text-yellow-400',
      icon: <Star className="w-3 h-3" />
    },
    { 
      label: 'Total', 
      value: `◎ ${totalBet.toFixed(2)}`, 
      color: 'text-cyan-400',
      icon: <Zap className="w-3 h-3" />
    }
  ];

  const CardComponent = ({ card, delay = 0 }: { card: Card; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, rotateY: 180, scale: 0.8 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel w-16 h-24 flex flex-col items-center justify-center text-lg font-bold rounded-lg"
    >
      <span className={`text-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-400' : 'text-white'}`}>
        {card.suit}
      </span>
      <span className="text-white text-sm">{card.rank}</span>
    </motion.div>
  );

  return (
    <UniversalGameTemplate
      gameName="Baccarat"
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-red-900/20 via-purple-900/20 to-gold-900/20"
      actions={[
        {
          text: isDealing ? 'Dealing...' : `Deal Cards - ◎ ${totalBet.toFixed(2)}`,
          onClick: dealCards,
          disabled: totalBet === 0 || totalBet > currentBalance || isDealing,
          loading: isDealing
        }
      ]}
      customBetInput={
        <div className="space-y-4">
          {/* Betting inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Player (1:1)</label>
              <input
                type="number"
                value={playerBet || ''}
                onChange={(e) => setPlayerBet(Number(e.target.value) || 0)}
                min="0"
                max={currentBalance}
                step="0.01"
                className="w-full px-2 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm text-center"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Banker (0.95:1)</label>
              <input
                type="number"
                value={bankerBet || ''}
                onChange={(e) => setBankerBet(Number(e.target.value) || 0)}
                min="0"
                max={currentBalance}
                step="0.01"
                className="w-full px-2 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm text-center"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Tie (8:1)</label>
              <input
                type="number"
                value={tieBet || ''}
                onChange={(e) => setTieBet(Number(e.target.value) || 0)}
                min="0"
                max={currentBalance}
                step="0.01"
                className="w-full px-2 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm text-center"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quick bet buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlayerBet(currentBalance * 0.1)}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-400 text-sm font-semibold transition-colors"
            >
              Player 10%
            </button>
            <button
              onClick={() => setBankerBet(currentBalance * 0.1)}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg text-red-400 text-sm font-semibold transition-colors"
            >
              Banker 10%
            </button>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Banker Cards */}
        <div className="text-center">
          <h3 className="text-sm text-white/70 mb-3">Banker</h3>
          <div className="flex justify-center space-x-2 mb-2">
            <AnimatePresence>
              {lastResult?.bankerCards.map((card, index) => (
                <CardComponent key={`banker-${index}`} card={card} delay={index * 0.3 + 0.3} />
              ))}
            </AnimatePresence>
          </div>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-lg font-bold text-white"
            >
              Total: {lastResult.bankerTotal}
            </motion.div>
          )}
        </div>

        {/* Game Table */}
        <div className="glass-panel p-6 rounded-2xl text-center">
          {lastResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className={`text-2xl font-bold ${
                lastResult.winner === 'player' ? 'text-blue-400' :
                lastResult.winner === 'banker' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {lastResult.winner.toUpperCase()} WINS!
              </div>
              {lastResult.payout > 0 && (
                <div className="text-lg text-green-400 font-semibold">
                  Won: ◎ {lastResult.payout.toFixed(2)}
                </div>
              )}
              <div className="text-sm text-white/70">
                Player: {lastResult.playerTotal} | Banker: {lastResult.bankerTotal}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="text-4xl">🎲</div>
              <div className="text-lg text-white/70">Place your bets</div>
              <div className="text-sm text-white/50">Choose Player, Banker, or Tie</div>
            </div>
          )}
        </div>

        {/* Player Cards */}
        <div className="text-center">
          <h3 className="text-sm text-white/70 mb-3">Player</h3>
          <div className="flex justify-center space-x-2 mb-2">
            <AnimatePresence>
              {lastResult?.playerCards.map((card, index) => (
                <CardComponent key={`player-${index}`} card={card} delay={index * 0.3} />
              ))}
            </AnimatePresence>
          </div>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-lg font-bold text-white"
            >
              Total: {lastResult.playerTotal}
            </motion.div>
          )}
        </div>

        {/* Game History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Results</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameHistory.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  result.payout > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span className={`font-semibold ${
                  result.winner === 'player' ? 'text-blue-400' :
                  result.winner === 'banker' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {result.winner.charAt(0).toUpperCase() + result.winner.slice(1)}
                </span>
                <span>
                  {result.payout > 0 ? '+' : '-'}◎ {result.payout > 0 ? result.payout.toFixed(2) : (result.playerBet + result.bankerBet + result.tieBet).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UniversalGameTemplate>
  );
}
