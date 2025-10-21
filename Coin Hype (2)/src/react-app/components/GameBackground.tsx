import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GameBackgroundProps {
  children: ReactNode;
  theme?: 'dice' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'blackjack' | 'poker' | 'rps' | 'crossroads' | 'coinflip';
}

export default function GameBackground({ children, theme = 'dice' }: GameBackgroundProps) {
  const themeEffects = {
    dice: {
      particles: ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'],
      colors: ['rgba(0, 217, 255, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(255, 215, 0, 0.1)']
    },
    crash: {
      particles: ['🚀', '⭐', '💫', '✨', '🌟'],
      colors: ['rgba(255, 69, 0, 0.1)', 'rgba(255, 165, 0, 0.1)', 'rgba(0, 217, 255, 0.1)']
    },
    mines: {
      particles: ['💎', '⚡', '💥', '🔸', '🔹'],
      colors: ['rgba(255, 0, 128, 0.1)', 'rgba(255, 69, 0, 0.1)', 'rgba(139, 92, 246, 0.1)']
    },
    plinko: {
      particles: ['⚪', '🔵', '🟣', '🟢', '🟡'],
      colors: ['rgba(0, 217, 255, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(255, 0, 128, 0.1)']
    },
    slots: {
      particles: ['🍒', '🍋', '🍊', '⭐', '💎'],
      colors: ['rgba(255, 0, 0, 0.1)', 'rgba(255, 215, 0, 0.1)', 'rgba(0, 255, 127, 0.1)']
    },
    roulette: {
      particles: ['🔴', '⚫', '🟢', '🎯', '⭕'],
      colors: ['rgba(255, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 255, 0, 0.1)']
    },
    blackjack: {
      particles: ['♠️', '♥️', '♦️', '♣️', '🃏'],
      colors: ['rgba(0, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.1)', 'rgba(255, 215, 0, 0.1)']
    },
    poker: {
      particles: ['👑', '💎', '🏆', '⭐', '✨'],
      colors: ['rgba(255, 215, 0, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(255, 0, 128, 0.1)']
    },
    rps: {
      particles: ['🪨', '📄', '✂️', '👊', '✋'],
      colors: ['rgba(139, 69, 19, 0.1)', 'rgba(255, 255, 255, 0.1)', 'rgba(192, 192, 192, 0.1)']
    },
    crossroads: {
      particles: ['🚗', '🛣️', '🚦', '⬆️', '⬇️'],
      colors: ['rgba(0, 217, 255, 0.1)', 'rgba(255, 165, 0, 0.1)', 'rgba(139, 92, 246, 0.1)']
    },
    coinflip: {
      particles: ['🪙', '⚡', '✨', '💫', '🌟'],
      colors: ['rgba(255, 215, 0, 0.1)', 'rgba(0, 217, 255, 0.1)', 'rgba(139, 92, 246, 0.1)']
    }
  };

  const currentTheme = themeEffects[theme];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {currentTheme.particles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          >
            {particle}
          </motion.div>
        ))}
      </div>

      {/* Dynamic Color Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {currentTheme.colors.map((color, index) => (
          <motion.div
            key={index}
            className="absolute w-96 h-96 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              left: `${20 + index * 30}%`,
              top: `${20 + index * 25}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
