import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { runAllGameTests, testEdgeCases, TestResult } from '@/react-app/utils/gameTests';

interface GameTestPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function GameTestPanel({ isVisible, onClose }: GameTestPanelProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [edgeCaseIssues, setEdgeCaseIssues] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    
    // Run game tests
    const results = runAllGameTests();
    setTestResults(results);
    
    // Run edge case tests
    const edgeIssues = testEdgeCases();
    setEdgeCaseIssues(edgeIssues);
    
    setIsRunning(false);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🎯 Game Testing Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Test Controls */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={runTests}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all ${
                isRunning 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
              whileHover={!isRunning ? { scale: 1.05 } : {}}
              whileTap={!isRunning ? { scale: 0.95 } : {}}
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </motion.button>
            
            {testResults.length > 0 && (
              <div className="text-sm text-gray-400">
                {testResults.filter(r => r.passed).length}/{testResults.length} tests passed
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Game Test Results</h3>
              
              {testResults.map((result) => (
                <motion.div
                  key={result.game}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    result.passed 
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.passed)}
                      <h4 className="font-bold text-white">{result.game}</h4>
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.totalRounds.toLocaleString()} rounds
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Win Rate</div>
                      <div className={`font-bold ${
                        Math.abs(result.actualWinRate - result.expectedWinRate) < 0.02 
                          ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(result.actualWinRate * 100).toFixed(2)}% 
                        <span className="text-gray-500 ml-1">
                          (expected {(result.expectedWinRate * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">RTP (Return to Player)</div>
                      <div className={`font-bold ${
                        Math.abs(result.actualRTP - result.expectedRTP) < 0.02 
                          ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(result.actualRTP * 100).toFixed(2)}%
                        <span className="text-gray-500 ml-1">
                          (expected {(result.expectedRTP * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.issues.length > 0 && (
                    <div className="mt-3 p-2 bg-red-500/20 rounded border border-red-500/30">
                      <div className="flex items-center space-x-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Issues Found:</span>
                      </div>
                      <ul className="mt-1 text-sm text-red-300 list-disc list-inside">
                        {result.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Edge Case Results */}
          {edgeCaseIssues.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Edge Case Tests</h3>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-red-500/30 bg-red-500/10"
              >
                <div className="flex items-center space-x-2 text-red-400 mb-2">
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold">Edge Case Issues Found</span>
                </div>
                
                <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                  {edgeCaseIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </motion.div>
            </div>
          )}

          {/* Testing Guidelines */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Testing Guidelines</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-bold text-cyan-400 mb-2">Win Rate Validation</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Should match mathematical probability</li>
                  <li>• Variance acceptable within 2%</li>
                  <li>• No systematic bias detected</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-bold text-cyan-400 mb-2">RTP Requirements</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• House edge properly applied</li>
                  <li>• No negative RTPs</li>
                  <li>• Fair payout calculations</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-bold text-cyan-400 mb-2">Logic Checks</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• No impossible outcomes</li>
                  <li>• Proper tie handling</li>
                  <li>• Balance integrity maintained</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-bold text-cyan-400 mb-2">Edge Cases</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Extreme bet amounts</li>
                  <li>• Boundary conditions</li>
                  <li>• Error state handling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
