import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';

export default function Logo({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) {
  const navigate = useNavigate();
  
  const sizeClasses = {
    small: 'text-2xl md:text-3xl',
    medium: 'text-4xl md:text-5xl', 
    large: 'text-5xl md:text-7xl'
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <motion.div 
      className="relative cursor-pointer flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      onClick={handleLogoClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.h1 
        className={`${sizeClasses[size]} relative z-10 font-black tracking-wide text-white`}
        style={{
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
          textShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
          background: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        CoinHype
      </motion.h1>

      {size === 'large' && (
        <motion.p 
          className="text-base md:text-lg text-gray-300 mt-2 font-medium tracking-wide text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Play Fast. Win Fair.
        </motion.p>
      )}
    </motion.div>
  );
}
