import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// European roulette numbers in wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

interface RouletteWheelProps {
  isSpinning: boolean;
  finalNumber: number | null;
  onSpinComplete: () => void;
}

export default function RouletteWheel({ isSpinning, finalNumber, onSpinComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getNumberColor = (num: number): string => {
    if (num === 0) return '#10B981'; // green-500
    return RED_NUMBERS.has(num) ? '#EF4444' : '#374151'; // red-500 or gray-700
  };

  useEffect(() => {
    if (isSpinning && finalNumber !== null) {
      // Clear any existing timeout
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
      
      // Calculate target rotation
      const numberIndex = WHEEL_NUMBERS.indexOf(finalNumber);
      if (numberIndex === -1) return; // Invalid number
      
      const anglePerSlot = 360 / WHEEL_NUMBERS.length;
      const targetAngle = numberIndex * anglePerSlot;
      
      // Add 5 full rotations + precise alignment
      const finalRotation = rotation + 1800 + (360 - targetAngle);
      
      setRotation(finalRotation);
      setShowResult(false);
      
      // Trigger completion after animation
      spinTimeoutRef.current = setTimeout(() => {
        setShowResult(true);
        onSpinComplete();
      }, 3000);
    }
    
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, [isSpinning, finalNumber, rotation, onSpinComplete]);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Wheel Base */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-2xl">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900">
          {/* Roulette Wheel */}
          <motion.div
            className="absolute inset-4 rounded-full border-4 border-yellow-500 overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ 
              duration: isSpinning ? 3 : 0, 
              ease: isSpinning ? "easeOut" : "linear",
              type: "tween"
            }}
          >
            {/* Numbers around the wheel */}
            {WHEEL_NUMBERS.map((number, index) => {
              const angle = (index * 360) / WHEEL_NUMBERS.length;
              const color = getNumberColor(number);
              
              return (
                <div
                  key={index}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className="absolute top-1 left-1/2 w-8 h-8 -ml-4 flex items-center justify-center text-white text-xs font-bold rounded-sm"
                    style={{
                      backgroundColor: color,
                      transform: `rotate(${-angle}deg)`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {number}
                  </div>
                </div>
              );
            })}
          </motion.div>
          
          {/* Center hub */}
          <div className="absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg border-4 border-yellow-300 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-yellow-200"></div>
          </div>
        </div>
      </div>
      
      {/* Ball indicator pointer */}
      <div className="absolute top-4 left-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white z-10 -ml-1">
      </div>
      
      {/* Result display */}
      <AnimatePresence>
        {showResult && finalNumber !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -bottom-16 left-1/2 -ml-16 w-32 text-center"
          >
            <div 
              className="inline-block px-4 py-2 rounded-lg text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: getNumberColor(finalNumber) }}
            >
              {finalNumber}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
