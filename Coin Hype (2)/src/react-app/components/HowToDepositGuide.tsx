import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react';

interface HowToDepositGuideProps {
  onClose?: () => void;
}

export default function HowToDepositGuide({}: HowToDepositGuideProps) {
  const steps = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Connect your Solana wallet (Phantom, Solflare, or Torus) to get started",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: ArrowRight,
      title: "Enter Deposit Amount",
      description: "Choose how much SOL you want to deposit (minimum 0.001 SOL)",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: CheckCircle,
      title: "Confirm Transaction",
      description: "Approve the transaction in your wallet to send SOL to our secure house wallet",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Clock,
      title: "Instant Credit",
      description: "Your balance is updated instantly after 1-2 blockchain confirmations",
      color: "from-orange-500 to-red-500"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Deposits",
      description: "Start playing within seconds"
    },
    {
      icon: Shield,
      title: "Secure Processing",
      description: "Military-grade encryption"
    },
    {
      icon: CheckCircle,
      title: "No Fees",
      description: "Only network gas fees apply"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">How to Deposit SOL</h3>
        <p className="text-gray-400 text-sm">
          Follow these simple steps to add SOL to your casino balance
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-4 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
              <step.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">{step.title}</h4>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>
            <div className="text-2xl font-bold text-gray-600">{index + 1}</div>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="text-center p-3 rounded-lg bg-gray-800/20 border border-gray-700/30"
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <feature.icon className="w-4 h-4 text-white" />
            </div>
            <h5 className="text-xs font-semibold text-white mb-1">{feature.title}</h5>
            <p className="text-xs text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
      >
        <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Important Notes</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Only send SOL to the deposit address - other tokens will be lost</li>
          <li>• Minimum deposit: 0.001 SOL (~$0.15)</li>
          <li>• Deposits are usually confirmed within 30 seconds</li>
          <li>• You can deposit multiple times to increase your balance</li>
        </ul>
      </motion.div>

      {/* Links */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <a
          href="https://docs.solana.com/wallet-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
        >
          <span>Wallet Setup Guide</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        
        <a
          href="https://solscan.io/account/3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          <span>View House Wallet</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
