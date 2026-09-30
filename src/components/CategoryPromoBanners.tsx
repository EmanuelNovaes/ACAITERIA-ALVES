import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ASSETS } from '../data/menuConfig';
import { CategoryId } from '../types/menu';

interface CategoryPromoBannersProps {
  onSelectCategory: (cat: CategoryId) => void;
}

export const CategoryPromoBanners: React.FC<CategoryPromoBannersProps> = ({
  onSelectCategory,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 my-6">
      {/* 1. Salgados & Churros */}
      <button
        onClick={() => onSelectCategory('salgados')}
        className="relative overflow-hidden rounded-2xl bg-[#340748] hover:bg-[#3d0954] text-white p-4 text-left border border-purple-900/40 shadow-xs hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
      >
        <div className="relative z-10 max-w-[62%] space-y-1">
          <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight">
            Salgados & Churros
          </h4>
          <p className="text-[11px] text-purple-200/80 leading-snug">
            Crocantes, sequinhos e irresistíveis!
          </p>
          <div className="pt-2">
            <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-[#b6f625] group-hover:text-[#1e032b] flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 transform group-hover:scale-105 transition-transform duration-300">
          <img
            src={ASSETS.salgados}
            alt="Salgados & Churros"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </button>

      {/* 2. Sorvetes */}
      <button
        onClick={() => onSelectCategory('sorvetes')}
        className="relative overflow-hidden rounded-2xl bg-[#340748] hover:bg-[#3d0954] text-white p-4 text-left border border-purple-900/40 shadow-xs hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
      >
        <div className="relative z-10 max-w-[62%] space-y-1">
          <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight">
            Sorvetes
          </h4>
          <p className="text-[11px] text-purple-200/80 leading-snug">
            Diversos sabores para você se refrescar! &gt;
          </p>
        </div>
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 transform group-hover:scale-105 transition-transform duration-300">
          <img
            src={ASSETS.sorvete}
            alt="Sorvetes"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </button>

      {/* 3. Milk Shakes */}
      <button
        onClick={() => onSelectCategory('milkshakes')}
        className="relative overflow-hidden rounded-2xl bg-[#340748] hover:bg-[#3d0954] text-white p-4 text-left border border-purple-900/40 shadow-xs hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
      >
        <div className="relative z-10 max-w-[62%] space-y-1">
          <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight">
            Milk Shakes
          </h4>
          <p className="text-[11px] text-purple-200/80 leading-snug">
            Cremosos e gelados, do seu jeito!
          </p>
          <div className="pt-2">
            <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-[#b6f625] group-hover:text-[#1e032b] flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 transform group-hover:scale-105 transition-transform duration-300">
          <img
            src={ASSETS.milkshake}
            alt="Milk Shakes"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </button>
    </div>
  );
};

