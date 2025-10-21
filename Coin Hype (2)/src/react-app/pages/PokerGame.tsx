import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Play, RotateCcw, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import BetControls from '@/react-app/components/BetControls';
import Logo from '@/react-app/components/Logo';
import GameBackground from '@/react-app/components/GameBackground';

import SoundManager from '@/react-app/utils/sounds';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numValue: number;
}

interface HandRank {
  name: string;
  rank: number;
  multiplier: number;
}

interface GameResult {
  playerCards: Card[];
  finalHand: HandRank;
  payout: number;
  win: boolean;
}

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const HAND_RANKS: HandRank[] = [
  { name: 'Royal Flush', rank: 10, multiplier: 250 },
  { name: 'Straight Flush', rank: 9, multiplier: 50 },
  { name: 'Four of a Kind', rank: 8, multiplier: 25 },
  { name: 'Full House', rank: 7, multiplier: 9 },
  { name: 'Flush', rank: 6, multiplier: 6 },
  { name: 'Straight', rank: 5, multiplier: 4 },
  { name: 'Three of a Kind', rank: 4, multiplier: 3 },
  { name: 'Two Pair', rank: 3, multiplier: 2 },
  { name: 'Jacks or Better', rank: 2, multiplier: 1 },
  { name: 'High Card', rank: 1, multiplier: 0 }
];

export default function PokerGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [gameState, setGameState] = useState<'betting' | 'initial' | 'draw' | 'finished'>('betting');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<boolean[]>([false, false, false, false, false]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const createDeck = (): Card[] => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (let i = 0; i < VALUES.length; i++) {
        const value = VALUES[i];
        let numValue = i + 2; // 2-14, where Ace = 14
        if (value === 'A') numValue = 14;
        
        newDeck.push({ suit, value, numValue });
      }
    }
    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const evaluateHand = (cards: Card[]): HandRank => {
    const sortedCards = [...cards].sort((a, b) => a.numValue - b.numValue);
    
    // Count values and suits
    const valueCounts: { [key: number]: number } = {};
    const suitCounts: { [key: string]: number } = {};
    
    sortedCards.forEach(card => {
      valueCounts[card.numValue] = (valueCounts[card.numValue] || 0) + 1;
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    const isFlush = Object.values(suitCounts).some(count => count === 5);
    
    // Check for straight
    let isStraight = false;
    const uniqueValues = Object.keys(valueCounts).map(Number).sort((a, b) => a - b);
    
    // Check for exactly 5 consecutive values
    if (uniqueValues.length === 5) {
      isStraight = uniqueValues[4] - uniqueValues[0] === 4;
      
      // Check for A-2-3-4-5 straight (wheel)
      if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) && 
          uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
        isStraight = true;
      }
    }
    
    const isRoyalFlush = isFlush && isStraight && 
      uniqueValues.includes(14) && uniqueValues.includes(13) && 
      uniqueValues.includes(12) && uniqueValues.includes(11) && uniqueValues.includes(10);
    
    // Determine hand rank
    if (isRoyalFlush) return HAND_RANKS[0]; // Royal Flush
    if (isFlush && isStraight) return HAND_RANKS[1]; // Straight Flush
    if (counts[0] === 4) return HAND_RANKS[2]; // Four of a Kind
    if (counts[0] === 3 && counts[1] === 2) return HAND_RANKS[3]; // Full House
    if (isFlush) return HAND_RANKS[4]; // Flush
    if (isStraight) return HAND_RANKS[5]; // Straight
    if (counts[0] === 3) return HAND_RANKS[6]; // Three of a Kind
    if (counts[0] === 2 && counts[1] === 2) return HAND_RANKS[7]; // Two Pair
    
    // FIXED: Check for Jacks or Better (pair of J, Q, K, or A)
    if (counts[0] === 2) {
      const pairValue = Object.keys(valueCounts).find(value => valueCounts[Number(value)] === 2);
      if (pairValue && Number(pairValue) >= 11) { // J=11, Q=12, K=13, A=14
        return HAND_RANKS[8]; // Jacks or Better
      }
    }
    
    return HAND_RANKS[9]; // High Card
  };

  const dealInitialHand = async () => {
    if (currentBalance < currentBet) return;
    
    setGameState('initial');
    playSound('click');
    
    if (!isRealMode) {
      placeBet(currentBet);
    }
    
    const newDeck = createDeck();
    const initialCards = newDeck.splice(0, 5);
    
    setDeck(newDeck);
    setPlayerCards(initialCards);
    setSelectedCards([false, false, false, false, false]);
  };

  const toggleCardSelection = (index: number) => {
    if (gameState !== 'initial') return;
    
    const newSelected = [...selectedCards];
    newSelected[index] = !newSelected[index];
    setSelectedCards(newSelected);
    playSound('click');
  };

  const drawCards = async () => {
    setGameState('draw');
    
    let newDeck = [...deck];
    const newCards = [...playerCards];
    
    // Replace selected cards
    selectedCards.forEach((selected, index) => {
      if (selected && newDeck.length > 0) {
        newCards[index] = newDeck.pop()!;
      }
    });
    
    setDeck(newDeck);
    setPlayerCards(newCards);
    
    // Evaluate final hand
    setTimeout(() => {
      const finalHand = evaluateHand(newCards);
      const payout = finalHand.multiplier > 0 ? currentBet * finalHand.multiplier : 0;
      const win = payout > 0;
      
      const result: GameResult = {
        playerCards: newCards,
        finalHand,
        payout,
        win
      };
      
      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 9)]);
      setGameState('finished');
      
      if (win) {
        playSound('win');
        if (!isRealMode) {
          addWin(payout);
        }
      }
      
      if (isRealMode) {
        fetch('/api/games/poker/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            betAmountSol: currentBet,
            finalCards: newCards,
            handRank: finalHand.name,
          }),
        }).then(() => refreshBalance()).catch(console.error);
      }
    }, 1000);
  };

  const resetGame = () => {
    setGameState('betting');
    setPlayerCards([]);
    setSelectedCards([false, false, false, false, false]);
  };

  const getCardDisplay = (card: Card, index: number) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const isSelected = selectedCards[index];
    
    return (
      <motion.div
        className={`w-20 h-28 bg-white border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
          isRed ? 'text-red-600' : 'text-black'
        } ${isSelected ? 'border-purple-400 bg-purple-50 transform -translate-y-2' : 'border-gray-300 hover:border-gray-400'}`}
        style={{
          boxShadow: isSelected 
            ? '0 0 20px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.8)'
            : isRed 
            ? '0 0 10px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.8)'
            : '0 0 10px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.8)'
        }}
        onClick={() => toggleCardSelection(index)}
        whileHover={{ scale: gameState === 'initial' ? 1.05 : 1 }}
        whileTap={{ scale: gameState === 'initial' ? 0.95 : 1 }}
      >
        <div className="text-sm font-bold">{card.value}</div>
        <div className="text-2xl">{card.suit}</div>
        {/* Royal card shimmer effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${
          isSelected 
            ? 'from-purple-50/60 to-blue-100/40' 
            : isRed 
            ? 'from-red-50/50 to-red-100/30' 
            : 'from-gray-50/50 to-gray-100/30'
        }`}></div>
        {isSelected && gameState === 'initial' && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg"
               style={{
                 boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)'
               }}>
            HOLD
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <GameBackground theme="poker">
      {/* Poker-themed background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 text-3xl">👑</div>
        <div className="absolute top-48 right-32 text-xl">💎</div>
        <div className="absolute bottom-40 left-1/4 text-2xl">🏆</div>
        <div className="absolute top-1/3 right-1/3 text-lg">♠️</div>
        <div className="absolute bottom-1/3 right-1/4 text-2xl">♥️</div>
        <div className="absolute top-2/3 left-1/3 text-xl">♣️</div>
        {/* Royal sparkles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-gradient-to-br from-yellow-400 to-purple-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 left-1/4 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full animate-pulse"></div>
      </div>
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              onClick={() => navigate('/lobby')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Video Poker</h1>
            </div>
          </div>
          
          {/* Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Logo size="medium" />
          </div>
          <div className="text-right min-w-0 flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
              {isRealMode ? 'SOL Balance' : 'Demo Balance'}
            </p>
            <p className="text-lg sm:text-xl font-bold gradient-text">
              {isRealMode ? `◎${currentBalance.toFixed(4)}` : `$${currentBalance.toFixed(2)}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Game Controls */}
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <BetControls disabled={gameState === 'initial' || gameState === 'draw'} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Paytable</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {HAND_RANKS.slice(0, -1).map((hand) => (
                  <div key={hand.name} className="flex items-center justify-between p-2 rounded bg-gray-700/50">
                    <span className="text-sm text-gray-300">{hand.name}</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {hand.multiplier}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {gameState === 'betting' && (
                <motion.button
                  onClick={dealInitialHand}
                  disabled={currentBalance < currentBet}
                  className={`w-full p-4 text-lg font-bold rounded-lg transition-all ${
                    currentBalance < currentBet 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'neon-button'
                  }`}
                  whileHover={currentBalance >= currentBet ? { scale: 1.02 } : {}}
                  whileTap={currentBalance >= currentBet ? { scale: 0.98 } : {}}
                >
                  <Play className="w-5 h-5 inline mr-2" />
                  Deal - {isRealMode ? '◎' : '$'}{currentBet.toFixed(isRealMode ? 4 : 2)}
                </motion.button>
              )}

              {gameState === 'initial' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 text-center">
                    Select cards to hold, then draw
                  </p>
                  <motion.button
                    onClick={drawCards}
                    className="w-full p-4 text-lg font-bold rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Draw Cards
                  </motion.button>
                </div>
              )}

              {gameState === 'finished' && (
                <button
                  onClick={resetGame}
                  className="w-full p-4 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 inline mr-2" />
                  New Game
                </button>
              )}
            </div>
          </div>

          {/* Game Table */}
          <div className="glass-panel p-8 relative overflow-hidden">
            {/* Poker-themed royal glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-yellow-500/5 to-blue-500/5 pointer-events-none"></div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Your Hand</h3>
              
              {playerCards.length > 0 && (
                <div className="flex justify-center space-x-2 mb-6">
                  {playerCards.map((card, index) => (
                    <div key={index} className="relative">
                      {getCardDisplay(card, index)}
                    </div>
                  ))}
                </div>
              )}

              {gameState === 'initial' && (
                <p className="text-cyan-400 text-sm mb-4">
                  Click cards to hold them • {selectedCards.filter(Boolean).length} cards selected
                </p>
              )}

              {lastResult && gameState === 'finished' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className={`text-2xl font-bold ${
                    lastResult.win ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {lastResult.finalHand.name}
                  </div>
                  {lastResult.win ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <Trophy className="w-6 h-6" />
                        <span className="text-2xl font-bold">
                          {lastResult.finalHand.multiplier}x
                        </span>
                      </div>
                      <div className="text-xl text-green-400">
                        +{isRealMode ? '◎' : '$'}{lastResult.payout.toFixed(isRealMode ? 4 : 2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl text-red-400">
                      -{isRealMode ? '◎' : '$'}{currentBet.toFixed(isRealMode ? 4 : 2)}
                    </div>
                  )}
                </motion.div>
              )}

              {gameState === 'betting' && (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🃏</div>
                  <p>Place your bet and deal cards</p>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Game History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameHistory.length > 0 ? (
                gameHistory.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${
                      result.win 
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">
                        {result.finalHand.name}
                      </span>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? `${result.finalHand.multiplier}x` : 'Loss'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {result.playerCards.slice(0, 3).map((card, i) => (
                          <span key={i} className="text-xs">
                            {card.value}{card.suit}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{(result.win ? result.payout : currentBet).toFixed(isRealMode ? 4 : 2)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No games played yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </GameBackground>
  );
}
