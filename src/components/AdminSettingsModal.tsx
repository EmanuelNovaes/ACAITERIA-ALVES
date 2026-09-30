import React, { useState } from 'react';
import { X, Save, RotateCcw, Phone, Store, Clock, MapPin, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const { storeConfig, updateStoreConfig, resetStoreConfig } = useCart();

  const [whatsapp, setWhatsapp] = useState(storeConfig.whatsappNumber);
  const [storeName, setStoreName] = useState(storeConfig.storeName);
  const [openingHours, setOpeningHours] = useState(storeConfig.openingHours);
  const [address, setAddress] = useState(storeConfig.address);
  const [isOpenStore, setIsOpenStore] = useState(storeConfig.isOpen);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig({
      whatsappNumber: whatsapp,
      storeName,
      openingHours,
      address,
      isOpen: isOpenStore,
    });
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar as configurações padrão da loja?')) {
      resetStoreConfig();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                Configurações da Loja
              </h2>
              <p className="text-[11px] text-slate-500">
                Gerencie o WhatsApp de destino e dados do cardápio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* WhatsApp Number (Key Configuration) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Número do WhatsApp (com DDI e DDD)</span>
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex: 5511999999999"
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#8ac627] focus:bg-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 block">
              Formato: 55 + DDD + Número sem espaços nem traços. Link destino:{' '}
              <code className="text-purple-700">https://wa.me/{whatsapp.replace(/\D/g, '')}</code>
            </span>
          </div>

          {/* Store Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-purple-600" />
              <span>Nome do Estabelecimento</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#8ac627] focus:bg-white text-xs"
            />
          </div>

          {/* Opening Hours */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Horário de Funcionamento</span>
            </label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ex: Terça a Domingo das 13:00 às 22:30"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#8ac627] focus:bg-white text-xs"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Endereço da Loja</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#8ac627] focus:bg-white text-xs"
            />
          </div>

          {/* Open/Close Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div>
              <span className="font-bold text-slate-800 block">Status da Loja</span>
              <span className="text-[11px] text-slate-500">
                {isOpenStore ? 'Aberto para receber pedidos' : 'Fechado no momento'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpenStore(!isOpenStore)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer ${isOpenStore
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 text-slate-700'
                }`}
            >
              {isOpenStore ? 'Aberto' : 'Fechado'}
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-[#8ac627] hover:bg-[#7db71f] text-[#1c0326] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" />
                  <span>Configurações Salvas!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
              title="Restaurar padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
