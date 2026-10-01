import React, { useState } from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { Category, CategoryId, Product, ProductSize } from '../types/menu';
import { getCategoryFlags, getProductTypeLabel, isComboCategory } from '../utils/categoryRules';

interface ProductCardProps {
  product: Product;
  categories?: Category[];
  selectedCategory?: CategoryId | 'todos';
  onOpenCustomize: (product: Product, defaultSize?: ProductSize) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categories,
  selectedCategory,
  onOpenCustomize,
}) => {
  // Bebidas, Salgados e Churros: preço único, sem tamanhos, mostra "Valor"
  const { isFixedPrice, isAcai, isCombo, categoryName } = getCategoryFlags(
    product.categoryId,
    categories
  );
  const sizes = isFixedPrice ? [] : product.sizes || [];
  const badgeLabel =
    categoryName || product.badge || (isAcai ? 'Açaí' : undefined);
  const normalizedCategoryName = `${product.categoryId} ${categoryName || ''} ${selectedCategory || ''} ${product.name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const isMilkShake = normalizedCategoryName.includes('milkshake');

  const defaultSize = sizes.find((s) => s.isDefault) || sizes[0];
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(defaultSize);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const currentPrice = !isFixedPrice && selectedSize ? selectedSize.price : product.basePrice;
  const productTypeLabel = getProductTypeLabel(product.tipo);
  const showComboDetails =
    isCombo &&
    (selectedCategory === 'todos' ||
      isComboCategory(
        selectedCategory,
        categories?.find((category) => category.id === selectedCategory)?.name
      ));

  return (
    <div
      onClick={() => onOpenCustomize(product, selectedSize)}
      className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-purple-100/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer active:scale-99"
    >
      {/* Product Image */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-purple-50 mb-2 sm:mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {badgeLabel && (
          <span className="absolute top-1.5 left-1.5 bg-[#35074a]/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[90%] truncate">
            {isAcai && <Sparkles className="w-2.5 h-2.5 text-[#8ac627] shrink-0" />}
            <span className="truncate">{badgeLabel}</span>
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2.5">
        <div>
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-base leading-snug line-clamp-1 group-hover:text-[#35074a] transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 mt-0.5 leading-tight">
            {product.description}
          </p>
          {showComboDetails ? (
            <div className="mt-1">
              {productTypeLabel && (
                <p className="text-[10px] sm:text-xs font-extrabold text-purple-800">
                  {productTypeLabel}
                </p>
              )}
              {product.units != null && (
                <p className="text-[10px] sm:text-xs font-semibold text-purple-800">
                  {product.units} unidades
                </p>
              )}
            </div>
          ) : (isAcai && productTypeLabel || isCombo && (product.units != null || productTypeLabel)) && (
            <p className="text-[10px] sm:text-xs font-semibold text-purple-800 mt-1">
              {isCombo
                ? [product.units != null ? `${product.units} unidades` : '', productTypeLabel || ''].filter(Boolean).join(' • ')
                : productTypeLabel}
            </p>
          )}
        </div>

        {/* Sizes Quick Selection (Visible on tablet & desktop, compact on mobile) */}
        {!isAcai && !isMilkShake && sizes.length > 0 && (
          <div className="hidden sm:block">
            <div className="flex items-center gap-1 flex-wrap">
              {sizes.map((size) => {
                const isSelected = selectedSize?.id === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`text-[11px] px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#b6f625] text-[#1e032b] shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price & Action Button */}
        <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-100 mt-1">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[11px] text-slate-500 font-medium leading-none">
              {isFixedPrice || isCombo ? 'Valor' : 'A partir de'}
            </span>
            <strong className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
              {formatCurrency(currentPrice)}
            </strong>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCustomize(product, selectedSize);
            }}
            className="py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-[#b6f625] hover:bg-[#a5e41a] active:scale-95 text-[#1e032b] font-black text-[11px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.4]" />
            <span className="hidden xs:inline">Pedir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
