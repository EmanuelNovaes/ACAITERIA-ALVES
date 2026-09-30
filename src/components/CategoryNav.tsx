import React from 'react';
import { CATEGORIES } from '../data/menuConfig';
import { CategoryId } from '../types/menu';

interface CategoryNavProps {
  selectedCategory: CategoryId | 'todos';
  onSelectCategory: (categoryId: CategoryId | 'todos') => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'acai':
        return (
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M2 12c0 5 4 8 10 8s10-3 10-8H2zm10-8a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2z" />
          </svg>
        );
      case 'sorvetes':
        return (
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 2a5 5 0 0 0-5 5c0 .3.03.6.1.9L12 22l4.9-14.1c.07-.3.1-.6.1-.9a5 5 0 0 0-5-5z" />
          </svg>
        );
      case 'salgados':
        return (
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
          </svg>
        );
      case 'milkshakes':
        return (
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M5 6h14l-1.5 15h-11L5 6zm10-4l-2 3H9l2-3h4z" />
          </svg>
        );
      case 'bebidas':
        return (
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M9 2h6v2h-1v2.2a5 5 0 0 1 2 4V22H8v-11.8a5 5 0 0 1 2-4V4H9V2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full my-3 sm:my-5">
      <div className="bg-white/80 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl sm:rounded-full border border-purple-100 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          // If 'todos' is selected, default highlight 'acai' like in image.png
          const isSelected = selectedCategory === cat.id || (selectedCategory === 'todos' && cat.id === 'acai');

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#b6f625] text-[#1e032b] shadow-sm'
                  : 'bg-white text-slate-700 hover:text-[#36084a] hover:bg-purple-50/70 border border-slate-200/60'
              }`}
            >
              <span className={isSelected ? 'text-[#1e032b]' : 'text-purple-800'}>
                {getCategoryIcon(cat.id)}
              </span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

