import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Spade, Hand, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import BetControls from '@/react-app/components/BetControls';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';

import SoundManager from '@/react-app/utils/sounds';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numValue: number;
  hidden: boolean;
}

interface Hand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBust: boolean;
  isSoft: boolean;
}

interface GameResult {
  playerHand: Hand;
  dealerHand: Hand;
  outcome: 'player_win' | 'dealer_win' | 'push' | 'player_blackjack' | 'dealer_blackjack';
  payout: number;
}

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const HIT_SOFT_17 = false; // Casino rule: dealer stands on soft 17

export default function BlackjackGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Hand>({ cards: [], value: 0, isBlackjack: false, isBust: false, isSoft: false });
  const [dealerHand, setDealerHand] = useState<Hand>({ cards: [], value: 0, isBlackjack: false, isBust: false, isSoft: false });
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [canDoubleDown, setCanDoubleDown] = useState(false);
  const [hasDoubled, setHasDoubled] = useState(false);
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  // FIXED: Enhanced Ace-aware hand scoring with precise blackjack detection
  const scoreHand = (cards: Card[], includeHidden: boolean = true): { value: number; isBlackjack: boolean; isBust: boolean; isSoft: boolean } => {
    let value = 0;
    let aces = 0;
    let countedCards = 0;
    
    // Count visible cards only (unless explicitly including hidden)
    for (const card of cards) {
      if (card.hidden && !includeHidden) continue;
      
      countedCards++;
      if (card.value === 'A') {
        aces++;
        value += 11; // Start with Ace as 11
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // FIXED: Downgrade Aces from 11 to 1 until total ≤ 21
    let acesAs11 = aces;
    while (value > 21 && acesAs11 > 0) {
      value -= 10; // Convert Ace from 11 to 1
      acesAs11--;
    }
    
    const isSoft = acesAs11 > 0; // Hand has at least one Ace counted as 11
    const isBlackjack = countedCards === 2 && value === 21; // True blackjack: exactly 2 cards totaling 21
    const isBust = value > 21;
    
    return { value, isBlackjack, isBust, isSoft };
  };

  const createDeck = (): Card[] => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        newDeck.push({ suit, value, numValue, hidden: false });
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

  const dealCard = (fromDeck: Card[], toHand: Card[], hidden = false): { newDeck: Card[]; newHand: Card[] } => {
    const newDeck = [...fromDeck];
    const newHand = [...toHand];
    const card = newDeck.pop();
    
    if (card) {
      newHand.push({ ...card, hidden: hidden });
    }
    
    return { newDeck, newHand };
  };

  const startGame = async () => {
    if (currentBalance < currentBet) return;
    
    setGameState('playing');
    setHasDoubled(false);
    setLastResult(null);
    playSound('click');
    
    if (!isRealMode) {
      placeBet(currentBet);
    }
    
    // Create new deck and deal initial cards
    let newDeck = createDeck();
    let playerCards: Card[] = [];
    let dealerCards: Card[] = [];
    
    // Deal two cards to player
    ({ newDeck, newHand: playerCards } = dealCard(newDeck, playerCards));
    ({ newDeck, newHand: playerCards } = dealCard(newDeck, playerCards));
    
    // Deal two cards to dealer (second one hidden)
    ({ newDeck, newHand: dealerCards } = dealCard(newDeck, dealerCards));
    ({ newDeck, newHand: dealerCards } = dealCard(newDeck, dealerCards, true));
    
    setDeck(newDeck);
    
    // Calculate hand values using proper scoring
    const playerHandValue = scoreHand(playerCards, true);
    const dealerHandValue = scoreHand(dealerCards, false); // Don't include hidden card for display
    
    setPlayerHand({ cards: playerCards, ...playerHandValue });
    setDealerHand({ cards: dealerCards, ...dealerHandValue });
    
    setCanDoubleDown(playerCards.length === 2 && currentBalance >= currentBet * 2);
    
    // Check for immediate blackjack or dealer blackjack
    const dealerPeekValue = scoreHand(dealerCards, true); // Check dealer's actual hand for blackjack
    
    if (playerHandValue.isBlackjack || dealerPeekValue.isBlackjack) {
      // If either player has blackjack, go straight to showdown
      setTimeout(() => stand(), 1000);
    }
  };

  const hit = () => {
    const { newDeck, newHand } = dealCard(deck, playerHand.cards);
    setDeck(newDeck);
    
    const handValue = scoreHand(newHand, true);
    setPlayerHand({ cards: newHand, ...handValue });
    setCanDoubleDown(false);
    
    playSound('click');
    
    if (handValue.isBust) {
      setTimeout(() => endGame(), 1000);
    }
  };

  const stand = () => {
    // Start dealer play by revealing hidden card
    let currentDealerCards = dealerHand.cards.map(card => ({ ...card, hidden: false }));
    let currentDeck = [...deck];
    
    // Implement proper dealer draw loop
    let dealerValue = scoreHand(currentDealerCards, true);
    
    // Dealer must hit on 16 and stand on 17 (soft 17 rule depends on casino)
    while (dealerValue.value < 17 || (HIT_SOFT_17 && dealerValue.value === 17 && dealerValue.isSoft)) {
      const { newDeck, newHand } = dealCard(currentDeck, currentDealerCards);
      currentDeck = newDeck;
      currentDealerCards = newHand;
      dealerValue = scoreHand(currentDealerCards, true);
    }
    
    setDeck(currentDeck);
    
    // Update dealer hand with final cards and value
    const finalDealerHand = { cards: currentDealerCards, ...dealerValue };
    setDealerHand(finalDealerHand);
    
    // End game after a short delay to show final dealer hand
    setTimeout(() => endGame(), 1500);
  };

  const doubleDown = () => {
    if (!canDoubleDown || hasDoubled) return;
    
    setHasDoubled(true);
    setCanDoubleDown(false);
    
    if (!isRealMode) {
      placeBet(currentBet); // Double the bet
    }
    
    // Hit once and stand
    const { newDeck, newHand } = dealCard(deck, playerHand.cards);
    setDeck(newDeck);
    
    const handValue = scoreHand(newHand, true);
    setPlayerHand({ cards: newHand, ...handValue });
    
    playSound('click');
    
    setTimeout(() => {
      if (!handValue.isBust) {
        stand();
      } else {
        endGame();
      }
    }, 1000);
  };

  const endGame = () => {
    setGameState('finished');
    
    // Get current hands with all cards revealed
    const revealedPlayerCards = playerHand.cards.map(card => ({ ...card, hidden: false }));
    const revealedDealerCards = dealerHand.cards.map(card => ({ ...card, hidden: false }));
    
    // Calculate final hand values with proper scoring
    const finalPlayerValue = scoreHand(revealedPlayerCards, true);
    const finalDealerValue = scoreHand(revealedDealerCards, true);
    
    let outcome: 'player_win' | 'dealer_win' | 'push' | 'player_blackjack' | 'dealer_blackjack';
    let payout = 0;
    const betAmount = hasDoubled ? currentBet * 2 : currentBet;
    
    // FIXED: Proper blackjack outcome determination with correct order
    if (finalPlayerValue.isBust) {
      // Player bust always loses (dealer doesn't even need to play)
      outcome = 'dealer_win';
      payout = 0;
    } else if (finalDealerValue.isBust) {
      // Dealer bust, player wins if not already busted
      outcome = 'player_win';
      payout = betAmount * 2; // Return bet + equal winnings (1:1)
    } else if (finalPlayerValue.isBlackjack && finalDealerValue.isBlackjack) {
      // Both have blackjack → push
      outcome = 'push';
      payout = betAmount; // Return bet only
    } else if (finalPlayerValue.isBlackjack && !finalDealerValue.isBlackjack) {
      // Player blackjack beats dealer non-blackjack → player wins 3:2
      outcome = 'player_blackjack';
      payout = betAmount + (betAmount * 1.5); // Return bet + 1.5x winnings (3:2 payout)
    } else if (!finalPlayerValue.isBlackjack && finalDealerValue.isBlackjack) {
      // Dealer blackjack beats player non-blackjack → dealer wins
      outcome = 'dealer_blackjack';
      payout = 0;
    } else if (finalPlayerValue.value > finalDealerValue.value) {
      // Player has higher total → player wins
      outcome = 'player_win';
      payout = betAmount * 2; // Return bet + equal winnings (1:1)
    } else if (finalPlayerValue.value < finalDealerValue.value) {
      // Dealer has higher total → dealer wins
      outcome = 'dealer_win';
      payout = 0;
    } else {
      // Same total → push
      outcome = 'push';
      payout = betAmount; // Return bet only
    }
    
    const result: GameResult = {
      playerHand: { cards: revealedPlayerCards, ...finalPlayerValue },
      dealerHand: { cards: revealedDealerCards, ...finalDealerValue },
      outcome,
      payout
    };
    
    setLastResult(result);
    setGameHistory(prev => [result, ...prev.slice(0, 9)]);
    
    if ((outcome === 'player_win' || outcome === 'player_blackjack') && payout > betAmount) {
      playSound('win');
      if (!isRealMode) {
        addWin(payout);
      }
    } else if (outcome === 'push' && !isRealMode) {
      addWin(payout); // Return the bet amount
    }
    
    if (isRealMode) {
      fetch('/api/games/blackjack/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          betAmountSol: betAmount,
          playerCards: revealedPlayerCards,
          dealerCards: revealedDealerCards,
          outcome,
        }),
      }).then(() => refreshBalance()).catch(console.error);
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setPlayerHand({ cards: [], value: 0, isBlackjack: false, isBust: false, isSoft: false });
    setDealerHand({ cards: [], value: 0, isBlackjack: false, isBust: false, isSoft: false });
    setLastResult(null);
    setCanDoubleDown(false);
    setHasDoubled(false);
  };

  const getCardDisplay = (card: Card) => {
    if (card.hidden) {
      return (
        <div className="w-16 h-24 bg-blue-800 border border-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden"
             style={{
               boxShadow: '0 0 10px rgba(37, 99, 235, 0.4)'
             }}>
          <div className="text-white text-xs">🂠</div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-800/20"></div>
        </div>
      );
    }
    
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`w-16 h-24 bg-white border-2 rounded-lg flex flex-col items-center justify-center relative overflow-hidden ${
        isRed ? 'text-red-600 border-red-200' : 'text-black border-gray-200'
      }`}
           style={{
             boxShadow: isRed 
               ? '0 0 10px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.8)'
               : '0 0 10px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.8)'
           }}>
        <div className="text-xs font-bold">{card.value}</div>
        <div className="text-lg">{card.suit}</div>
        <div className={`absolute inset-0 bg-gradient-to-br ${
          isRed ? 'from-red-50/50 to-red-100/30' : 'from-gray-50/50 to-gray-100/30'
        }`}></div>
      </div>
    );
  };

  const getOutcomeDisplay = (outcome: string) => {
    switch (outcome) {
      case 'player_blackjack': return 'BLACKJACK!';
      case 'player_win': return 'YOU WIN!';
      case 'dealer_win': case 'dealer_blackjack': return 'DEALER WINS';
      case 'push': return 'PUSH';
      default: return outcome.toUpperCase();
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'player_blackjack': case 'player_win': return 'text-green-400';
      case 'dealer_win': case 'dealer_blackjack': return 'text-red-400';
      case 'push': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <GameBackground theme="blackjack">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-[60]"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-2 min-w-0">
            <Spade className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <h1 className="text-lg font-bold text-white truncate">Blackjack</h1>
          </div>
          
          <div className="flex-shrink-0">
            <BalanceDisplay />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Game Controls */}
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <BetControls disabled={gameState === 'playing'} />
            </div>

            <div className="space-y-4">
              {gameState === 'betting' && (
                <motion.button
                  onClick={startGame}
                  disabled={currentBalance < currentBet}
                  className={`w-full p-4 text-lg font-bold rounded-lg transition-all ${
                    currentBalance < currentBet 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'neon-button'
                  }`}
                  whileHover={currentBalance >= currentBet ? { scale: 1.02 } : {}}
                  whileTap={currentBalance >= currentBet ? { scale: 0.98 } : {}}
                >
                  Deal Cards - {isRealMode ? '◎' : '$'}{currentBet.toFixed(isRealMode ? 4 : 2)}
                </motion.button>
              )}

              {gameState === 'playing' && !playerHand.isBust && !playerHand.isBlackjack && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={hit}
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors"
                  >
                    <Hand className="w-4 h-4 inline mr-1" />
                    Hit
                  </button>
                  <button
                    onClick={stand}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold transition-colors"
                  >
                    Stand
                  </button>
                  {canDoubleDown && (
                    <button
                      onClick={doubleDown}
                      className="col-span-2 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold transition-colors"
                    >
                      Double Down
                    </button>
                  )}
                </div>
              )}

              {gameState === 'finished' && (
                <button
                  onClick={resetGame}
                  className="w-full p-4 text-lg font-bold rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 inline mr-2" />
                  New Game
                </button>
              )}
            </div>
          </div>

          {/* Game Table */}
          <div className="glass-panel p-8 relative overflow-hidden">
            {/* Blackjack-themed glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-black/5 to-white/5 pointer-events-none"></div>
            
            {/* Dealer Hand */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">
                Dealer {gameState !== 'betting' && `(${dealerHand.value})`}
                {dealerHand.isSoft && gameState === 'finished' && <span className="text-gray-400 text-sm ml-1">soft</span>}
              </h3>
              <div className="flex space-x-2 justify-center">
                {dealerHand.cards.map((card, index) => (
                  <motion.div
                    key={`${card.suit}-${card.value}-${index}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {getCardDisplay(card)}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Game Result */}
            {lastResult && gameState === 'finished' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-8"
              >
                <div className={`text-2xl font-bold mb-2 ${getOutcomeColor(lastResult.outcome)}`}>
                  {getOutcomeDisplay(lastResult.outcome)}
                </div>
                <div className={`text-lg ${
                  lastResult.payout > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastResult.payout > 0 ? '+' : ''}{isRealMode ? '◎' : '$'}{lastResult.payout.toFixed(isRealMode ? 4 : 2)}
                </div>
              </motion.div>
            )}

            {/* Player Hand */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Player {gameState !== 'betting' && `(${playerHand.value})`}
                {playerHand.isSoft && <span className="text-gray-400 text-sm ml-1">soft</span>}
                {hasDoubled && <span className="text-yellow-400 ml-2">(Doubled)</span>}
              </h3>
              <div className="flex space-x-2 justify-center">
                {playerHand.cards.map((card, index) => (
                  <motion.div
                    key={`${card.suit}-${card.value}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {getCardDisplay(card)}
                  </motion.div>
                ))}
              </div>
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
                      result.outcome === 'player_win' || result.outcome === 'player_blackjack'
                        ? 'border-green-500/30 bg-green-500/10'
                        : result.outcome === 'dealer_win' || result.outcome === 'dealer_blackjack'
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-yellow-500/30 bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white capitalize">
                        {result.outcome === 'player_blackjack' ? 'Blackjack' : 
                         result.outcome === 'player_win' ? 'Win' :
                         result.outcome === 'dealer_win' || result.outcome === 'dealer_blackjack' ? 'Loss' : 'Push'}
                      </span>
                      <span className={`text-sm font-bold ${getOutcomeColor(result.outcome)}`}>
                        {result.payout > 0 ? '+' : ''}{isRealMode ? '◎' : '$'}{result.payout.toFixed(isRealMode ? 4 : 2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Player: {result.playerHand.value} | Dealer: {result.dealerHand.value}
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
