import { motion } from 'framer-motion';

interface CoinHypeBrandingProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
  animated?: boolean;
}

export default function CoinHypeBranding({ 
  position = 'top-right', 
  size = 'small',
  opacity = 0.3,
  animated = false
}: CoinHypeBrandingProps) {
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm', 
    large: 'text-lg'
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <motion.div 
      className={`absolute ${positionClasses[position]} pointer-events-none select-none z-10`}
      style={{ opacity }}
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <motion.div 
        className={`${sizeClasses[size]} flex items-center space-x-1`}
        initial={{ opacity: animated ? 0 : 1 }}
        animate={{ opacity: animated ? [0, 1, 0] : 1 }}
        transition={{ duration: 2, repeat: animated ? Infinity : 0 }}
      >
        <div 
          className="w-4 h-4 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #00D9FF 0%, #8B5CF6 50%, #FF0080 100%)'
          }}
        />
        <span className="coinhype-brand font-bold tracking-wider">
          CH
        </span>
      </motion.div>
    </motion.div>
  );
}
