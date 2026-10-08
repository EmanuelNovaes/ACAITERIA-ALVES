export type CategoryId =
  | 'acai'
  | 'sorvetes'
  | 'salgados'
  | 'milkshakes'
  | 'bebidas'
  | string;

export interface Category {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface ProductSize {
  id: string;
  label: string;
  volume?: string;
  price: number;
  maxComplements?: number;
  isDefault?: boolean;
  active?: boolean;
}

export interface Complement {
  id: string;
  name: string;
  category?:
  | 'frutas'
  | 'recheios'
  | 'crocantes'
  | 'coberturas'
  | 'acompanhamento';
  extraPrice?: number;
  active?: boolean;
  order?: number;
}

export interface Cobertura {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface OpcaoAcai {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
  description: string;
  image: string;
  basePrice: number;
  sizes?: ProductSize[];
  maxFreeComplements?: number;
  allowedComplements?: Complement[];
  badge?: string;
  isCombo?: boolean;
  units?: number;
  tipo?: string | null;
  comboItems?: string[];
  active?: boolean;
  order?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  isCombo?: boolean;
  units?: number;
  comboCategoryName?: string;
  image: string;
  selectedSize?: ProductSize;
  tipo?: string;
  selectedComplements: Complement[];
  cobertura?: string;
  coberturas?: Array<{ id: string; name: string }>;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
}

export type DeliveryType = 'entrega' | 'retirada';

export interface CustomerOrderInfo {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  address: string;
  neighborhood: string;
  referencePoint: string;
  paymentMethod: string;
  notes: string;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  phoneFormatted: string;
  instagram: string;
  address: string;
  openingHours: string;
  isOpen: boolean;
  currencySymbol: string;
  allowDelivery: boolean;
  allowPickup: boolean;
  deliveryFee: number;
  deliveryEstimateMinutes: string;
  pickupEstimateMinutes: string;
}
