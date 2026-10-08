import type { CartItem, CustomerOrderInfo } from '../tipos/Cardapio';
import { getProductTypeLabel } from './RegrasCategorias';

const clean = (value?: string) => (value || '')
  .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E3\uFFFD]/gu, '')
  .trim();
const currency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export function buildWhatsAppOrderMessage(
  items: CartItem[], info: CustomerOrderInfo, subtotal: number, deliveryFee: number, orderId?: string,
): string {
  const lines = [`*NOVO PEDIDO${clean(orderId) ? ` #${clean(orderId)}` : ''}*`, ''];
  const field = (label: string, value?: string) => {
    if (clean(value)) lines.push(`*${label}:* ${clean(value)}`);
  };
  field('Cliente', info.name);
  field('Telefone', info.phone);
  field('Modalidade', info.deliveryType === 'entrega' ? 'ENTREGA' : 'RETIRADA NO LOCAL');
  if (info.deliveryType === 'entrega') {
    field('Endereço', info.address);
    field('Bairro', info.neighborhood);
    field('Ponto de referência', info.referencePoint);
  }
  field('Pagamento', clean(info.paymentMethod).toLocaleUpperCase('pt-BR'));
  lines.push('', '*ITENS:*', '');
  for (const item of items) {
    const name = clean(item.productName);
    lines.push(`${item.quantity}x *${name.toLocaleUpperCase('pt-BR')}*`);
    const option = (label: string, value?: string) => {
      if (clean(value)) lines.push(`   • ${label}: ${clean(value)}`);
    };
    const type = getProductTypeLabel(item.tipo);
    if (type && clean(type).toLocaleUpperCase('pt-BR') !== name.toLocaleUpperCase('pt-BR')) option('Tipo', type);
    if (item.isCombo && item.units != null) option('Unidades no combo', String(item.units));
    option('Tamanho', item.selectedSize?.label);
    option('Cobertura', item.cobertura);
    option('Complementos', (item.selectedComplements || []).map(c => clean(c.name)).filter(Boolean).join(', '));
    option('Observação', item.notes);
    lines.push(`   ${currency(item.totalPrice)}`, '');
  }
  const fee = info.deliveryType === 'entrega' ? deliveryFee : 0;
  lines.push('--------------------------------', `*Subtotal:* ${currency(subtotal)}`, `*Entrega:* ${currency(fee)}`, '', `*TOTAL: ${currency(subtotal + fee)}*`);
  if (clean(info.notes)) lines.push('', '*Observações do pedido:*', clean(info.notes));
  lines.push('', '_Pedido gerado pelo Cardápio Digital Açaiteria Alves_');
  return lines.join('\n');
}
