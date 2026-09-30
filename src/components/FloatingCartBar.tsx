import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingCartBar: React.FC = () => {
  const { itemCount, total, openCart } = useCart();

  if (itemCount === 0) return null;

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={openCart}
        className="w-full h-14 bg-[#2b0439] text-white rounded-2xl px-4 flex items-center justify-between shadow-2xl border border-purple-800/50 active:scale-[0.99] transition-transform cursor-pointer"
        aria-label={`Ver pedido com ${itemCount} itens, total ${formatCurrency(total)}`}
      >
        {/* Left Side: Cart Icon & Item Count */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#8ac627] text-[#1c0326]">
            <ShoppingBag className="w-5 h-5 text-[#1c0326]" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-[#2b0439] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-purple-200">
              {itemCount}
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-purple-200 block leading-tight">
              Ver Pedido ({itemCount})
            </span>
            <span className="text-sm font-black text-white tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div className="flex items-center gap-1.5 bg-[#8ac627] text-[#1c0326] px-3.5 py-1.5 rounded-xl font-black text-xs">
          <span>Avançar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
