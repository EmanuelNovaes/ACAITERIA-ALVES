import {
  Complement,
  Cobertura,
  OpcaoAcai,
  StoreConfig,
} from '../tipos/Cardapio';

import mascotImg from '/mascotenovo.webp';
import acaiTigelaCardImg from '../recursos/imagens/acai_tigela_card_1790429880092.webp';
import acaiCopoCardImg from '../recursos/imagens/acai_copo_card_1790429894196.webp';
import acaiZeroCardImg from '../recursos/imagens/acai_zero_card_1790429906887.webp';
import acaiNatCardImg from '../recursos/imagens/acai_nat_card_1790429925362.webp';
import salgadosImg from '../recursos/imagens/salgados_coxinha_1790427486921.webp';
import churrosImg from '../recursos/imagens/churros_doce_leite_1790427498511.webp';
import milkshakeImg from '../recursos/imagens/milkshake_gourmet_1790427508507.webp';
import sorveteImg from '../recursos/imagens/sorvete_gelato_1790427525055.webp';
import comboImg from '../recursos/imagens/combo_especial_1790427541529.webp';

export const ASSETS = {
  mascot: mascotImg,
  acaiTigela: acaiTigelaCardImg,
  acaiCopo: acaiCopoCardImg,
  acaiZero: acaiZeroCardImg,
  acaiNatural: acaiNatCardImg,
  salgados: salgadosImg,
  churros: churrosImg,
  milkshake: milkshakeImg,
  sorvete: sorveteImg,
  combo: comboImg,
};

// Configuração oficial da loja com o WhatsApp solicitado +55 87 9665-2148
export const INITIAL_STORE_CONFIG: StoreConfig = {
  storeName: 'Açaiteria Alves',
  tagline: 'Sabor, qualidade e muito mais energia para o seu dia!',
  whatsappNumber: '558796652148',
  phoneFormatted: '+55 87 9665-2148',
  instagram: '@acaiteriaalves.s',
  address: 'R. Rozendo Alves Teixeira, Itacuruba - PE',
  openingHours: '15:00 às 22:00',
  isOpen: true,
  currencySymbol: 'R$',
  allowDelivery: true,
  allowPickup: true,
  deliveryFee: 2.0,
  deliveryEstimateMinutes: '35 - 50 min',
  pickupEstimateMinutes: '15 - 25 min',
};

// Acompanhamentos confirmados (19 itens)
export const INITIAL_ACOMPANHAMENTOS: Complement[] = [
  { id: 'mm', name: 'M&M', category: 'acompanhamento', active: true, order: 1 },
  { id: 'mini_choco_ball', name: 'Mini Choco Ball', category: 'acompanhamento', active: true, order: 2 },
  { id: 'jujuba', name: 'Jujuba', category: 'acompanhamento', active: true, order: 3 },
  { id: 'farinha_lactea', name: 'Farinha Láctea', category: 'acompanhamento', active: true, order: 4 },
  { id: 'canudo_wafer', name: 'Canudo Wafer', category: 'acompanhamento', active: true, order: 5 },
  { id: 'granola', name: 'Granola', category: 'acompanhamento', active: true, order: 6 },
  { id: 'leite_po', name: 'Leite em Pó', category: 'acompanhamento', active: true, order: 7 },
  { id: 'pacoca', name: 'Paçoca', category: 'acompanhamento', active: true, order: 8 },
  { id: 'amendoim', name: 'Amendoim', category: 'acompanhamento', active: true, order: 9 },
  { id: 'leite_condensado', name: 'Leite Condensado', category: 'acompanhamento', active: true, order: 10 },
  { id: 'ovomaltine', name: 'Ovomaltine', category: 'acompanhamento', active: true, order: 11 },
  { id: 'creme_amendoim', name: 'Creme de Amendoim', category: 'acompanhamento', active: true, order: 12 },
  { id: 'creme_nutella', name: 'Creme de Nutella', category: 'acompanhamento', active: true, order: 13 },
  { id: 'creme_oreo', name: 'Creme Oreo', category: 'acompanhamento', active: true, order: 14 },
  { id: 'creme_ninho', name: 'Creme de Ninho', category: 'acompanhamento', active: true, order: 15 },
  { id: 'chocolate_esquimo', name: 'Chocolate ao Leite (Esquimó)', category: 'acompanhamento', active: true, order: 16 },
  { id: 'morango', name: 'Morango', category: 'acompanhamento', active: true, order: 17 },
  { id: 'banana', name: 'Banana', category: 'acompanhamento', active: true, order: 18 },
  { id: 'kiwi', name: 'Kiwi', category: 'acompanhamento', active: true, order: 19 },
];

// Coberturas confirmadas (11 itens - Regra: exatamente 1)
export const INITIAL_COBERTURAS: Cobertura[] = [
  { id: 'abacaxi', name: 'Abacaxi', active: true, order: 1 },
  { id: 'morango', name: 'Morango', active: true, order: 2 },
  { id: 'menta', name: 'Menta', active: true, order: 3 },
  { id: 'chocolate', name: 'Chocolate', active: true, order: 4 },
  { id: 'blue_ice', name: 'Blue Ice', active: true, order: 5 },
  { id: 'amora', name: 'Amora', active: true, order: 6 },
  { id: 'acai', name: 'Açaí', active: true, order: 7 },
  { id: 'uva', name: 'Uva', active: true, order: 8 },
  { id: 'caramelo', name: 'Caramelo', active: true, order: 9 },
  { id: 'leite_condensado', name: 'Leite Condensado', active: true, order: 10 },
  { id: 'maracuja', name: 'Maracujá', active: true, order: 11 },
];

// Opções de açaí confirmadas (5 itens)
export const INITIAL_OPCOES_ACAI: OpcaoAcai[] = [
  { id: 'acai_leitinho', name: 'Açaí + Leitinho', active: true, order: 1 },
  { id: 'acai_avela', name: 'Açaí + Avelã', active: true, order: 2 },
  { id: 'acai_zero', name: 'Açaí Zero', active: true, order: 3 },
  { id: 'acai_banana', name: 'Açaí + Banana', active: true, order: 4 },
  { id: 'acai_natural', name: 'Açaí Natural', active: true, order: 5 },
];

// Tamanhos de açaí no copo (Seção 4):
// 300ml: R$ 16,00 (máximo 3)
// 400ml: R$ 20,00 (máximo 4)
// 500ml: R$ 22,00 (máximo 6)
export const SIZES_ACAI_COPO = [
  { id: '300ml', label: '300ml', volume: '300ml', price: 16.0, maxComplements: 3, isDefault: true, active: true },
  { id: '400ml', label: '400ml', volume: '400ml', price: 20.0, maxComplements: 4, active: true },
  { id: '500ml', label: '500ml', volume: '500ml', price: 22.0, maxComplements: 6, active: true },
];

// Tamanhos de açaí na marmita (Seção 5):
// 300ml: R$ 17,00 (máximo 4)
// 500ml: R$ 22,00 (máximo 8)
export const SIZES_ACAI_MARMITA = [
  { id: '300ml', label: '300ml', volume: '300ml', price: 17.0, maxComplements: 4, isDefault: true, active: true },
  { id: '500ml', label: '500ml', volume: '500ml', price: 22.0, maxComplements: 8, active: true },
];

export const STANDARD_COMPLEMENTS = INITIAL_ACOMPANHAMENTOS;
