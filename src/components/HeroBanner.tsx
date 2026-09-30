import React from 'react';

import { ShoppingCart, ArrowRight } from 'lucide-react';

import { ASSETS } from '../data/menuConfig';

import { BrandLogo } from './BrandLogo';

interface HeroBannerProps {
  onOrderNowClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOrderNowClick }) => {
  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-purple-900/30 my-3 sm:my-5 bg-[#36084a]">

      {/* Background Graphic Artwork */}
      <div className="relative w-full aspect-[21/9] min-h-[190px] sm:min-h-[260px] md:min-h-[320px] max-h-[380px] overflow-hidden flex items-center">

        <img
          src={ASSETS.heroBanner}
          alt="Açaiteria Alves - Sabor, qualidade e muito mais energia para o seu dia!"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />

        {/* Interactive Overlay & Clickable Button */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8 md:p-10 pointer-events-none">

          {/* Top subtle spacing */}
          <div />

          {/* Left Column Content & Button positioned over the banner */}
          <div className="max-w-[48%] sm:max-w-[42%] md:max-w-[38%] pointer-events-auto">

            {/* Action Pill Button */}
            <button
              onClick={onOrderNowClick}
              className="inline-flex items-center gap-2 translate-y-2 -translate-x-2 sm:translate-y-8 sm:-translate-x-8 bg-[#b6f625] hover:bg-[#a5e41a] active:scale-95 text-[#240332] font-black text-xs sm:text-sm md:text-base px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg shadow-black/30 transition-all cursor-pointer group"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />

              <span>Peça agora</span>

              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};