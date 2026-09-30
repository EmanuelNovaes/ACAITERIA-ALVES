import React, { useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useCart } from '../context/CartContext';
import { CategoryId, Category } from '../types/menu';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: CategoryId | 'todos';
  onSelectCategory: (cat: CategoryId | 'todos') => void;
  onOpenSettings?: () => void;
  onNavigateToAdmin?: () => void;
  categories?: Category[];
}




export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onNavigateToAdmin,
  categories = [],
}) => {
  const { itemCount, openCart } = useCart();
  const mobileCategoryNav = useRef<HTMLDivElement>(null);
  const mobileCategoryButtons = useRef(new Map<string, HTMLButtonElement>());

  // Lista de categorias vem do banco de dados (cadastradas pelo ADM).
  // Assim, ao criar ou excluir uma categoria no painel administrativo,
  // ela aparece/desaparece automaticamente aqui e na navegação de compra.
  const categoriesList: { id: CategoryId | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    ...categories.map((cat) => ({ id: cat.id, label: cat.name })),
  ];

  useEffect(() => {
    const nav = mobileCategoryNav.current;
    const button = mobileCategoryButtons.current.get(String(selectedCategory));
    if (!nav || !button) return;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    if (buttonRect.left < navRect.left) {
      nav.scrollBy({ left: buttonRect.left - navRect.left - 8, behavior: 'smooth' });
    } else if (buttonRect.right > navRect.right) {
      nav.scrollBy({ left: buttonRect.right - navRect.right + 8, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  return (
    <header className="sticky top-0 z-40 bg-[#35074a] text-white shadow-md border-b border-[#490c64]">
      {/* Top Main Bar */}
      <div className="max-w-[1360px] mx-auto px-0 sm:px-2">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-2 md:gap-4">
          {/* Brand Logo - 3 risks removed, logo preserved */}

          <div className="flex items-center shrink-0 -translate-x-12">
            <button
              onClick={() => onSelectCategory('todos')}
              className="flex items-center text-left cursor-pointer active:scale-98 transition-transform"
            >
              <BrandLogo size="md" variant="white" />
            </button>
          </div>

          {/* Desktop Navigation Bar (Todos, Açaí, Sorvetes, Salgados & Churros, Milk Shakes, Bebidas, Carrinho) */}
          <nav className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1 xl:gap-1.5 mx-1 xl:mx-2 overflow-x-auto no-scrollbar">            {/* Todos */}
            <button
              onClick={() => onSelectCategory('todos')}
              className={`text-xs xl:text-sm font-bold transition-all cursor-pointer py-1.5 px-2 xl:px-3 rounded-lg whitespace-nowrap shrink-0 ${selectedCategory === 'todos'
                ? 'text-[#8ac627] bg-white/10'
                : 'text-purple-100 hover:text-[#8ac627] hover:bg-white/5'
                }`}
            >
              Todos
            </button>

            {/* Categorias dinâmicas cadastradas pelo ADM */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`text-xs xl:text-sm font-bold transition-all cursor-pointer py-1.5 px-2 xl:px-3 rounded-lg whitespace-nowrap shrink-0 ${isSelected
                    ? 'text-[#8ac627] bg-white/10'
                    : 'text-purple-100 hover:text-[#8ac627] hover:bg-white/5'
                    }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Search & Cart Icon (Lock icon removed as requested) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 md:flex-initial justify-end">
            {/* Search Pill Input */}
            <div className="relative w-full max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[190px] xl:max-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-[#4a1163]/70 text-white placeholder-purple-200/60 text-xs sm:text-sm rounded-full pl-7 sm:pl-8 pr-6 py-1.5 sm:py-2 border border-purple-400/30 focus:outline-none focus:ring-1 focus:ring-[#8ac627] transition-all"
              />
              <Search className="absolute left-2.5 top-2 sm:top-2.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-200/70" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-2 text-purple-200/70 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="hidden lg:flex shrink-0 translate-x-14 items-center gap-1.5 rounded-lg border border-purple-300/30 bg-white/10 px-2.5 py-2 text-[11px] font-bold text-purple-100 transition-colors hover:bg-white/20 hover:text-[#8ac627] cursor-pointer"
                aria-label="Acessar painel administrativo"
              >
                <ShieldCheck className="w-4 h-4 text-[#8ac627]" />
                <span>ADM</span>
              </button>
            )}

            {/* Cart Icon Button on mobile and tablet */}
            <button
              onClick={openCart}
              className="lg:hidden relative p-2 text-white hover:text-[#8ac627] transition-transform active:scale-95 cursor-pointer flex items-center justify-center shrink-0 bg-white/10 rounded-full"
              aria-label={`Ver pedido com ${itemCount} itens`}
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8ac627] text-[#1b0324] font-black text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#35074a] shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scrolling Categories (No second bar below banner, clean mobile category navigation) */}
        <div ref={mobileCategoryNav} className="lg:hidden py-2 border-t border-purple-800/40 flex items-center gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar pb-2.5">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                ref={(element) => {
                  if (element) mobileCategoryButtons.current.set(String(cat.id), element);
                  else mobileCategoryButtons.current.delete(String(cat.id));
                }}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${isSelected
                  ? 'bg-[#8ac627] text-[#1e032b] shadow-xs scale-102'
                  : 'bg-white/10 text-purple-100 hover:bg-white/20'
                  }`}
              >
                {cat.label}
              </button>
            );
          })}

        </div>
      </div>
    </header>
  );
};
