import React from 'react';
import { Sparkles, Plus, Clock, Bike } from 'lucide-react';
import { Product } from '../types/menu';
import { getProductTypeLabel } from '../utils/categoryRules';

interface CombosSectionProps {
  combos: Product[];
  onSelectCombo: (combo: Product) => void;
}

export const CombosSection: React.FC<CombosSectionProps> = ({
  combos,
  onSelectCombo,
}) => {
  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;
  const groups = new Map<string, { name: string; products: Product[] }>();
  combos.forEach((combo) => {
    const key = combo.tipo || '__outros_combos__';
    const group = groups.get(key) || { name: getProductTypeLabel(combo.tipo) || 'Outros Combos', products: [] };
    group.products.push(combo);
    groups.set(key, group);
  });

  return (
    <div className="@container w-full min-w-0 space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-[#2b0439]">Combos em destaque</h2>
      </div>

      <div className="space-y-3">
        {Array.from(groups.entries()).map(([categoryId, group]) => (
          <div key={categoryId} className="space-y-2">
            <h3 className="text-xs font-bold text-slate-600">{group.name}</h3>
            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
            {group.products.map((combo) => (
          <div
            key={combo.id}
            className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group min-w-0"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-purple-50 shrink-0">
              <img
                src={combo.image}
                alt={combo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {combo.name}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                {combo.description}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                <span className="text-sm font-black text-[#2b0439] whitespace-nowrap">
                  {formatCurrency(combo.basePrice)}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectCombo(combo)}
                  className="bg-[#2b0439] hover:bg-[#3d0852] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 min-h-[36px] shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>
            ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
