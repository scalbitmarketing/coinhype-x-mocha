import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

import { LucideIcon } from 'lucide-react';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';

interface MobileGameHeaderProps {
  title: string;
  icon: LucideIcon;
}

export default function MobileGameHeader({ title, icon: Icon }: MobileGameHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="p-3 sm:p-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/lobby')}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-10 relative min-h-[40px] min-w-[40px] flex items-center justify-center ml-14"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
        
        {/* Center Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
          <div className="text-lg sm:text-xl font-cursive font-bold gradient-text">
            Coin Hype
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <BalanceDisplay />
        </div>
      </div>
      
      {/* Game Title Row */}
      <div className="mt-3 flex items-center justify-center space-x-2">
        <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <h1 className="text-base sm:text-lg font-bold text-white">{title}</h1>
      </div>
    </header>
  );
}
