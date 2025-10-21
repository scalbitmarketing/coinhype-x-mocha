import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from 'lucide-react';
import { runFrontendDebugTests, testGameComponent, testAnimationPerformance } from '@/react-app/utils/frontendDebugger';

interface DebugReport {
  gameLogic: Array<{
    game: string;
    component: string;
    test: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    details: string;
    error?: string;
  }>;
  animations: Array<{
    element: string;
    animation: string;
    status: 'WORKING' | 'BROKEN' | 'MISSING';
    details: string;
  }>;
  payouts: Array<{
    game: string;
    scenario: string;
    expectedPayout: number;
    displayedPayout: number | null;
    status: 'CORRECT' | 'INCORRECT' | 'MISSING';
    details: string;
  }>;
  backendDeps: Array<{
    endpoint: string;
    component: string;
    required: boolean;
    status: 'WORKING' | 'MISSING' | 'ERROR';
    error?: string;
  }>;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export default function FrontendDebugPanel() {
  const [report, setReport] = useState<DebugReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [animationPerf, setAnimationPerf] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      // Run comprehensive frontend tests
      const debugReport = runFrontendDebugTests();
      setReport(debugReport);
      
      // Test animation performance
      const perfResults = testAnimationPerformance();
      setAnimationPerf(perfResults);
      
    } catch (error) {
      console.error('Debug test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSpecificGameTest = async (gameName: string) => {
    setIsRunning(true);
    try {
      const gameTests = testGameComponent(gameName);
      setReport(prev => ({
        ...prev!,
        gameLogic: gameTests,
        summary: {
          totalTests: gameTests.length,
          passed: gameTests.filter(t => t.status === 'PASS').length,
          failed: gameTests.filter(t => t.status === 'FAIL').length,
          warnings: gameTests.filter(t => t.status === 'WARNING').length
        }
      }));
    } catch (error) {
      console.error('Game test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'WORKING':
      case 'CORRECT':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'FAIL':
      case 'BROKEN':
      case 'INCORRECT':
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'WARNING':
      case 'MISSING':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'WORKING':
      case 'CORRECT':
        return 'border-green-500/30 bg-green-500/10';
      case 'FAIL':
      case 'BROKEN':
      case 'INCORRECT':
      case 'ERROR':
        return 'border-red-500/30 bg-red-500/10';
      case 'WARNING':
      case 'MISSING':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const games = ['all', 'Dice', 'Crash', 'Plinko', 'CoinFlip', 'Slots', 'Mines', 'Roulette', 'Blackjack'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Frontend Game Debugger</h1>
                <p className="text-gray-400">Client-side logic, animations, and UX testing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {games.map(game => (
                  <option key={game} value={game}>{game === 'all' ? 'All Games' : game}</option>
                ))}
              </select>
              
              <motion.button
                onClick={() => selectedGame === 'all' ? runTests() : runSpecificGameTest(selectedGame)}
                disabled={isRunning}
                className="neon-button px-6 py-2 flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isRunning ? (
                  <RotateCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{report.summary.totalTests}</div>
                <div className="text-sm text-gray-400">Total Tests</div>
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{report.summary.passed}</div>
                <div className="text-sm text-gray-400">Passed</div>
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{report.summary.failed}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{report.summary.warnings}</div>
                <div className="text-sm text-gray-400">Warnings</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Game Logic Tests */}
          {report && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-white mb-4">Game Logic Tests</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.gameLogic.map((test, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(test.status)}
                          <span className="font-bold text-white">{test.game}</span>
                          <span className="text-sm text-gray-400">• {test.test}</span>
                        </div>
                        <p className="text-sm text-gray-300">{test.details}</p>
                        {test.error && (
                          <p className="text-xs text-red-400 mt-1">Error: {test.error}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Animation Tests */}
          {report && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-white mb-4">Animation Tests</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.animations.map((test, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(test.status)}
                      <span className="font-bold text-white">{test.element}</span>
                    </div>
                    <p className="text-sm text-gray-300">{test.details}</p>
                    <p className="text-xs text-gray-400">Animation: {test.animation}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Payout Tests */}
          {report && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-white mb-4">Payout Display Tests</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.payouts.map((test, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(test.status)}
                      <span className="font-bold text-white">{test.game}</span>
                      <span className="text-sm text-gray-400">• {test.scenario}</span>
                    </div>
                    <p className="text-sm text-gray-300">{test.details}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      Expected: {test.expectedPayout}x | Displayed: {test.displayedPayout}x
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Backend Dependencies */}
          {report && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-white mb-4">Backend Dependencies</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.backendDeps.slice(0, 8).map((dep, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${getStatusColor(dep.status)}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(dep.status)}
                      <span className="font-bold text-white">{dep.component}</span>
                      {dep.required && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Required</span>}
                    </div>
                    <p className="text-sm text-gray-300 font-mono">{dep.endpoint}</p>
                    {dep.error && (
                      <p className="text-xs text-yellow-400 mt-1">{dep.error}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Animation Performance */}
        {animationPerf && (
          <div className="glass-panel p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Animation Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-white">{animationPerf.testDuration.toFixed(2)}ms</div>
                <div className="text-sm text-gray-400">Test Duration</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-white">{animationPerf.animations.length}</div>
                <div className="text-sm text-gray-400">Animations Tested</div>
              </div>
              <div className={`p-4 rounded-lg ${
                animationPerf.overallPerformance === 'GOOD' ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}>
                <div className={`text-lg font-bold ${
                  animationPerf.overallPerformance === 'GOOD' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {animationPerf.overallPerformance}
                </div>
                <div className="text-sm text-gray-400">Overall Performance</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
