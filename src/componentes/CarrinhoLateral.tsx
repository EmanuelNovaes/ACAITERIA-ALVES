import { ENFORCE_STORE_HOURS } from '../utilitarios/HorarioLoja';
import { getSelectedCoberturas } from '../utilitarios/Coberturas';
import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usarCarrinho } from '../contexto/ContextoCarrinho';
import { getProductTypeLabel } from '../utilitarios/RegrasCategorias';
import { ModalFinalizacaoPedido } from './ModalFinalizacaoPedido';

interface PropriedadesCarrinhoLateral {
  isEmbeddedDesktop?: boolean;
  storeIsOpen?: boolean;
  onClosedOrderAttempt?: () => void;
}

export const CarrinhoLateral: React.FC<PropriedadesCarrinhoLateral> = ({ isEmbeddedDesktop = false, storeIsOpen = true, onClosedOrderAttempt }) => {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
    deliveryFee,
    total,
  } = usarCarrinho();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const hasCartHistoryEntry = useRef(false);
  const closeCartRef = useRef(closeCart);
  closeCartRef.current = closeCart;

  useEffect(() => {
    if (!isCartOpen || isEmbeddedDesktop) return;

    window.history.pushState(
      { ...(window.history.state ?? {}), cartDrawerOpen: true },
      '',
      window.location.href,
    );
    hasCartHistoryEntry.current = true;

    const handleBack = () => {
      hasCartHistoryEntry.current = false;
      closeCartRef.current();
    };

    window.addEventListener('popstate', handleBack);
    return () => {
      window.removeEventListener('popstate', handleBack);
      if (hasCartHistoryEntry.current) {
        hasCartHistoryEntry.current = false;
        window.history.back();
      }
    };
  }, [isCartOpen, isEmbeddedDesktop]);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (ENFORCE_STORE_HOURS && !storeIsOpen) { onClosedOrderAttempt?.(); return; }
    setIsCheckoutOpen(true);
  };

  const handleOrderConfirmed = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#b6f625', '#35074a', '#ffffff'],
      });
    } catch {
      // ignora
    }

    setIsCheckoutOpen(false);
    closeCart();
  };

  if (!isEmbeddedDesktop && !isCartOpen) return null;

  const content = (
    <div className="flex flex-col bg-white text-slate-800 rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm">
      {/* Cabeçalho: [ 🛒 Meu pedido ⌄ ] */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Ícone SVG do carrinho */}
          <svg className="w-5 h-5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h2 className="font-extrabold text-base text-slate-900 leading-none">
            Meu pedido
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isEmbeddedDesktop ? (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              aria-label="Minimizar pedido"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={closeCart}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4 pt-3">
          {/* Lista de itens */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum item adicionado
              </div>
            ) : (
              items.map((item) => {
                const complementsText = item.selectedComplements.map((c) => c.name).join(', ');
                const displaySub = complementsText || (item.selectedSize ? item.selectedSize.label : '');

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    {/* Miniatura */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-50 shrink-0">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {item.productName} {item.selectedSize ? `(${item.selectedSize.label})` : ''}
                      </h4>
                      {item.isCombo ? (
                        <div className="mt-0.5">
                          <p className="text-[10px] font-extrabold text-purple-800 truncate">
                            {getProductTypeLabel(item.tipo) || getProductTypeLabel(item.comboCategoryName) || 'COMBO'}
                          </p>
                          {item.units != null && (
                            <p className="text-[10px] font-semibold text-purple-800">
                              {item.units} UNIDADES
                            </p>
                          )}
                        </div>
                      ) : getProductTypeLabel(item.tipo) && (
                        <p className="text-[10px] font-bold text-purple-800 truncate">
                          {getProductTypeLabel(item.tipo)}
                        </p>
                      )}
                      {item.selectedComplements && item.selectedComplements.length > 0 && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {item.selectedComplements.map((c) => c.name).join(', ')}
                        </p>
                      )}
                      {getSelectedCoberturas(item).length > 0 && (
                        <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                          Cobertura: <span className="text-purple-900">{getSelectedCoberturas(item).map(c => c.name).join(', ')}</span>
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[9px] text-slate-400 italic mt-0.5">
                          Observação: {item.notes}
                        </p>
                      )}

                      {/* Controle de quantidade */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-0.5 px-2 rounded-lg mt-1.5 w-fit">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-slate-500 hover:text-black font-bold text-xs"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center text-[11px] font-black text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-slate-500 hover:text-black font-bold text-xs"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Preço e exclusão */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-rose-500 hover:text-rose-600 transition-colors p-0.5"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-xs text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Subtotal, taxa de entrega e total (conforme image.png) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Taxa de entrega</span>
              <span className="font-bold text-slate-800">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span className="text-slate-900">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Botão verde-lima: [ Finalizar pedido → ] */}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-[#b6f625] hover:bg-[#a6e61a] active:scale-98 text-[#1e032b] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Finalizar pedido</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Selo de confiança da entrega: [ 🚚 Entrega rápida ... > ] (conforme image.png) */}
          <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-[#35074a] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="17" r="3" />
                  <circle cx="18" cy="17" r="3" />
                  <path d="m9 17 3-6h4l2 6M12 11l-2-3H7m5 3 3 3h3m-2-6h2l2 3" />
                </svg>
              </div>
              <div className="text-left">
                <h5 className="font-bold text-xs text-slate-900 leading-none">
                  Entrega Rápida
                </h5>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbeddedDesktop) {
    return (
      <>
        {content}
        <ModalFinalizacaoPedido
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirmed={handleOrderConfirmed}
          storeIsOpen={storeIsOpen}
          onClosedOrderAttempt={onClosedOrderAttempt}
        />
      </>
    );
  }

  // Painel lateral deslizante para celular
  return (
    <>
      <div className="fixed inset-x-0 top-0 bottom-[54px] z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
        <div className="w-full sm:max-w-md h-full bg-white shadow-2xl flex flex-col p-4 overflow-y-auto">
          {content}
        </div>
      </div>
      <ModalFinalizacaoPedido
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmed={handleOrderConfirmed}
        storeIsOpen={storeIsOpen}
        onClosedOrderAttempt={onClosedOrderAttempt}
      />
    </>
  );
};

