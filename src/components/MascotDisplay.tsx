import React from 'react';
import { ASSETS } from '../data/menuConfig';

interface MascotDisplayProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  speechBubbleText?: string;
  animated?: boolean;
}

export const MascotDisplay: React.FC<MascotDisplayProps> = ({
  className = '',
  size = 'md',
  speechBubbleText,
  animated = true,
}) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    hero: 'w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Optional Speech Bubble */}
      {speechBubbleText && (
        <div className="absolute -top-10 -right-6 sm:-top-12 sm:-right-8 z-10 bg-white text-[#380b52] font-bold text-xs sm:text-sm px-3 py-1.5 rounded-2xl shadow-lg border-2 border-[#8ac627] whitespace-nowrap animate-bounce">
          {speechBubbleText}
          {/* Arrow */}
          <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      )}

      {/* Glow Backdrop */}
      <div className="absolute inset-0 bg-[#8ac627]/25 rounded-full blur-xl scale-95 pointer-events-none" />

      {/* Mascot Image */}
      <div
        className={`relative ${sizeMap[size]} ${
          animated ? 'hover:scale-105 transition-transform duration-300' : ''
        }`}
      >
        <img
          src={ASSETS.mascot}
          alt="Mascote Alves da Açaiteria Alves"
          className="w-full h-full object-contain filter drop-shadow-md select-none"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
