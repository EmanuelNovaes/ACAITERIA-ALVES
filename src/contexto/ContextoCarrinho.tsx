import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  CartItem,
  CustomerOrderInfo,
  DeliveryType,
  StoreConfig,
} from '../tipos/Cardapio';

import {
  INITIAL_STORE_CONFIG,
} from '../dados/ConfiguracaoCardapio';

import { buildWhatsAppOrderMessage } from '../utilitarios/MensagemPedido';

interface TipoContextoCarrinho {
  items: CartItem[];

  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;

  updateQuantity: (itemId: string, newQty: number) => void;

  removeItem: (itemId: string) => void;

  clearCart: () => void;

  subtotal: number;

  deliveryFee: number;

  total: number;

  itemCount: number;

  isCartOpen: boolean;

  openCart: () => void;

  closeCart: () => void;

  customerInfo: CustomerOrderInfo;

  updateCustomerInfo: (info: Partial<CustomerOrderInfo>) => void;

  setDeliveryType: (type: DeliveryType) => void;

  storeConfig: StoreConfig;

  updateStoreConfig: (config: Partial<StoreConfig>) => void;

  resetStoreConfig: () => void;

  sendOrderViaWhatsApp: (overrideInfo?: Partial<CustomerOrderInfo>, popupWindow?: Window | null, orderId?: string) => boolean;

  lastOrderSent: boolean;

  setLastOrderSent: (val: boolean) => void;

  lastSentMessage: string;
}

const CART_STORAGE_KEY = 'acaiteria_alves_cart_v4';

const STORE_CONFIG_KEY = 'acaiteria_alves_config_v4';

const CUSTOMER_INFO_KEY = 'acaiteria_alves_customer_v4';

const INITIAL_CUSTOMER_INFO: CustomerOrderInfo = {
  name: '',
  phone: '',
  deliveryType: 'entrega',
  address: '',
  neighborhood: '',
  referencePoint: '',
  paymentMethod: 'Pix',
  notes: '',
};

const ContextoCarrinho = createContext<TipoContextoCarrinho | undefined>(undefined);

export const ProvedorCarrinho: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // =========================================================
  // CARRINHO
  // =========================================================

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);

      if (!saved) return [];

      // Migra itens salvos pela versão anterior, que duplicava o tipo em
      // `acaiType`, para o campo `tipo` já usado pelo produto.
      const savedItems = JSON.parse(saved) as (CartItem & { acaiType?: string })[];
      return savedItems
        .filter((item) => item.id !== 'sample-acai-copo-500')
        .map(({ acaiType, ...item }) => ({
          ...item,
          tipo: acaiType || item.tipo,
        }));
    } catch {
      return [];
    }
  });

  // =========================================================
  // CONFIGURAÇÃO DA LOJA
  // =========================================================

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG_KEY);

      // A taxa de entrega é sempre a oficial (R$ 2,00): ignora valor antigo
      // que possa estar salvo no navegador de quem já visitou o cardápio.
      if (!saved) return INITIAL_STORE_CONFIG;

      const savedConfig = JSON.parse(saved) as Partial<StoreConfig>;
      let didMigrate = false;

      if (savedConfig.openingHours === 'Terça a Domingo das 13:00 às 22:30') {
        savedConfig.openingHours = '15:00 às 22:00';
        didMigrate = true;
      }

      const isLegacyAddress = (addr?: string) => {
        if (!addr) return true;
        const normalized = addr.trim().toLowerCase();
        return (
          normalized === 'av. principal dos sabores, 1200 - centro' ||
          normalized === 'itacuruba' ||
          normalized === 'itacuruba - pe' ||
          normalized === 'itacuruba-pe'
        );
      };

      if (isLegacyAddress(savedConfig.address)) {
        savedConfig.address = 'R. Rozendo Alves Teixeira, Itacuruba - PE';
        didMigrate = true;
      }
      if (savedConfig.whatsappNumber === '5587981491472') {
        savedConfig.whatsappNumber = INITIAL_STORE_CONFIG.whatsappNumber;
        didMigrate = true;
      }
      if (savedConfig.phoneFormatted === '(87) 98149-1472') {
        savedConfig.phoneFormatted = INITIAL_STORE_CONFIG.phoneFormatted;
        didMigrate = true;
      }

      if (didMigrate) {
        try {
          localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(savedConfig));
        } catch {
          // Mantém as configurações corrigidas na memória se o armazenamento estiver indisponível.
        }
      }

      return {
        ...INITIAL_STORE_CONFIG,
        ...savedConfig,
        address: isLegacyAddress(savedConfig.address)
          ? 'R. Rozendo Alves Teixeira, Itacuruba - PE'
          : (savedConfig.address || INITIAL_STORE_CONFIG.address),
        deliveryFee: INITIAL_STORE_CONFIG.deliveryFee,
      };
    } catch {
      return INITIAL_STORE_CONFIG;
    }
  });

  // =========================================================
  // DADOS DO CLIENTE
  // =========================================================

  const [customerInfo, setCustomerInfo] =
    useState<CustomerOrderInfo>(() => {
      try {
        const saved = localStorage.getItem(CUSTOMER_INFO_KEY);

        return saved
          ? {
            ...INITIAL_CUSTOMER_INFO,
            ...JSON.parse(saved),
          }
          : INITIAL_CUSTOMER_INFO;
      } catch {
        return INITIAL_CUSTOMER_INFO;
      }
    });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [lastOrderSent, setLastOrderSent] = useState(false);

  const [lastSentMessage, setLastSentMessage] = useState('');

  // =========================================================
  // SINCRONIZAÇÃO DO CARRINHO
  // =========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (e) {
      console.warn(
        'Falha ao salvar carrinho no localStorage',
        e
      );
    }
  }, [items]);

  // =========================================================
  // SINCRONIZAÇÃO DA CONFIGURAÇÃO
  // =========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORE_CONFIG_KEY,
        JSON.stringify(storeConfig)
      );
    } catch (e) {
      console.warn(
        'Falha ao salvar configuração no localStorage',
        e
      );
    }
  }, [storeConfig]);

  // =========================================================
  // SINCRONIZAÇÃO DOS DADOS DO CLIENTE
  // =========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOMER_INFO_KEY,
        JSON.stringify(customerInfo)
      );
    } catch (e) {
      console.warn(
        'Falha ao salvar dados do cliente no localStorage',
        e
      );
    }
  }, [customerInfo]);

  // =========================================================
  // CLIENTE
  // =========================================================

  const updateCustomerInfo = (
    info: Partial<CustomerOrderInfo>
  ) => {
    setCustomerInfo((prev) => ({
      ...prev,
      ...info,
    }));
  };

  const setDeliveryType = (type: DeliveryType) => {
    setCustomerInfo((prev) => ({
      ...prev,
      deliveryType: type,
    }));
  };

  // =========================================================
  // CONFIGURAÇÃO DA LOJA
  // =========================================================

  const updateStoreConfig = (
    config: Partial<StoreConfig>
  ) => {
    setStoreConfig((prev) => ({
      ...prev,
      ...config,
      deliveryFee: INITIAL_STORE_CONFIG.deliveryFee,
    }));
  };

  const resetStoreConfig = () => {
    setStoreConfig({
      ...INITIAL_STORE_CONFIG,
    });
  };

  // =========================================================
  // IDENTIFICADOR ÚNICO DO ITEM
  // =========================================================

  const createItemFingerprint = (
    item: Omit<CartItem, 'id' | 'totalPrice'>
  ) => {
    const sizePart =
      item.selectedSize?.id || 'standard';

    const tipoPart =
      (item.tipo || '').trim().toLowerCase();

    const coberturaPart =
      (item.cobertura || '').trim().toLowerCase();

    const complementsPart =
      item.selectedComplements
        .map((c) => c.name.toLowerCase())
        .sort()
        .join('-');

    const notesPart =
      (item.notes || '').trim();

    return `${item.productId}__${sizePart}__${tipoPart}__${coberturaPart}__${complementsPart}__${notesPart}`;
  };

  // =========================================================
  // ADICIONAR ITEM
  // =========================================================

  const addItem = (
    itemData: Omit<CartItem, 'id' | 'totalPrice'>
  ) => {
    const fingerprint =
      createItemFingerprint(itemData);

    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.id === fingerprint
      );

      if (existingIndex > -1) {
        const updated = [...currentItems];

        const existing = updated[existingIndex];

        const newQty =
          existing.quantity + itemData.quantity;

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty,
        };

        return updated;
      }

      const newItem: CartItem = {
        ...itemData,
        id: fingerprint,
        totalPrice:
          itemData.unitPrice * itemData.quantity,
      };

      return [...currentItems, newItem];
    });
  };

  // =========================================================
  // ATUALIZAR QUANTIDADE
  // =========================================================

  const updateQuantity = (
    itemId: string,
    newQty: number
  ) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
            ...item,
            quantity: newQty,
            totalPrice:
              item.unitPrice * newQty,
          }
          : item
      )
    );
  };

  // =========================================================
  // REMOVER ITEM
  // =========================================================

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== itemId
      )
    );
  };

  // =========================================================
  // LIMPAR CARRINHO
  // =========================================================

  const clearCart = () => {
    setItems([]);
  };

  // =========================================================
  // CONTROLE DO CARRINHO
  // =========================================================

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  // =========================================================
  // CÁLCULOS
  // =========================================================

  const subtotal = items.reduce(
    (acc, item) => acc + item.totalPrice,
    0
  );

  const deliveryFee =
    items.length > 0 &&
      customerInfo.deliveryType === 'entrega'
      ? storeConfig.deliveryFee
      : 0;

  const total = subtotal + deliveryFee;

  const itemCount = items.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  // =========================================================
  // FORMATAÇÃO DE VALORES
  // =========================================================

  // =========================================================
  // ENVIO DO PEDIDO PARA O WHATSAPP
  // =========================================================

  const sendOrderViaWhatsApp = (
    overrideInfo?: Partial<CustomerOrderInfo>,
    popupWindow?: Window | null,
    orderId?: string,
  ): boolean => {
    if (items.length === 0) {
      return false;
    }

    // Usa os dados recebidos na hora (overrideInfo) em vez de depender
    // do estado salvo no contexto, que pode ainda não ter sido
    // atualizado no momento exato desta chamada (evita o bug de o
    // endereço/nome/telefone não irem na mensagem).
    const orderInfo: CustomerOrderInfo = {
      ...customerInfo,
      ...overrideInfo,
    };

    const orderDeliveryFee = orderInfo.deliveryType === 'entrega' ? storeConfig.deliveryFee : 0;
    const fullMessage = buildWhatsAppOrderMessage(items, orderInfo, subtotal, orderDeliveryFee, orderId);

    setLastSentMessage(fullMessage);

    // -------------------------------------------------------
    // WHATSAPP
    // -------------------------------------------------------

    const cleanPhone =
      storeConfig.whatsappNumber.replace(
        /\D/g,
        ''
      );

    const encodedMessage =
      encodeURIComponent(fullMessage);

    const whatsappUrl =
      `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    if (popupWindow && !popupWindow.closed) {
      popupWindow.location.href = whatsappUrl;
    } else if (popupWindow === null) {
      window.location.assign(whatsappUrl);
    } else {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    setLastOrderSent(true);

    return true;
  };

  // =========================================================
  // PROVEDOR
  // =========================================================

  return (
    <ContextoCarrinho.Provider
      value={{
        items,

        addItem,

        updateQuantity,

        removeItem,

        clearCart,

        subtotal,

        deliveryFee,

        total,

        itemCount,

        isCartOpen,

        openCart,

        closeCart,

        customerInfo,

        updateCustomerInfo,

        setDeliveryType,

        storeConfig,

        updateStoreConfig,

        resetStoreConfig,

        sendOrderViaWhatsApp,

        lastOrderSent,

        setLastOrderSent,

        lastSentMessage,
      }}
    >
      {children}
    </ContextoCarrinho.Provider>
  );
};

// ===========================================================
// GANCHO
// ===========================================================

export const usarCarrinho = () => {
  const context = useContext(ContextoCarrinho);

  if (!context) {
    throw new Error(
      'usarCarrinho must be used within a ProvedorCarrinho'
    );
  }

  return context;
};
