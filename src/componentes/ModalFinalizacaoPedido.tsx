import React, { useLayoutEffect, useRef, useState } from 'react';
import { X, Truck, Store, AlertCircle, ArrowRight } from 'lucide-react';
import { usarCarrinho } from '../contexto/ContextoCarrinho';
import { DeliveryType } from '../tipos/Cardapio';
import { formatBrazilPhone, isValidBrazilPhone } from '../utilitarios/Telefone';
import { recordCheckoutOrder } from '../servicos/ServicoPedidos';
import { isStoreOpenAt } from '../utilitarios/HorarioLoja';

interface PropriedadesModalFinalizacaoPedido {
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  storeIsOpen?: boolean;
  onClosedOrderAttempt?: () => void;
}

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'];

export const ModalFinalizacaoPedido: React.FC<PropriedadesModalFinalizacaoPedido> = ({ isOpen, onClose, onConfirmed, storeIsOpen = true, onClosedOrderAttempt }) => {
  const { customerInfo, items, updateCustomerInfo, setDeliveryType, storeConfig, sendOrderViaWhatsApp } = usarCarrinho();

  const [name, setName] = useState(customerInfo.name);
  const [phone, setPhone] = useState(customerInfo.phone);
  const [deliveryType, setLocalDeliveryType] = useState<DeliveryType>(customerInfo.deliveryType);
  const [address, setAddress] = useState(customerInfo.address);
  const [neighborhood, setNeighborhood] = useState(customerInfo.neighborhood);
  const [referencePoint, setReferencePoint] = useState(customerInfo.referencePoint);
  const [paymentMethod, setPaymentMethod] = useState(customerInfo.paymentMethod || 'Pix');
  const [notes, setNotes] = useState(customerInfo.notes);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const checkoutAttempt = useRef<{ signature: string; key: string } | null>(null);

  useLayoutEffect(() => {
    if (isOpen) {
      setName(customerInfo.name);
      setPhone(formatBrazilPhone(customerInfo.phone));
      setLocalDeliveryType(customerInfo.deliveryType);
      setAddress(customerInfo.address);
      setNeighborhood(customerInfo.neighborhood);
      setReferencePoint(customerInfo.referencePoint);
      setPaymentMethod(customerInfo.paymentMethod || 'Pix');
      setNotes('');
      setError('');
    }
  }, [isOpen, customerInfo]);

  if (!isOpen) return null;

  const allowDelivery = storeConfig.allowDelivery !== false;
  const allowPickup = storeConfig.allowPickup !== false;

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const handleSubmit = async () => {
    if (submitting.current) return;
    if (!items.length) { setError('Adicione itens ao pedido.'); return; }
    if (!storeIsOpen || !isStoreOpenAt()) { onClosedOrderAttempt?.(); return; }
    if (!name.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (!isValidBrazilPhone(phone)) {
      setError('Informe um telefone válido com DDD.');
      return;
    }
    if (deliveryType === 'entrega') {
      if (!address.trim()) {
        setError('Informe o endereço para entrega.');
        return;
      }
      if (!neighborhood.trim()) {
        setError('Informe o bairro para entrega.');
        return;
      }
    }

    setError('');

    const finalInfo = {
      name: name.trim(),
      phone: formatBrazilPhone(phone),
      deliveryType,
      address: deliveryType === 'entrega' ? address.trim() : '',
      neighborhood: deliveryType === 'entrega' ? neighborhood.trim() : '',
      referencePoint: deliveryType === 'entrega' ? referencePoint.trim() : '',
      paymentMethod,
      notes: notes.trim(),
    };

    // Salva os dados para preencher o formulário automaticamente da
    // próxima vez, e envia a mensagem já com os dados atuais (finalInfo)
    // passados diretamente, sem depender do tempo de atualização do
    // estado do React.
    submitting.current = true;
    setSaving(true);
    sendOrderViaWhatsApp(finalInfo);
    setDeliveryType(deliveryType);
    updateCustomerInfo(finalInfo);
    onConfirmed();
    try {
      const orderSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee = deliveryType === 'entrega' ? storeConfig.deliveryFee : 0;
      const signature = JSON.stringify([finalInfo, items, orderSubtotal, deliveryFee]);
      if (checkoutAttempt.current?.signature !== signature) {
        checkoutAttempt.current = { signature, key: crypto.randomUUID() };
      }
      await recordCheckoutOrder(finalInfo, items, orderSubtotal, deliveryFee, orderSubtotal + deliveryFee, checkoutAttempt.current.key);
    } catch (e) {
      console.error('Não foi possível salvar o pedido no Supabase.', e);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-lg sm:text-xl font-black text-[#2b0439]">Finalizar Pedido</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dados do cliente */}
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatBrazilPhone(e.target.value))}
              placeholder="Ex: (87) 99999-9999"
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        {/* Retirada ou Entrega */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Como deseja receber?</label>
          <div className="grid grid-cols-2 gap-2">
            {allowPickup && (
              <button
                type="button"
                onClick={() => setLocalDeliveryType('retirada')}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  deliveryType === 'retirada'
                    ? 'border-[#8ac627] bg-[#f2ffdd] text-[#2b0439]'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Store className="w-5 h-5" />
                <span>Retirar no local</span>
              </button>
            )}
            {allowDelivery && (
              <button
                type="button"
                onClick={() => setLocalDeliveryType('entrega')}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  deliveryType === 'entrega'
                    ? 'border-[#8ac627] bg-[#f2ffdd] text-[#2b0439]'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span>Entrega</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {formatCurrency(storeConfig.deliveryFee || 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Endereço, exibido apenas se Entrega selecionado */}
        {deliveryType === 'entrega' && (
          <div className="space-y-2.5 bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Endereço (rua e número)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 123"
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Centro"
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ponto de referência (opcional)</label>
              <input
                type="text"
                value={referencePoint}
                onChange={(e) => setReferencePoint(e.target.value)}
                placeholder="Ex: Perto da praça"
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
        )}

        {/* Forma de pagamento */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Forma de pagamento</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Observações */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Observações (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl bg-[#b6f625] hover:bg-[#a6e61a] active:scale-98 text-[#1e032b] font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <span>{saving ? 'Salvando pedido...' : 'Finalizar pedido'}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
