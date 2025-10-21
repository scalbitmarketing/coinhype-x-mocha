import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import StandardGameUI from '@/react-app/components/StandardGameUI';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import Logo from '@/react-app/components/Logo';
import SoundManager from '@/react-app/utils/sounds';
import { calculateCoinFlipResult, FINANCIAL_CONFIG } from '@/react-app/utils/preciseGameLogic';
import { COINFLIP_CONFIG } from '@/react-app/config/gameConfig';

interface CoinFlipResult {
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails';
  win: boolean;
  payout: number;
}

export default function CoinFlipGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentResult, setCurrentResult] = useState<'heads' | 'tails' | null>(null);
  const [lastResult, setLastResult] = useState<CoinFlipResult | null>(null);
  const [gameHistory, setGameHistory] = useState<CoinFlipResult[]>([]);
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const flipCoin = async () => {
    if (currentBalance < currentBet || isFlipping) return;
    
    setIsFlipping(true);
    setPlaying(true);
    playSound('click');
    
    placeBet(currentBet);

    // Animate coin flip
    setTimeout(() => {
      const betInteger = FINANCIAL_CONFIG.toInteger(currentBet, !!isRealMode);
      const gameResult = calculateCoinFlipResult(betInteger, choice, !!isRealMode);
      const result = gameResult.details.result;
      const win = gameResult.win;
      const payout = gameResult.payoutDisplay;

      setCurrentResult(result);
      
      const coinResult: CoinFlipResult = {
        choice,
        result,
        win,
        payout
      };

      setLastResult(coinResult);
      setGameHistory(prev => [coinResult, ...prev.slice(0, 9)]);

      if (win) {
        playSound('win');
        if (!isRealMode) {
          addWin(payout);
        }
      }

      if (isRealMode) {
        try {
          fetch('/api/games/coinflip/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              playerChoice: choice,
            }),
          }).then(() => refreshBalance()).catch(console.error);
        } catch (error) {
          console.error('Coin flip game error:', error);
        }
      }

      setIsFlipping(false);
      setPlaying(false);
    }, 2000);
  };

  const gameStats = [
    { label: 'Win Chance', value: '50%', color: 'text-green-400' },
    { label: 'Payout', value: `${COINFLIP_CONFIG.PAYOUT.toFixed(2)}x`, color: 'text-blue-400' },
    { label: 'House Edge', value: `${((1 - COINFLIP_CONFIG.HOUSE_RETURN) * 100).toFixed(1)}%`, color: 'text-gray-400' },
    { label: 'Last Result', value: lastResult?.result || 'None', color: lastResult?.win ? 'text-green-400' : 'text-red-400' }
  ];

  const gameRules = [
    'Choose heads or tails',
    'Coin flip determines the winner',
    '50% chance to win on each flip',
    '1.96x payout for correct guess',
    'All results are cryptographically random'
  ];

  return (
    <GameBackground theme="coinflip">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 flex justify-center">
            <Logo size="medium" />
          </div>
          <div className="flex-shrink-0">
            <BalanceDisplay />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StandardGameUI
          gameTitle="Coin Flip"
          gameRules={gameRules}
          gameStats={gameStats}
          actionButton={{
            text: isFlipping ? 'Flipping...' : `Flip Coin - ${isRealMode ? '◎' : '$'}${currentBet.toFixed(isRealMode ? 4 : 2)}`,
            onClick: flipCoin,
            disabled: currentBalance < currentBet || isFlipping,
            loading: isFlipping
          }}
          disabled={isFlipping}
        >
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Choose Your Side</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setChoice('heads')}
                disabled={isFlipping}
                className={`p-4 rounded-lg border-2 transition-all ${
                  choice === 'heads'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                } disabled:opacity-50`}
              >
                <div className="text-2xl mb-2">🪙</div>
                <div className="font-bold">Heads</div>
                <div className="text-sm text-gray-400">Front side</div>
              </button>
              
              <button
                onClick={() => setChoice('tails')}
                disabled={isFlipping}
                className={`p-4 rounded-lg border-2 transition-all ${
                  choice === 'tails'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                } disabled:opacity-50`}
              >
                <div className="text-2xl mb-2">🪙</div>
                <div className="font-bold">Tails</div>
                <div className="text-sm text-gray-400">Back side</div>
              </button>
            </div>
          </div>

          {/* Coin Display */}
          <div className="glass-panel p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 mb-2">
                Your choice: <span className="text-cyan-400 font-bold capitalize">{choice}</span>
              </p>
            </div>

            <div className="relative">
              <motion.div
                className={`w-24 h-24 rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg ${
                  isFlipping ? 'animate-spin' : ''
                }`}
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.6)) drop-shadow(0 0 40px rgba(252, 211, 77, 0.4))',
                  animationDuration: isFlipping ? '0.1s' : undefined
                }}
                animate={isFlipping ? { 
                  rotateY: [0, 180, 360, 540, 720],
                  scale: [1, 1.1, 1, 1.1, 1]
                } : {}}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                {currentResult ? (currentResult === 'heads' ? 'H' : 'T') : '?'}
              </motion.div>
            </div>

            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <div className={`text-2xl font-bold mb-2 ${lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.win ? 'You Win!' : 'You Lose!'}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Result: <span className="capitalize text-white">{lastResult.result}</span>
                </div>
                <div className={`text-xl font-bold ${lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                    lastResult.win ? lastResult.payout.toFixed(isRealMode ? 4 : 2) : 
                    currentBet.toFixed(isRealMode ? 4 : 2)
                  }
                </div>
              </motion.div>
            )}
          </div>

          {/* History */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Flip History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameHistory.length > 0 ? (
                gameHistory.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${
                      result.win 
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white capitalize">{result.choice}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-sm text-white capitalize">{result.result}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? 'WIN' : 'LOSE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {result.choice === result.result ? 'Correct guess!' : 'Wrong guess'}
                      </span>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                          result.win ? result.payout.toFixed(isRealMode ? 4 : 2) : 
                          currentBet.toFixed(isRealMode ? 4 : 2)
                        }
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No flips yet</p>
                </div>
              )}
            </div>
          </div>
        </StandardGameUI>
      </main>
    </GameBackground>
  );
}
