import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface GameCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconUrl?: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

export default function GameCard({ title, icon: Icon, iconUrl, description, isActive, onClick }: GameCardProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <motion.div
      className={`glass-panel cursor-pointer transition-all duration-300 relative overflow-hidden aspect-square group ${
        isActive 
          ? `hover:scale-102 ${isDesktop ? 'lg:hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/20' : 'md:hover:scale-105'} hover:shadow-xl border-gray-600/50` 
          : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={isActive ? onClick : undefined}
      whileHover={isActive ? { 
        y: isDesktop ? -8 : -1, 
        boxShadow: isDesktop 
          ? '0 8px 25px rgba(0,217,255,0.3), 0 4px 15px rgba(139,92,246,0.2)' 
          : '0 4px 15px rgba(0,0,0,0.2)' 
      } : {}}
      whileTap={isActive ? { scale: 0.98 } : {}}
    >
      {/* Enhanced Background Image */}
      {iconUrl && isActive ? (
        <div className="absolute inset-0">
          <img 
            src={iconUrl} 
            alt={title}
            className={`w-full h-full object-cover object-center transition-transform duration-500 ${
              isDesktop ? 'group-hover:scale-110' : ''
            }`}
          />
          {/* Enhanced gradient overlay */}
          <div className={`absolute inset-0 ${
            isDesktop 
              ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70' 
              : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
          } transition-all duration-300`}></div>
          
          {/* Desktop-only animated border */}
          {isDesktop && (
            <motion.div
              className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/50 rounded-lg transition-all duration-300"
              animate={{
                borderColor: ['rgba(0,217,255,0)', 'rgba(0,217,255,0.5)', 'rgba(139,92,246,0.5)', 'rgba(0,217,255,0)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50"></div>
      )}

      {/* Enhanced glow effects */}
      {isActive && (
        <>
          <motion.div
            className={`absolute inset-0 bg-cyan-500/10 opacity-0 transition-opacity duration-300 ${
              isDesktop ? 'group-hover:opacity-20' : ''
            }`}
            whileHover={{ opacity: isDesktop ? 0.2 : 0.1 }}
          />
          
          {/* Desktop-only particle effects */}
          {isDesktop && (
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `
                  radial-gradient(circle at 20% 80%, rgba(0,217,255,0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, rgba(255,0,128,0.2) 0%, transparent 70%)
                `
              }}
            />
          )}
        </>
      )}
      
      <div className={`relative z-10 h-full flex flex-col justify-end ${isDesktop ? 'p-6' : 'p-4'}`}>
        {/* Icon for non-active cards */}
        {(!iconUrl || !isActive) && (
          <div className="flex-1 flex items-center justify-center mb-4">
            <motion.div
              whileHover={isDesktop ? { scale: 1.1, rotate: 5 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} ${
                isActive ? 'text-white' : 'text-gray-500'
              }`} />
            </motion.div>
          </div>
        )}
        
        <div className="text-center">
          <motion.h3 
            className={`font-bold mb-1 tracking-wide ${
              isDesktop 
                ? 'text-lg lg:text-xl mb-3 group-hover:text-cyan-300 transition-colors' 
                : 'text-xs sm:text-sm md:text-base md:mb-2'
            } ${isActive ? 'text-white drop-shadow-lg' : 'text-gray-500'}`}
            whileHover={isDesktop ? { scale: 1.05 } : {}}
          >
            {title}
          </motion.h3>
          
          <p className={`${
            isDesktop 
              ? 'text-sm text-gray-300 drop-shadow-md group-hover:text-gray-200' 
              : 'text-xs'
          } ${isActive ? 'text-gray-200 drop-shadow-md hidden sm:block' : 'text-gray-500 hidden'}`}>
            {description}
          </p>
          
          {/* Desktop-only play button overlay */}
          {isDesktop && isActive && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
            >
              <motion.button
                className="neon-button px-6 py-3 text-sm font-bold"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                ▶ Play Now
              </motion.button>
            </motion.div>
          )}
          
          {!isActive && (
            <motion.p 
              className={`text-yellow-500 mt-2 font-medium ${
                isDesktop ? 'text-sm' : 'text-xs'
              }`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isDesktop ? '🚀 Coming Soon' : 'Soon'}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
