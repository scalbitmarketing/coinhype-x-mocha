import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, DollarSign, Users, AlertTriangle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function ResponsibleGaming() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casino</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Responsible Gaming</h1>
          </div>
          <p className="text-gray-400">Your wellbeing is our priority. Play safely and responsibly.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Gaming Guidelines */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Heart className="w-6 h-6 text-pink-400" />
              <span>Gaming Guidelines</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-cyan-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Set Time Limits</h3>
                    <p className="text-gray-300 text-sm">Decide how long you want to play before you start and stick to it.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Set Budget Limits</h3>
                    <p className="text-gray-300 text-sm">Only gamble with money you can afford to lose. Never chase losses.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Stay Social</h3>
                    <p className="text-gray-300 text-sm">Don't let gambling interfere with your relationships and social life.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white">Warning Signs</h3>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Gambling more than you can afford</li>
                  <li>• Spending more time than intended</li>
                  <li>• Chasing losses with bigger bets</li>
                  <li>• Gambling to escape problems</li>
                  <li>• Neglecting responsibilities</li>
                  <li>• Lying about gambling activities</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Self-Exclusion Tools */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Self-Exclusion & Controls</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400">Available Tools</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-1">Deposit Limits</h4>
                    <p className="text-sm text-gray-300">Set daily, weekly, or monthly deposit limits.</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-1">Session Time Limits</h4>
                    <p className="text-sm text-gray-300">Automatically end sessions after a set time.</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-1">Self-Exclusion</h4>
                    <p className="text-sm text-gray-300">Temporarily or permanently exclude yourself from playing.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
                <p className="text-gray-300 mb-4 text-sm">
                  If you're struggling with gambling, professional help is available.
                </p>
                <div className="space-y-3">
                  <a
                    href="https://www.gamblersanonymous.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    🔗 Gamblers Anonymous
                  </a>
                  <a
                    href="https://www.ncpgambling.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    🔗 National Council on Problem Gambling
                  </a>
                  <a
                    href="https://www.gamcare.org.uk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    🔗 GamCare Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Age Verification */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Age Verification</h2>
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-lg p-6">
              <p className="text-white font-semibold mb-2">🔞 You must be 18 or older to use CoinHype</p>
              <p className="text-gray-300 text-sm">
                We take underage gambling seriously. All users must verify their age before playing.
                If you are under 18, please leave this site immediately.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
