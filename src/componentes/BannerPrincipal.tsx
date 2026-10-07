import React from 'react';

import { ShoppingCart, ArrowRight } from 'lucide-react';


interface PropriedadesBannerPrincipal {
  onOrderNowClick: () => void;
}

export const BannerPrincipal: React.FC<PropriedadesBannerPrincipal> = ({ onOrderNowClick }) => {
  return (
    <div className="relative my-3 w-full overflow-hidden rounded-2xl border border-purple-900/30 bg-white shadow-lg sm:my-5 sm:rounded-3xl">
      <img src="/banner-sabor-em-familia.png" alt="Açaiteria Alves — do doce ao salgado a gente resolve" className="block h-auto w-full" width={2062} height={763} loading="eager" />
      <button onClick={onOrderNowClick} aria-label="Peça agora" className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-[#b6f625] px-3 py-2 text-xs font-black text-[#240332] shadow-lg sm:bottom-5 sm:left-5 sm:px-5 sm:py-3 sm:text-sm">
        <ShoppingCart className="h-4 w-4" /><span>Peça agora</span><ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
