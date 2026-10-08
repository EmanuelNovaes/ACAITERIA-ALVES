import { getSelectedCoberturas } from '../utilitarios/Coberturas';
import { supabase, isSupabaseConfigured } from './supabase';
import { CartItem, CustomerOrderInfo } from '../tipos/Cardapio';
import { normalizePhone } from '../utilitarios/Telefone';

export type OrderRecord = {
  id: string; cliente_id: string; subtotal: number; taxa_entrega: number; total: number;
  tipo_entrega: string; endereco: string; bairro: string; ponto_referencia: string; forma_pagamento: string;
  observacoes: string; created_at: string; clientes: { id: string; nome: string; telefone: string; endereco: string };
  pedido_itens: Array<{ id: string; produto_id: string; produto_nome: string; categoria_nome: string; quantidade: number; preco_unitario: number; subtotal: number; tamanho: any; complementos: any[]; cobertura: string; observacoes: string; detalhes: Record<string, unknown> }>;
};

export async function recordCheckoutOrder(info: CustomerOrderInfo, items: CartItem[], subtotal: number, deliveryFee: number, total: number, checkoutKey: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase não configurado');
  const endereco = info.deliveryType === 'entrega'
    ? [info.address, info.neighborhood, info.referencePoint].filter(Boolean).join(', ')
    : '';
  const { data, error } = await supabase.rpc('registrar_pedido_checkout', {
    p_cliente: { nome: info.name, telefone: normalizePhone(info.phone), endereco },
    p_pedido: { checkout_key: checkoutKey, subtotal, taxa_entrega: deliveryFee, total, tipo_entrega: info.deliveryType, endereco: info.address,
      bairro: info.neighborhood, ponto_referencia: info.referencePoint, forma_pagamento: info.paymentMethod, observacoes: info.notes },
    p_itens: items.map(item => ({ produto_id: item.productId, produto_nome: item.productName, categoria_nome: item.categoryName,
      quantidade: item.quantity, preco_unitario: item.unitPrice, subtotal: item.totalPrice, tamanho: item.selectedSize ?? null,
      complementos: item.selectedComplements ?? [], cobertura: getSelectedCoberturas(item).map(c => c.name).join(', '), observacoes: item.notes ?? '',
      detalhes: { coberturas: getSelectedCoberturas(item), tipo: item.tipo ?? null, is_combo: item.isCombo ?? false, combo_categoria: item.comboCategoryName ?? null, unidades: item.units ?? null } }))
  });
  if (error) throw error;
  if (typeof data !== 'string' || !data) throw new Error('Registro do pedido não confirmado');
  return data;
}

export async function getDashboardOrders() {
  const { data, error } = await supabase.from('pedidos')
    .select('*, clientes(id,nome,telefone,endereco), pedido_itens(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRecord[];
}
