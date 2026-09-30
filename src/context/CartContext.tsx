import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  CartItem,
  CustomerOrderInfo,
  DeliveryType,
  StoreConfig,
} from '../types/menu';

import {
  INITIAL_STORE_CONFIG,
  INITIAL_SAMPLE_CART,
} from '../data/menuConfig';

import { getAcaiTypeMessageLabel } from '../utils/categoryRules';

interface CartContextType {
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

  sendOrderViaWhatsApp: (overrideInfo?: Partial<CustomerOrderInfo>) => boolean;

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // =========================================================
  // CARRINHO
  // =========================================================

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);

      if (!saved) return INITIAL_SAMPLE_CART;

      // Migra itens salvos pela versão anterior, que duplicava o tipo em
      // `acaiType`, para o campo `tipo` já usado pelo produto.
      const savedItems = JSON.parse(saved) as (CartItem & { acaiType?: string })[];
      return savedItems.map(({ acaiType, ...item }) => ({
        ...item,
        tipo: acaiType || item.tipo,
      }));
    } catch {
      return INITIAL_SAMPLE_CART;
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
      return saved
        ? {
          ...INITIAL_STORE_CONFIG,
          ...JSON.parse(saved),
          deliveryFee: INITIAL_STORE_CONFIG.deliveryFee,
        }
        : INITIAL_STORE_CONFIG;
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
      (item.notes || '').trim().toLowerCase();

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

  const formatCurrency = (value: number) => {
    return `R$ ${value
      .toFixed(2)
      .replace('.', ',')}`;
  };

  const removeUnsafeEmoji = (value: string) =>
    value.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3\uFFFD]/gu, '');

  // =========================================================
  // ENVIO DO PEDIDO PARA O WHATSAPP
  // =========================================================

  const sendOrderViaWhatsApp = (
    overrideInfo?: Partial<CustomerOrderInfo>
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

    const lines: string[] = [];

    // -------------------------------------------------------
    // CABEÇALHO
    // -------------------------------------------------------

    lines.push(
      `Olá! Gostaria de fazer um pedido:\n`
    );

    // -------------------------------------------------------
    // PRODUTOS
    // -------------------------------------------------------

    items.forEach((item) => {
      if (item.isCombo) {
        lines.push(`*${item.comboCategoryName || 'Outros Combos'}*`);
      }

      // Tipo do açaí (copo ou marmita) de acordo com o produto escolhido
      const acaiTypeLabel = getAcaiTypeMessageLabel(item.tipo);
      if (acaiTypeLabel) {
        lines.push(`*${acaiTypeLabel.toLocaleUpperCase('pt-BR')}*`);
      }
      lines.push(`*${item.productName}*`);

      if (item.isCombo) {
        if (item.units != null) lines.push(`Unidades no combo: ${item.units}`);
      }

      if (item.selectedSize) {
        lines.push(
          `Tamanho: ${item.selectedSize.label}`
        );
      }

      if (item.tipo && !acaiTypeLabel && !item.isCombo) {
        lines.push(`Opção: ${item.tipo}`);
      }

      if (
        item.selectedComplements &&
        item.selectedComplements.length > 0
      ) {
        lines.push(`\nAcompanhamentos:`);

        item.selectedComplements.forEach(
          (comp) => {
            lines.push(`- ${comp.name}`);
          }
        );
      }

      if (item.cobertura) {
        lines.push(
          `\nCobertura: ${item.cobertura}`
        );
      }

      if (item.notes && item.notes.trim()) {
        lines.push(
          `Obs: ${item.notes.trim()}`
        );
      }

      lines.push(
        `\nQuantidade: ${item.quantity}`
      );

      lines.push(
        `Valor: ${formatCurrency(
          item.totalPrice
        )}\n`
      );
      lines.push(`--------------------------------`);
    });

    // -------------------------------------------------------
    // VALORES
    // -------------------------------------------------------

    lines.push(
      `Subtotal: ${formatCurrency(subtotal)}`
    );

    // Recalcula a taxa de entrega e o total com base no orderInfo
    // (dados recebidos agora), e não no estado antigo do contexto.
    const orderDeliveryFee =
      items.length > 0 && orderInfo.deliveryType === 'entrega'
        ? storeConfig.deliveryFee
        : 0;

    const orderTotal = subtotal + orderDeliveryFee;

    if (
      orderInfo.deliveryType === 'entrega'
    ) {
      lines.push(
        `Taxa de entrega: ${formatCurrency(
          orderDeliveryFee
        )}`
      );
    }

    lines.push(
      `*Total: ${formatCurrency(orderTotal)}*`
    );

    // -------------------------------------------------------
    // DADOS DO CLIENTE
    // -------------------------------------------------------

    lines.push(`\n*Dados do Pedido:*`);

    if (orderInfo.name.trim()) {
      lines.push(
        `Nome: ${orderInfo.name.trim()}`
      );
    }

    if (orderInfo.phone.trim()) {
      lines.push(
        `Telefone: ${orderInfo.phone.trim()}`
      );
    }

    // -------------------------------------------------------
    // ENTREGA
    // -------------------------------------------------------

    if (
      orderInfo.deliveryType === 'entrega'
    ) {
      lines.push(`Tipo: Entrega`);

      if (orderInfo.address.trim()) {
        lines.push(
          `Endereço: ${orderInfo.address.trim()}`
        );
      }

      if (orderInfo.neighborhood.trim()) {
        lines.push(
          `Bairro: ${orderInfo.neighborhood.trim()}`
        );
      }

      if (
        orderInfo.referencePoint.trim()
      ) {
        lines.push(
          `Ponto de referência: ${orderInfo.referencePoint.trim()}`
        );
      }
    } else {
      // -----------------------------------------------------
      // RETIRADA
      // -----------------------------------------------------

      lines.push(
        `Tipo: Retirada no local`
      );
    }

    // -------------------------------------------------------
    // PAGAMENTO
    // -------------------------------------------------------

    if (orderInfo.paymentMethod) {
      lines.push(
        `Forma de pagamento: ${orderInfo.paymentMethod}`
      );
    }

    // -------------------------------------------------------
    // OBSERVAÇÕES
    // -------------------------------------------------------

    if (
      orderInfo.notes &&
      orderInfo.notes.trim()
    ) {
      lines.push(
        `Observações: ${orderInfo.notes.trim()}`
      );
    }

    // -------------------------------------------------------
    // RODAPÉ
    // -------------------------------------------------------

    lines.push(
      `\n_Pedido gerado pelo Cardápio Digital Açaiteria Alves_`
    );

    // -------------------------------------------------------
    // MENSAGEM FINAL
    // -------------------------------------------------------

    const fullMessage = removeUnsafeEmoji(lines.join('\n'));

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

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );

    setLastOrderSent(true);

    return true;
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <CartContext.Provider
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
    </CartContext.Provider>
  );
};

// ===========================================================
// HOOK
// ===========================================================

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used within a CartProvider'
    );
  }

  return context;
};
