import { supabase, isSupabaseConfigured } from './supabase';
import { CartItem, CustomerOrderInfo } from '../types/menu';
import { normalizePhone } from '../utils/phone';

export type OrderRecord = {
  id: string; cliente_id: string; status: string; subtotal: number; taxa_entrega: number; total: number;
  tipo_entrega: string; endereco: string; bairro: string; ponto_referencia: string; forma_pagamento: string;
  observacoes: string; created_at: string; clientes: { id: string; nome: string; telefone: string; endereco: string };
  pedido_itens: Array<{ id: string; produto_id: string; produto_nome: string; categoria_nome: string; quantidade: number; preco_unitario: number; subtotal: number; tamanho: any; complementos: any[]; cobertura: string; observacoes: string; detalhes: Record<string, unknown> }>;
};

export async function recordCheckoutOrder(info: CustomerOrderInfo, items: CartItem[], subtotal: number, deliveryFee: number, total: number) {
  if (!isSupabaseConfigured()) return null;
  const endereco = info.deliveryType === 'entrega'
    ? [info.address, info.neighborhood, info.referencePoint].filter(Boolean).join(', ')
    : '';
  const { data, error } = await supabase.rpc('registrar_pedido_checkout', {
    p_cliente: { nome: info.name, telefone: normalizePhone(info.phone), endereco },
    p_pedido: { subtotal, taxa_entrega: deliveryFee, total, tipo_entrega: info.deliveryType, endereco: info.address,
      bairro: info.neighborhood, ponto_referencia: info.referencePoint, forma_pagamento: info.paymentMethod, observacoes: info.notes },
    p_itens: items.map(item => ({ produto_id: item.productId, produto_nome: item.productName, categoria_nome: item.categoryName,
      quantidade: item.quantity, preco_unitario: item.unitPrice, subtotal: item.totalPrice, tamanho: item.selectedSize ?? null,
      complementos: item.selectedComplements ?? [], cobertura: item.cobertura ?? '', observacoes: item.notes ?? '',
      detalhes: { tipo: item.tipo ?? null, is_combo: item.isCombo ?? false, combo_categoria: item.comboCategoryName ?? null, unidades: item.units ?? null } }))
  });
  if (error) throw error;
  return data as string;
}

export async function getDashboardOrders() {
  const { data, error } = await supabase.from('pedidos')
    .select('*, clientes(id,nome,telefone,endereco), pedido_itens(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRecord[];
}

export async function updateOrderStatus(id: string, status: string) {
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
  if (error) throw error;
}
