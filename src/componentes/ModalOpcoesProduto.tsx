import React, { useState, useLayoutEffect } from 'react';
import { X, Check, Plus, Minus, AlertCircle } from 'lucide-react';
import { Category, Product, ProductSize, Complement, Cobertura } from '../tipos/Cardapio';
import { getCategoryFlags, getProductTypeLabel } from '../utilitarios/RegrasCategorias';
import { validateOptionGroups, initializeCobertura, countSelectedOptions, remainingComplementSlots, toggleComplementSelection } from '../utilitarios/ValidacaoOpcoes';
import { usarCarrinho } from '../contexto/ContextoCarrinho';
import {
  INITIAL_ACOMPANHAMENTOS,
  INITIAL_COBERTURAS,
} from '../dados/ConfiguracaoCardapio';

interface PropriedadesModalOpcoesProduto {
  product: Product | null;
  initialSize?: ProductSize;
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
  availableAcompanhamentos?: Complement[];
  availableCoberturas?: Cobertura[];
}

export const ModalOpcoesProduto: React.FC<PropriedadesModalOpcoesProduto> = ({
  product,
  initialSize,
  isOpen,
  onClose,
  categories,
  availableAcompanhamentos = INITIAL_ACOMPANHAMENTOS,
  availableCoberturas = INITIAL_COBERTURAS,
}) => {
  const { addItem } = usarCarrinho();

  const { isAcai, isFixedPrice, isCombo, categoryName } = getCategoryFlags(product?.categoryId, categories);
  const normalizedCategoryName = `${product?.categoryId || ''} ${categoryName || ''} ${product?.name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const isMilkShake = normalizedCategoryName.includes('milkshake');
  const supportsCobertura = isAcai || isMilkShake;
  const productSizes = isFixedPrice ? [] : product?.sizes || [];

  // Estado do tamanho
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(initialSize);


  // Estado dos acompanhamentos
  const [selectedComplements, setSelectedComplements] = useState<Complement[]>([]);

  // Uma cobertura por ID; ocupa uma vaga do limite total do tamanho.
  const [selectedCobertura, setSelectedCobertura] = useState<string>('');

  // Estado da quantidade
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reinicia e inicializa o estado quando o produto muda
  useLayoutEffect(() => {
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

      setSelectedCobertura(initializeCobertura('', availableCoberturas, supportsCobertura));
    }
  }, [product, initialSize, isOpen]);

  // Revalida quando as opções são carregadas/atualizadas, preservando a escolha válida.
  useLayoutEffect(() => {
    if (!isOpen) return;
    setSelectedCobertura(current => initializeCobertura(current, availableCoberturas, supportsCobertura));
  }, [isOpen, supportsCobertura, availableCoberturas]);

  useLayoutEffect(() => {
    if (!isOpen || !isAcai) return;
    const limit = selectedSize?.maxComplements ?? product?.maxFreeComplements ?? 4;
    setSelectedComplements(current => current.slice(0, remainingComplementSlots(limit, selectedCobertura)));
  }, [isOpen, isAcai, selectedSize, product, selectedCobertura]);

  if (!isOpen || !product) return null;

  // Máximo de acompanhamentos permitidos para o tamanho selecionado
  const maxComplementsAllowed = selectedSize?.maxComplements ?? product.maxFreeComplements ?? 4;
  const selectedCount = countSelectedOptions(selectedComplements, selectedCobertura);

  // Trata a mudança de tamanho e reduz os acompanhamentos se o novo limite for menor
  const handleSizeChange = (newSize: ProductSize) => {
    setSelectedSize(newSize);
    const newLimit = newSize.maxComplements ?? product.maxFreeComplements ?? 4;
    if (countSelectedOptions(selectedComplements, selectedCobertura) > newLimit) {
      setSelectedComplements((prev) => prev.slice(0, remainingComplementSlots(newLimit, selectedCobertura)));
      setValidationError(
        `Limite ajustado para ${newLimit} acompanhamentos devido ao tamanho ${newSize.label}.`
      );
    } else {
      setValidationError('');
    }
  };

  // Alterna o acompanhamento com validação rigorosa do limite (Seção 8)
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
      setSelectedComplements((prev) => toggleComplementSelection(prev, complement, maxComplementsAllowed, selectedCobertura));
      setValidationError('');
    }
  };

  // Cálculos de preço
  const unitPrice = !isFixedPrice && selectedSize ? selectedSize.price : product.basePrice;
  const totalPrice = unitPrice * quantity;

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const handleConfirmAdd = () => {
    const error = selectedCobertura && !activeCoberturas.some(c => c.id === selectedCobertura)
      ? 'Escolha coberturas disponíveis para continuar.'
      : validateOptionGroups(optionGroups);
    if (error) {
      setValidationError(error);
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
      cobertura: supportsCobertura ? activeCoberturas.find(c => c.id === selectedCobertura)?.name : undefined,
      unitPrice,
      quantity,
      notes: notes.trim(),
    });

    onClose();
  };

  // Filtra apenas acompanhamentos e coberturas ativos
  const activeComplements = availableAcompanhamentos.filter((c) => c.active !== false);
  const activeCoberturas = availableCoberturas.filter((c) => c.active !== false);

  const optionGroups = [
    ...(productSizes.length ? [{ name: 'Tamanho', count: productSizes.some(s => s.id === selectedSize?.id) ? 1 : 0, min: 1, max: 1 }] : []),
    ...(isAcai ? [{ name: 'Acompanhamentos', count: selectedCount, min: 0, max: maxComplementsAllowed }] : []),
    ...(supportsCobertura ? [{ name: 'Cobertura', count: activeCoberturas.some(c => c.id === selectedCobertura) ? 1 : 0, min: 1, max: 1 }] : []),
  ];
  const optionsError = validateOptionGroups(optionGroups);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-purple-100">
        {/* Imagem e informações do cabeçalho */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-[#2d053f] shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Botão de fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Título sobre a imagem */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black">{product.name}</h2>
            <p className="text-xs text-purple-100/90 line-clamp-1">{product.description}</p>
          </div>
        </div>

        {/* Área rolável de configuração */}
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

          {/* Aviso de validação */}
          {validationError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Escolha o Tamanho (Seções 4 e 5) */}
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
                          Até {size.maxComplements} opções no total
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
                {/* Exemplo do contador: "3 de 3 acompanhamentos selecionados" */}
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

          {isAcai && supportsCobertura && (
            <p className="-mt-4 text-[11px] font-medium text-emerald-700">
              a cobertura também conta como acompanhamento
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

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeCoberturas.map((cob) => {
                  const isSelected = selectedCobertura === cob.id;
                  return (
                    <button
                      key={cob.id}
                      type="button"
                      onClick={() => {
                        setSelectedCobertura(cob.id);
                        setValidationError('');
                      }}
                      className={`disabled:opacity-50 disabled:cursor-not-allowed p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1 ${
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

        {/* Rodapé com controle de quantidade e botão de adicionar ao carrinho */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          {/* Controle de quantidade */}
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

          {/* Botão de adicionar ao carrinho */}
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={Boolean(optionsError)}
            title={optionsError || undefined}
            className="disabled:opacity-50 disabled:cursor-not-allowed flex-1 py-3 px-4 rounded-xl bg-[#b6f625] hover:bg-[#a6e61a] active:scale-98 text-[#1e032b] font-black text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all cursor-pointer"
          >
            <span>Adicionar ao pedido</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
