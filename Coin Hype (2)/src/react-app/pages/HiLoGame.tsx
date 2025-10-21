import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Hash } from 'lucide-react';
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
  color: string;
}

interface HiLoResult {
  currentCard: Card;
  nextCard: Card;
  guess: 'higher' | 'lower';
  win: boolean;
  streak: number;
  totalPayout: number;
  hash: string;
}

const SUITS = [
  { symbol: '♠', color: 'black' },
  { symbol: '♥', color: 'red' },
  { symbol: '♦', color: 'red' },
  { symbol: '♣', color: 'black' }
];

const RANKS = [
  { symbol: 'A', value: 1 },
  { symbol: '2', value: 2 },
  { symbol: '3', value: 3 },
  { symbol: '4', value: 4 },
  { symbol: '5', value: 5 },
  { symbol: '6', value: 6 },
  { symbol: '7', value: 7 },
  { symbol: '8', value: 8 },
  { symbol: '9', value: 9 },
  { symbol: '10', value: 10 },
  { symbol: 'J', value: 11 },
  { symbol: 'Q', value: 12 },
  { symbol: 'K', value: 13 }
];

const MULTIPLIER_PER_WIN = 1.9;

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit: suit.symbol,
        rank: rank.symbol,
        value: rank.value,
        color: suit.color
      });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[], seed: string): Card[] => {
  const shuffled = [...deck];
  const seedNumber = parseInt(seed.slice(-8), 16);
  let rng = seedNumber;

  const seededRandom = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

export default function HiLoGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [lastResult, setLastResult] = useState<HiLoResult | null>(null);
  const [gameHistory, setGameHistory] = useState<HiLoResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`hilo_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved hi-lo history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`hilo_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const startNewGame = () => {
    if (currentBalance < currentBet) return;

    const newDeck = createDeck();
    const shuffledDeck = shuffleDeck(newDeck, `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`);
    
    setDeck(shuffledDeck);
    setCurrentCard(shuffledDeck[0]);
    setNextCard(null);
    setCardIndex(1);
    setStreak(0);
    setTotalWinnings(0);
    setIsPlaying(true);
    setLastResult(null);
    
    // Deduct initial bet
    placeBet(currentBet);
    setPlaying(true);
    soundManager.current.play('click');
  };

  const makeGuess = async (guess: 'higher' | 'lower') => {
    if (!currentCard || !deck[cardIndex] || isRevealing) return;

    setIsRevealing(true);
    soundManager.current.play('click');

    const next = deck[cardIndex];
    setNextCard(next);

    // Wait for flip animation
    await new Promise(resolve => setTimeout(resolve, 800));

    const isCorrect = (
      (guess === 'higher' && next.value > currentCard.value) ||
      (guess === 'lower' && next.value < currentCard.value) ||
      (next.value === currentCard.value) // Tie is considered correct
    );

    const newStreak = isCorrect ? streak + 1 : 0;
    const winAmount = isCorrect ? currentBet * Math.pow(MULTIPLIER_PER_WIN, newStreak) : 0;
    const newTotalWinnings = isCorrect ? totalWinnings + winAmount : 0;

    const result: HiLoResult = {
      currentCard,
      nextCard: next,
      guess,
      win: isCorrect,
      streak: newStreak,
      totalPayout: newTotalWinnings,
      hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
    };

    if (isCorrect) {
      soundManager.current.play('win');
      setStreak(newStreak);
      setTotalWinnings(newTotalWinnings);
      setCurrentCard(next);
      setCardIndex(prev => prev + 1);
    } else {
      soundManager.current.play('lose');
      setIsPlaying(false);
      setPlaying(false);
    }

    setLastResult(result);
    setGameHistory(prev => [result, ...prev.slice(0, 49)]);
    setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

    // Check if deck is running out
    if (cardIndex >= deck.length - 1) {
      setIsPlaying(false);
      setPlaying(false);
    }

    setIsRevealing(false);

    // API call for real mode
    if (isRealMode) {
      try {
        await fetch('/api/games/hilo/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            betAmount: currentBet,
            guess,
            currentCardValue: currentCard.value,
            nextCardValue: next.value,
            streak: newStreak,
            serverSeed: result.hash.split(':')[0],
            clientSeed: result.hash.split(':')[1],
            nonce: parseInt(result.hash.split(':')[2])
          }),
        });
        await refreshBalance();
      } catch (error) {
        console.error('Hi-Lo API error:', error);
      }
    }
  };

  const cashOut = () => {
    if (totalWinnings > 0) {
      addWin(totalWinnings);
      soundManager.current.play('win');
    }
    setIsPlaying(false);
    setPlaying(false);
  };

  const nextMultiplier = streak > 0 ? Math.pow(MULTIPLIER_PER_WIN, streak + 1) : MULTIPLIER_PER_WIN;

  const gameStats = [
    { 
      label: 'Streak', 
      value: `${streak}`, 
      color: 'text-blue-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Winnings', 
      value: `◎ ${totalWinnings.toFixed(2)}`, 
      color: 'text-green-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Next Win', 
      value: `${nextMultiplier.toFixed(2)}x`, 
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

  const CardComponent = ({ card, isHidden = false }: { card: Card | null; isHidden?: boolean }) => (
    <motion.div
      className="glass-panel w-20 h-28 flex flex-col items-center justify-center rounded-lg"
      initial={isHidden ? { rotateY: 180 } : {}}
      animate={isHidden ? { rotateY: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {card && !isHidden ? (
        <>
          <span className={`text-lg ${card.color === 'red' ? 'text-red-400' : 'text-white'}`}>
            {card.suit}
          </span>
          <span className="text-sm font-bold text-white">{card.rank}</span>
          <span className="text-xs text-white/70">{card.value}</span>
        </>
      ) : (
        <div className="text-2xl">🂠</div>
      )}
    </motion.div>
  );

  const actions = isPlaying ? [
    {
      text: 'Higher',
      onClick: () => makeGuess('higher'),
      disabled: isRevealing || !currentCard || cardIndex >= deck.length,
      loading: isRevealing
    },
    {
      text: 'Lower',
      onClick: () => makeGuess('lower'),
      disabled: isRevealing || !currentCard || cardIndex >= deck.length,
      loading: isRevealing
    },
    ...(totalWinnings > 0 ? [{
      text: `Cash Out - ◎ ${totalWinnings.toFixed(2)}`,
      onClick: cashOut,
      disabled: isRevealing,
      variant: 'secondary' as const
    }] : [])
  ] : [
    {
      text: `Start Game - ◎ ${currentBet.toFixed(2)}`,
      onClick: startNewGame,
      disabled: currentBalance < currentBet
    }
  ];

  return (
    <UniversalGameTemplate
      gameName="Hi-Lo"
      gameStats={gameStats}
      backgroundColor="from-red-900/20 via-purple-900/20 to-blue-900/20"
      actions={actions}
    >
      <div className="w-full max-w-sm mx-auto text-center space-y-6">
        {/* Cards Display */}
        <div className="flex justify-center items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-white/70 mb-2">Current</div>
            <CardComponent card={currentCard} />
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <div className="text-xs text-white/50">vs</div>
            <TrendingDown className="w-6 h-6 text-red-400" />
          </div>
          
          <div className="text-center">
            <div className="text-sm text-white/70 mb-2">Next</div>
            <CardComponent card={nextCard} isHidden={!nextCard} />
          </div>
        </div>

        {/* Game Status */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-lg"
          >
            <div className={`text-lg font-bold mb-2 ${
              lastResult.win ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastResult.win ? 'Correct!' : 'Wrong!'}
            </div>
            <div className="text-sm text-white/70">
              {lastResult.nextCard.value} is {lastResult.nextCard.value > lastResult.currentCard.value ? 'higher' : 
                lastResult.nextCard.value < lastResult.currentCard.value ? 'lower' : 'equal to'} {lastResult.currentCard.value}
            </div>
            {lastResult.win && (
              <div className="text-sm text-green-400 mt-2">
                Streak: {lastResult.streak} | Total: ◎ {lastResult.totalPayout.toFixed(2)}
              </div>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        {!isPlaying && !lastResult && (
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-lg mb-2">🃏</div>
            <div className="text-sm text-white/70 mb-2">How to play:</div>
            <div className="text-xs text-white/50 space-y-1">
              <div>• Guess if the next card is higher or lower</div>
              <div>• Each correct guess multiplies by 1.9x</div>
              <div>• Build a streak for bigger payouts</div>
              <div>• Cash out anytime to keep winnings</div>
            </div>
          </div>
        )}

        {/* Progress */}
        {isPlaying && (
          <div className="glass-panel p-3 rounded-lg">
            <div className="flex justify-between text-xs text-white/70 mb-2">
              <span>Progress</span>
              <span>{Math.max(0, deck.length - cardIndex)} cards left</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((cardIndex) / deck.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
