import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Shuffle, Hash } from 'lucide-react';
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

interface AndarBaharResult {
  jokerCard: Card;
  winingSide: 'andar' | 'bahar';
  andarCards: Card[];
  baharCards: Card[];
  andarBet: number;
  baharBet: number;
  payout: number;
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

export default function AndarBaharGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [andarBet, setAndarBet] = useState(0);
  const [baharBet, setBaharBet] = useState(0);
  const [jokerCard, setJokerCard] = useState<Card | null>(null);
  const [andarCards, setAndarCards] = useState<Card[]>([]);
  const [baharCards, setBaharCards] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [lastResult, setLastResult] = useState<AndarBaharResult | null>(null);
  const [gameHistory, setGameHistory] = useState<AndarBaharResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const totalBet = andarBet + baharBet;

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`andarbahar_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved andar bahar history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`andarbahar_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const dealCards = async () => {
    if (totalBet === 0 || totalBet > currentBalance || isDealing) return;

    setIsDealing(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct total bet
    placeBet(totalBet);
    
    // Clear previous game
    setAndarCards([]);
    setBaharCards([]);
    
    try {
      // Create and shuffle deck
      const deck = createDeck();
      const shuffledDeck = shuffleDeck(deck, `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`);
      
      // Draw joker card
      const joker = shuffledDeck[0];
      setJokerCard(joker);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Deal cards alternately starting with Andar
      let cardIndex = 1;
      let currentSide = 'andar';
      const andarPile: Card[] = [];
      const baharPile: Card[] = [];
      
      while (cardIndex < shuffledDeck.length) {
        const card = shuffledDeck[cardIndex];
        
        if (currentSide === 'andar') {
          andarPile.push(card);
          setAndarCards([...andarPile]);
        } else {
          baharPile.push(card);
          setBaharCards([...baharPile]);
        }
        
        soundManager.current.play('click');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check for match
        if (card.value === joker.value) {
          const winner = currentSide as 'andar' | 'bahar';
          
          // Calculate payout (0.9:1 for correct side)
          let payout = 0;
          if (winner === 'andar' && andarBet > 0) payout += andarBet * 1.9;
          if (winner === 'bahar' && baharBet > 0) payout += baharBet * 1.9;
          
          const result: AndarBaharResult = {
            jokerCard: joker,
            winingSide: winner,
            andarCards: andarPile,
            baharCards: baharPile,
            andarBet,
            baharBet,
            payout,
            hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
          };

          if (payout > 0) {
            addWin(payout);
            soundManager.current.play('win');
          } else {
            soundManager.current.play('lose');
          }

          setLastResult(result);
          setGameHistory(prev => [result, ...prev.slice(0, 49)]);
          
          // Clear bets
          setAndarBet(0);
          setBaharBet(0);
          
          // Increment nonce
          setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

          // API call for real mode
          if (isRealMode) {
            try {
              await fetch('/api/games/andarbahar/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  andarBet,
                  baharBet,
                  jokerValue: joker.value,
                  winningSide: winner,
                  serverSeed: result.hash.split(':')[0],
                  clientSeed: result.hash.split(':')[1],
                  nonce: parseInt(result.hash.split(':')[2])
                }),
              });
              await refreshBalance();
            } catch (error) {
              console.error('Andar Bahar API error:', error);
            }
          }
          
          break;
        }
        
        cardIndex++;
        currentSide = currentSide === 'andar' ? 'bahar' : 'andar';
      }

    } catch (error) {
      console.error('Andar Bahar game error:', error);
    } finally {
      setIsDealing(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Andar Bet', 
      value: `◎ ${andarBet.toFixed(2)}`, 
      color: 'text-blue-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Bahar Bet', 
      value: `◎ ${baharBet.toFixed(2)}`, 
      color: 'text-red-400',
      icon: <TrendingDown className="w-3 h-3" />
    },
    { 
      label: 'Total Bet', 
      value: `◎ ${totalBet.toFixed(2)}`, 
      color: 'text-purple-400',
      icon: <Shuffle className="w-3 h-3" />
    },
    { 
      label: 'Nonce', 
      value: `#${gameSeeds.nonce}`, 
      color: 'text-cyan-400',
      icon: <Hash className="w-3 h-3" />
    }
  ];

  const CardComponent = ({ card, delay = 0 }: { card: Card; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel w-12 h-16 flex flex-col items-center justify-center text-xs rounded"
    >
      <span className={`text-sm ${card.color === 'red' ? 'text-red-400' : 'text-white'}`}>
        {card.suit}
      </span>
      <span className="text-white font-bold">{card.rank}</span>
    </motion.div>
  );

  return (
    <UniversalGameTemplate
      gameName="Andar Bahar"
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-orange-900/20 via-red-900/20 to-yellow-900/20"
      actions={[
        {
          text: isDealing ? 'Dealing...' : `Deal Cards - ◎ ${totalBet.toFixed(2)}`,
          onClick: dealCards,
          disabled: totalBet === 0 || totalBet > currentBalance || isDealing,
          loading: isDealing
        }
      ]}
      customBetInput={
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Andar (0.9:1)</label>
            <input
              type="number"
              value={andarBet || ''}
              onChange={(e) => setAndarBet(Number(e.target.value) || 0)}
              min="0"
              max={currentBalance}
              step="0.01"
              className="input w-full text-center text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Bahar (0.9:1)</label>
            <input
              type="number"
              value={baharBet || ''}
              onChange={(e) => setBaharBet(Number(e.target.value) || 0)}
              min="0"
              max={currentBalance}
              step="0.01"
              className="input w-full text-center text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
      }
    >
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Joker Card */}
        <div className="text-center">
          <div className="text-sm text-white/70 mb-2">Joker Card</div>
          {jokerCard ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel w-20 h-28 mx-auto flex flex-col items-center justify-center rounded-lg"
            >
              <span className={`text-2xl ${jokerCard.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                {jokerCard.suit}
              </span>
              <span className="text-white font-bold">{jokerCard.rank}</span>
            </motion.div>
          ) : (
            <div className="glass-panel w-20 h-28 mx-auto flex items-center justify-center rounded-lg">
              <div className="text-2xl">🂠</div>
            </div>
          )}
        </div>

        {/* Game Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* Andar Side */}
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm text-blue-400 font-bold mb-3 text-center">ANDAR</h3>
            <div className="grid grid-cols-3 gap-1 min-h-[120px]">
              <AnimatePresence>
                {andarCards.map((card, index) => (
                  <CardComponent key={`andar-${index}`} card={card} delay={index * 0.3} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bahar Side */}
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm text-red-400 font-bold mb-3 text-center">BAHAR</h3>
            <div className="grid grid-cols-3 gap-1 min-h-[120px]">
              <AnimatePresence>
                {baharCards.map((card, index) => (
                  <CardComponent key={`bahar-${index}`} card={card} delay={index * 0.3} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-lg text-center"
          >
            <div className={`text-lg font-bold mb-2 ${
              lastResult.winingSide === 'andar' ? 'text-blue-400' : 'text-red-400'
            }`}>
              {lastResult.winingSide.toUpperCase()} WINS!
            </div>
            {lastResult.payout > 0 ? (
              <div className="text-green-400 font-semibold">
                Won: ◎ {lastResult.payout.toFixed(2)}
              </div>
            ) : (
              <div className="text-red-400">No Win</div>
            )}
            <div className="text-sm text-white/70 mt-2">
              Match found: {lastResult.jokerCard.rank} {lastResult.jokerCard.suit}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        {!jokerCard && !lastResult && (
          <div className="glass-panel p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">🃏</div>
            <div className="text-sm text-white/70 mb-2">How to play:</div>
            <div className="text-xs text-white/50 space-y-1">
              <div>• Bet on Andar (left) or Bahar (right)</div>
              <div>• Cards are dealt alternately starting with Andar</div>
              <div>• First side to match the joker's value wins</div>
              <div>• Winning bets pay 0.9:1 (house edge 5%)</div>
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
