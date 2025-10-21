import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface GameGuide {
  id: string;
  name: string;
  icon: string;
  description: string;
  rules: string[];
  tips: string[];
}

const GAME_GUIDES: GameGuide[] = [
  {
    id: 'dice',
    name: 'Dice',
    icon: '🎲',
    description: 'Roll under your target number to win. Lower targets = higher multipliers.',
    rules: [
      'Choose a target number between 1.01 and 99',
      'Roll the dice - if the result is under your target, you win',
      'Lower targets have higher payouts but lower win chances',
      'Payout = 99 ÷ (Target - 1)'
    ],
    tips: [
      'Start with higher targets (50+) for better win chances',
      'Lower targets (10-20) offer big multipliers but high risk',
      'Use the auto-bet feature for consistent strategy'
    ]
  },
  {
    id: 'crash',
    name: 'Crash',
    icon: '🚀',
    description: 'Cash out before the rocket crashes. The longer you wait, the higher the multiplier.',
    rules: [
      'Place your bet before the round starts',
      'Watch the multiplier increase as the rocket flies',
      'Cash out manually or set an auto-cashout target',
      'If the rocket crashes before you cash out, you lose your bet'
    ],
    tips: [
      'Set reasonable auto-cashout targets (1.5x - 3x)',
      'Watch for patterns but remember each round is independent',
      'Consider cashing out early for consistent small wins'
    ]
  },
  {
    id: 'mines',
    name: 'Mines',
    icon: '💎',
    description: 'Reveal gems while avoiding mines. More gems found = higher multipliers.',
    rules: [
      'Choose the number of mines (1-24)',
      'Click tiles to reveal gems or mines',
      'Each gem increases your multiplier',
      'Hit a mine and lose everything, or cash out to secure wins'
    ],
    tips: [
      'Fewer mines = safer but lower multipliers',
      'More mines = higher risk but bigger potential payouts',
      'Consider cashing out after finding 2-3 gems'
    ]
  },
  {
    id: 'plinko',
    name: 'Plinko',
    icon: '⚪',
    description: 'Drop balls through pegs to land in multiplier slots at the bottom.',
    rules: [
      'Choose risk level: Low, Medium, or High',
      'Drop balls and watch them bounce through pegs',
      'Center slots have lower multipliers, edges have higher ones',
      'Risk level affects the multiplier distribution'
    ],
    tips: [
      'High risk offers better edge multipliers but more losses',
      'Low risk is safer with more consistent small wins',
      'Balls can land anywhere - it\'s all about probability'
    ]
  },
  {
    id: 'slots',
    name: 'Slots',
    icon: '🍒',
    description: 'Match symbols across the reels to win. Different symbols have different values.',
    rules: [
      'Spin the 3 reels to get random symbols',
      '3 matching symbols = biggest win',
      '2 matching symbols = smaller win',
      'Higher value symbols give bigger multipliers'
    ],
    tips: [
      'All spins are random - there\'s no pattern to follow',
      'Higher value symbols are rarer but pay more',
      'Set a budget and stick to it'
    ]
  },
  {
    id: 'roulette',
    name: 'Roulette',
    icon: '🔴',
    description: 'Bet on where the ball will land on the spinning wheel.',
    rules: [
      'Place bets on red/black, odd/even, numbers, or ranges',
      'European roulette with single zero (0)',
      'Different bets have different odds and payouts',
      'Ball landing on 0 means most bets lose'
    ],
    tips: [
      'Red/Black and Odd/Even offer the best odds (nearly 50%)',
      'Straight number bets pay 35:1 but have low win chances',
      'Avoid betting systems - each spin is independent'
    ]
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    icon: '♠️',
    description: 'Get as close to 21 as possible without going over, and beat the dealer.',
    rules: [
      'Cards 2-10 are face value, J/Q/K = 10, A = 1 or 11',
      'Get closer to 21 than dealer without busting (going over)',
      'Blackjack (A + 10-value) pays 2.5:1',
      'Dealer hits on 16, stands on 17'
    ],
    tips: [
      'Hit on 11 or less, stand on 17 or more',
      'Be careful with 12-16 when dealer shows 7-A',
      'Basic strategy gives you the best odds'
    ]
  },
  {
    id: 'coinflip',
    name: 'Coin Flip',
    icon: '🪙',
    description: 'Simple 50/50 game - choose heads or tails.',
    rules: [
      'Choose heads (crown) or tails (building)',
      'Flip the coin and see the result',
      'Correct guess pays 1.98x (1% house edge)',
      'Each flip is completely random'
    ],
    tips: [
      'Truly random - no patterns to follow',
      'Good for beginners due to simple rules',
      'Manage your bankroll with proper bet sizing'
    ]
  }
];

export default function HowToPlay() {
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const toggleGame = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
        <HelpCircle className="w-5 h-5" />
        <span>How to Play</span>
      </h3>

      <div className="space-y-3">
        {GAME_GUIDES.map((game) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleGame(game.id)}
              className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{game.icon}</span>
                  <div>
                    <div className="text-white font-medium">{game.name}</div>
                    <div className="text-sm text-gray-400">{game.description}</div>
                  </div>
                </div>
                {expandedGame === game.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedGame === game.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-900/50 border-t border-white/10">
                    {/* Rules */}
                    <div className="mb-4">
                      <h4 className="text-md font-bold text-white mb-2">Rules</h4>
                      <div className="space-y-1">
                        {game.rules.map((rule, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-300">{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-md font-bold text-white mb-2">Tips</h4>
                      <div className="space-y-1">
                        {game.tips.map((tip, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-300">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* General Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">General Gaming Tips</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <p>• <strong>Set a budget:</strong> Never bet more than you can afford to lose</p>
          <p>• <strong>Take breaks:</strong> Step away regularly to maintain clear judgment</p>
          <p>• <strong>Understand the odds:</strong> All games have a house edge</p>
          <p>• <strong>Demo mode:</strong> Practice with demo funds before using real money</p>
          <p>• <strong>Responsible gaming:</strong> Gaming should be fun, not stressful</p>
        </div>
      </motion.div>
    </div>
  );
}
