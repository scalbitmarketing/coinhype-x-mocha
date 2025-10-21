import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <Loader2 className={`${sizeClasses[size]} text-cyan-400`} />
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-transparent border-t-purple-400 animate-spin`} />
      </motion.div>
      
      {text && (
        <motion.p 
          className={`text-gray-300 ${textSizeClasses[size]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function FullscreenLoader({ text = 'Loading Coin Hype...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Coin Hype</h1>
          <p className="text-gray-300">Play Fast. Win Fair.</p>
        </motion.div>
        
        <LoadingSpinner size="lg" text={text} />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-gray-400 text-sm"
        >
          Powered by Solana blockchain
        </motion.div>
      </div>
    </div>
  );
}

export function GameLoader({ gameName }: { gameName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <div className="glass-panel p-8 text-center">
        <LoadingSpinner size="lg" text={`Loading ${gameName}...`} />
        <p className="text-gray-400 mt-4 text-sm">
          Initializing game mechanics
        </p>
      </div>
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="sm" text={text} />
    </div>
  );
}
