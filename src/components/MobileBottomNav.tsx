import React, { useRef } from 'react';
import { Home, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CategoryId } from '../types/menu';

interface MobileBottomNavProps {
  selectedCategory: CategoryId | 'todos';
  onReturnHome: () => void;
  onNavigateToAdmin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  selectedCategory,
  onReturnHome,
  onNavigateToAdmin,
}) => {
  const { openCart, closeCart, itemCount } = useCart();
  const homeScrollPosition = useRef<number | null>(null);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#340748] border-t border-purple-900/40 text-white px-6 py-2 shadow-2xl flex items-center justify-around">
      {/* Início */}
      <button
        onClick={() => {
          homeScrollPosition.current = window.scrollY;
          closeCart();
          onReturnHome();
          requestAnimationFrame(() => {
            if (homeScrollPosition.current !== null) {
              if (window.scrollY !== homeScrollPosition.current) {
                window.scrollTo({ top: homeScrollPosition.current, behavior: 'instant' });
              }
              homeScrollPosition.current = null;
            }
          });
        }}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
          selectedCategory === 'todos' ? 'text-[#b6f625]' : 'text-purple-200 hover:text-white'
        }`}
      >
        <Home className="w-5 h-5 stroke-[2.2]" />
        <span>Início</span>
      </button>

      {/* Pedidos */}
      <button
        onClick={openCart}
        className="relative flex flex-col items-center gap-1 text-[11px] font-bold text-purple-200 hover:text-white transition-colors cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#b6f625] text-[#1e032b] font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-[#340748]">
              {itemCount}
            </span>
          )}
        </div>
        <span>Pedidos</span>
      </button>

      {/* ADM (Substituted 'Conta' with 'ADM', routes directly to admin panel/login) */}
      <button
        onClick={onNavigateToAdmin}
        className="flex flex-col items-center gap-1 text-[11px] font-bold text-purple-200 hover:text-[#b6f625] transition-colors cursor-pointer"
        aria-label="Acessar painel administrativo"
      >
        <ShieldCheck className="w-5 h-5 stroke-[2.2] text-[#8ac627]" />
        <span>ADM</span>
      </button>
    </div>
  );
};
