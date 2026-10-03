import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, AlertCircle } from 'lucide-react';
import { Category, Product, ProductSize, Complement, Cobertura } from '../types/menu';
import { getCategoryFlags, getProductTypeLabel } from '../utils/categoryRules';
import { useCart } from '../context/CartContext';
import {
  INITIAL_ACOMPANHAMENTOS,
  INITIAL_COBERTURAS,
} from '../data/menuConfig';

interface ProductOptionsModalProps {
  product: Product | null;
  initialSize?: ProductSize;
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
  availableAcompanhamentos?: Complement[];
  availableCoberturas?: Cobertura[];
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  product,
  initialSize,
  isOpen,
  onClose,
  categories,
  availableAcompanhamentos = INITIAL_ACOMPANHAMENTOS,
  availableCoberturas = INITIAL_COBERTURAS,
}) => {
  const { addItem } = useCart();

  const { isAcai, isFixedPrice, isCombo, categoryName } = getCategoryFlags(product?.categoryId, categories);
  const normalizedCategoryName = `${product?.categoryId || ''} ${categoryName || ''} ${product?.name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const isMilkShake = normalizedCategoryName.includes('milkshake');
  const supportsCobertura = isAcai || isMilkShake;
  const productSizes = isFixedPrice ? [] : product?.sizes || [];

  // Size state
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(initialSize);


  // Acompanhamentos state
  const [selectedComplements, setSelectedComplements] = useState<Complement[]>([]);

  // Cobertura state (Section 9: exactly 1 cobertura)
  const [selectedCobertura, setSelectedCobertura] = useState<string>('');

  // Quantity state
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset & initialize state when product changes
  useEffect(() => {
    if (product) {
      const defaultS = isFixedPrice
        ? undefined
        : initialSize ||
          productSizes.find((s) => s.isDefault) ||
          productSizes[0];

      setSelectedSize(defaultS);
      setSelectedComplements([]);
      setQuantity(1);
      setNotes('');
      setValidationError('');

      // Default first cobertura or empty
      if (supportsCobertura && availableCoberturas.length > 0) {
        setSelectedCobertura(availableCoberturas[0].name);
      } else {
        setSelectedCobertura('');
      }
    }
  }, [product, initialSize, isOpen]);

  if (!isOpen || !product) return null;

  // Max complements allowed for the currently selected size
  const maxComplementsAllowed = selectedSize?.maxComplements ?? product.maxFreeComplements ?? 4;
  const selectedCount = selectedComplements.length + (selectedCobertura ? 1 : 0);

  // Handle size change and clamp complements if new limit is smaller
  const handleSizeChange = (newSize: ProductSize) => {
    setSelectedSize(newSize);
    const newLimit = newSize.maxComplements ?? 4;
    if (selectedComplements.length + (selectedCobertura ? 1 : 0) > newLimit) {
      setSelectedComplements((prev) => prev.slice(0, Math.max(0, newLimit - (selectedCobertura ? 1 : 0))));
      setValidationError(
        `Limite ajustado para ${newLimit} acompanhamentos devido ao tamanho ${newSize.label}.`
      );
    } else {
      setValidationError('');
    }
  };

  // Toggle complement with strict limit validation (Section 8)
  const toggleComplement = (complement: Complement) => {
    const isSelected = selectedComplements.some((c) => c.id === complement.id);
    if (isSelected) {
      setSelectedComplements((prev) => prev.filter((c) => c.id !== complement.id));
      setValidationError('');
    } else {
      if (selectedCount >= maxComplementsAllowed) {
        setValidationError(
          `Você já atingiu o limite de ${maxComplementsAllowed} acompanhamentos para o tamanho ${selectedSize?.label || ''}.`
        );
        return;
      }
      setSelectedComplements((prev) => [...prev, complement]);
      setValidationError('');
    }
  };

  // Pricing calculations
  const unitPrice = !isFixedPrice && selectedSize ? selectedSize.price : product.basePrice;
  const totalPrice = unitPrice * quantity;

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const handleConfirmAdd = () => {
    // Validation: 1 Cobertura is required for Açaí (Section 9)
    if (supportsCobertura && !selectedCobertura) {
      setValidationError('Por favor, escolha 1 cobertura para continuar.');
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      categoryName: categoryName || String(product.categoryId),
      isCombo,
      units: isCombo ? product.units : undefined,
      comboCategoryName: isCombo ? getProductTypeLabel(product.tipo) : undefined,
      image: product.image,
      selectedSize: isFixedPrice ? undefined : selectedSize,
      tipo: product.tipo || undefined,
      selectedComplements,
      cobertura: supportsCobertura ? selectedCobertura : undefined,
      unitPrice,
      quantity,
      notes: notes.trim(),
    });

    onClose();
  };

  // Filter only active complements and coberturas
  const activeComplements = availableAcompanhamentos.filter((c) => c.active !== false);
  const activeCoberturas = availableCoberturas.filter((c) => c.active !== false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-purple-100">
        {/* Header Image & Info */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-[#2d053f] shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black">{product.name}</h2>
            <p className="text-xs text-purple-100/90 line-clamp-1">{product.description}</p>
          </div>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {isCombo && (product.tipo || product.units != null) && (
            <div className="flex flex-wrap gap-2" aria-label="Informações do combo">
              {product.tipo && getProductTypeLabel(product.tipo) && (
                <span className="inline-flex max-w-full items-center rounded-full bg-purple-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#35074a]">
                  {getProductTypeLabel(product.tipo)}
                </span>
              )}
              {product.units != null && (
                <span className="inline-flex items-center rounded-full bg-[#f2ffdd] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#35074a]">
                  {product.units} unidades
                </span>
              )}
            </div>
          )}

          {/* Validation Notice Alert */}
          {validationError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Escolha o Tamanho (Sections 4 & 5) */}
          {productSizes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#35074a] text-white flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <span>Escolha o Tamanho</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">Obrigatório</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {productSizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleSizeChange(size)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#8ac627] bg-[#f7fee7] ring-2 ring-[#8ac627]/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {size.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#8ac627] bg-[#8ac627] text-[#1e032b]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#35074a]">
                        {formatCurrency(size.price)}
                      </span>
                      {!isMilkShake && size.maxComplements && (
                        <span className="text-[10px] font-semibold text-emerald-700 mt-1">
                          Até {size.maxComplements} acomp.
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Acompanhamentos */}
          {isAcai && activeComplements.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#35074a] text-white flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  <span>Acompanhamentos</span>
                </label>
                {/* Counter example: "3 de 3 acompanhamentos selecionados" */}
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    selectedCount >= maxComplementsAllowed
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-purple-100 text-[#35074a]'
                  }`}
                >
                  {selectedCount} de {maxComplementsAllowed} selecionados
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Selecione até {maxComplementsAllowed} opções incluídas no tamanho{' '}
                {selectedSize?.label || ''}.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeComplements.map((item) => {
                  const isSelected = selectedComplements.some((c) => c.id === item.id);
                  const isMaxReached = selectedCount >= maxComplementsAllowed;
                  const isDisabled = !isSelected && isMaxReached;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleComplement(item)}
                      disabled={isDisabled}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#8ac627] bg-[#f7fee7] text-[#1e032b] ring-1 ring-[#8ac627]'
                          : isDisabled
                          ? 'border-slate-100 bg-slate-50/60 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#8ac627] bg-[#8ac627] text-[#1e032b]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isAcai && activeComplements.length > 0 && (
            <p className="-mt-4 text-[11px] font-medium text-emerald-700">
              Atenção: a cobertura também conta como acompanhamento.
            </p>
          )}

          {/* Cobertura */}
          {supportsCobertura && activeCoberturas.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#35074a] text-white flex items-center justify-center text-[10px] font-black">
                    {isMilkShake ? '2' : '3'}
                  </span>
                  <span>Cobertura</span>
                  <span className="text-red-500">*</span>
                </label>
                {/* Rule: "Escolha 1 cobertura" */}
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Escolha 1 cobertura
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeCoberturas.map((cob) => {
                  const isSelected = selectedCobertura === cob.name;
                  return (
                    <button
                      key={cob.id}
                      type="button"
                      onClick={() => {
                        setSelectedCobertura(cob.name);
                        setValidationError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1 ${
                        isSelected
                          ? 'border-[#8ac627] bg-[#f7fee7] text-[#1e032b] ring-2 ring-[#8ac627]/40'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cob.name}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#8ac627] bg-[#8ac627] text-[#1e032b]'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite uma observação..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
              maxLength={120}
            />
          </div>
        </div>

        {/* Footer with Quantity Stepper and Add to Cart Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          {/* Stepper */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="text-slate-600 hover:text-black font-bold disabled:opacity-30 cursor-pointer"
              aria-label="Diminuir"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-xs font-black text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="text-slate-600 hover:text-black font-bold cursor-pointer"
              aria-label="Aumentar"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleConfirmAdd}
            className="flex-1 py-3 px-4 rounded-xl bg-[#b6f625] hover:bg-[#a6e61a] active:scale-98 text-[#1e032b] font-black text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all cursor-pointer"
          >
            <span>Adicionar ao pedido</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
