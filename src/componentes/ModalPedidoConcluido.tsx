import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, RotateCcw, X, ExternalLink } from 'lucide-react';
import { usarCarrinho } from '../contexto/ContextoCarrinho';
import { ExibicaoMascote } from './ExibicaoMascote';

export const ModalPedidoConcluido: React.FC = () => {
  const { lastOrderSent, setLastOrderSent, lastSentMessage, clearCart, storeConfig, sendOrderViaWhatsApp } = usarCarrinho();
  const [copied, setCopied] = useState(false);

  if (!lastOrderSent) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(lastSentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartNewOrder = () => {
    clearCart();
    setLastOrderSent(false);
  };

  const handleReopenWhatsApp = () => {
    const cleanPhone = storeConfig.whatsappNumber.replace(/\D/g, '');
    const encoded = encodeURIComponent(lastSentMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 text-center">
        {/* Mascote comemorando */}
        <div className="pt-2 flex justify-center">
          <ExibicaoMascote size="md" speechBubbleText="Pedido enviado! 🎉" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2b0439]">
            Pedido Gerado com Sucesso!
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Seu pedido foi formatado e o WhatsApp da loja foi acionado. Envie a mensagem na conversa para confirmarmos o preparo!
          </p>
        </div>

        {/* Caixa de prévia da mensagem formatada */}
        <div className="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
          {lastSentMessage}
        </div>

        {/* Botões de ação */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleReopenWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-[#8ac627] hover:bg-[#7db71f] text-[#1c0326] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Reabrir WhatsApp da Loja</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            <button
              onClick={handleStartNewOrder}
              className="py-2.5 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-xs font-bold text-[#2b0439] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Novo Pedido</span>
            </button>
          </div>

          <button
            onClick={() => setLastOrderSent(false)}
            className="text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors block mx-auto"
          >
            Fechar este aviso (manter pedido na tela)
          </button>
        </div>
      </div>
    </div>
  );
};
