import {
  CategoryId,
  Complement,
  Cobertura,
  OpcaoAcai,
  Product,
  StoreConfig,
} from '../types/menu';

import heroBannerImg from '../assets/images/hero_banner_alves_1790429863758.jpg';
import mascotImg from '../assets/images/mascote_acai_1790427572802.jpg';
import acaiTigelaCardImg from '../assets/images/acai_tigela_card_1790429880092.jpg';
import acaiCopoCardImg from '../assets/images/acai_copo_card_1790429894196.jpg';
import acaiZeroCardImg from '../assets/images/acai_zero_card_1790429906887.jpg';
import acaiNatCardImg from '../assets/images/acai_nat_card_1790429925362.jpg';
import salgadosImg from '../assets/images/salgados_coxinha_1790427486921.jpg';
import churrosImg from '../assets/images/churros_doce_leite_1790427498511.jpg';
import milkshakeImg from '../assets/images/milkshake_gourmet_1790427508507.jpg';
import sorveteImg from '../assets/images/sorvete_gelato_1790427525055.jpg';
import comboImg from '../assets/images/combo_especial_1790427541529.jpg';

export const ASSETS = {
  heroBanner: heroBannerImg,
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

// Official Store Configuration with requested WhatsApp (87) 98149-1472
export const INITIAL_STORE_CONFIG: StoreConfig = {
  storeName: 'Açaiteria Alves',
  tagline: 'Sabor, qualidade e muito mais energia para o seu dia!',
  whatsappNumber: '5587981491472',
  phoneFormatted: '(87) 98149-1472',
  instagram: '@acaiteriaalves.s',
  address: 'Itacuruba',
  openingHours: '15:00 às 22:00',
  isOpen: true,
  currencySymbol: 'R$',
  allowDelivery: true,
  allowPickup: true,
  deliveryFee: 2.0,
  deliveryEstimateMinutes: '35 - 50 min',
  pickupEstimateMinutes: '15 - 25 min',
};

// Categories matching exact prompt specification
export const CATEGORIES: { id: CategoryId; name: string; icon: string; description: string }[] = [
  { id: 'acai', name: 'Açaí', icon: 'Bowl', description: 'Monte seu açaí no copo ou na marmita com os melhores acompanhamentos e coberturas!' },
  { id: 'sorvetes', name: 'Sorvetes', icon: 'IceCream', description: 'Diversos sabores artesanais e cremosos para você se refrescar.' },
  { id: 'salgados', name: 'Salgados & Churros', icon: 'Utensils', description: 'Crocantes, sequinhos e quentinhos, perfeitos para acompanhar!' },
  { id: 'milkshakes', name: 'Milk Shakes', icon: 'CupSoda', description: 'Cremosos, geladinhos e com muito recheio, feitos na hora!' },
  { id: 'bebidas', name: 'Bebidas', icon: 'GlassWater', description: 'Sucos naturais, refrigerantes e água para matar sua sede.' },
];

// Exact confirmed Acompanhamentos (19 items)
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

// Exact confirmed Coberturas (11 items - Regra: exatamente 1)
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

// Exact confirmed Opções de Açaí (5 items)
export const INITIAL_OPCOES_ACAI: OpcaoAcai[] = [
  { id: 'acai_leitinho', name: 'Açaí + Leitinho', active: true, order: 1 },
  { id: 'acai_avela', name: 'Açaí + Avelã', active: true, order: 2 },
  { id: 'acai_zero', name: 'Açaí Zero', active: true, order: 3 },
  { id: 'acai_banana', name: 'Açaí + Banana', active: true, order: 4 },
  { id: 'acai_natural', name: 'Açaí Natural', active: true, order: 5 },
];

// Sizes for Açaí no Copo (section 4):
// 300ml: R$ 16,00 (max 3)
// 400ml: R$ 20,00 (max 4)
// 500ml: R$ 22,00 (max 6)
export const SIZES_ACAI_COPO = [
  { id: '300ml', label: '300ml', volume: '300ml', price: 16.0, maxComplements: 3, isDefault: true, active: true },
  { id: '400ml', label: '400ml', volume: '400ml', price: 20.0, maxComplements: 4, active: true },
  { id: '500ml', label: '500ml', volume: '500ml', price: 22.0, maxComplements: 6, active: true },
];

// Sizes for Açaí na Marmita (section 5):
// 300ml: R$ 17,00 (max 4)
// 500ml: R$ 22,00 (max 8)
export const SIZES_ACAI_MARMITA = [
  { id: '300ml', label: '300ml', volume: '300ml', price: 17.0, maxComplements: 4, isDefault: true, active: true },
  { id: '500ml', label: '500ml', volume: '500ml', price: 22.0, maxComplements: 8, active: true },
];

// Initial Real Confirmed Products
export const INITIAL_PRODUCTS: Product[] = [
  // 1. Açaí no Copo (Principal)
  {
    id: 'acai-copo',
    name: 'Açaí no Copo',
    categoryId: 'acai',
    description: 'Açaí batido na hora, super cremoso. Escolha o tamanho, sua base, acompanhamentos e cobertura favorita!',
    image: acaiCopoCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 1,
  },
  // 2. Açaí na Marmita (Principal)
  {
    id: 'acai-marmita',
    name: 'Açaí na Marmita',
    categoryId: 'acai',
    description: 'Marmita recheada com açaí bem geladinho e generosas camadas de acompanhamentos e cobertura!',
    image: acaiTigelaCardImg,
    basePrice: 17.0,
    sizes: SIZES_ACAI_MARMITA,
    maxFreeComplements: 4,
    active: true,
    order: 2,
  },
  // 3. Açaí + Leitinho
  {
    id: 'acai-leitinho',
    name: 'Açaí + Leitinho',
    categoryId: 'acai',
    description: 'Açaí especial com toque cremoso de leitinho em pó. Escolha no copo ou na marmita!',
    image: acaiCopoCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 3,
  },
  // 4. Açaí + Avelã
  {
    id: 'acai-avela',
    name: 'Açaí + Avelã',
    categoryId: 'acai',
    description: 'A combinação irresistível de açaí cremoso com creme de avelã de alta qualidade.',
    image: acaiCopoCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 4,
  },
  // 5. Açaí Zero
  {
    id: 'acai-zero',
    name: 'Açaí Zero',
    categoryId: 'acai',
    description: 'Todo o sabor do açaí puro, sem adição de açúcares ou xaropes.',
    image: acaiZeroCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 5,
  },
  // 6. Açaí + Banana
  {
    id: 'acai-banana',
    name: 'Açaí + Banana',
    categoryId: 'acai',
    description: 'Batido tradicional com banana fresca selecionada, energia pura!',
    image: acaiNatCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 6,
  },
  // 7. Açaí Natural
  {
    id: 'acai-natural',
    name: 'Açaí Natural',
    categoryId: 'acai',
    description: 'Açaí puro e autêntico, perfeito para quem ama o sabor original.',
    image: acaiNatCardImg,
    basePrice: 16.0,
    sizes: SIZES_ACAI_COPO,
    maxFreeComplements: 3,
    active: true,
    order: 7,
  },
];

export const PRODUCTS = INITIAL_PRODUCTS;
export const STANDARD_COMPLEMENTS = INITIAL_ACOMPANHAMENTOS;
