import { Category, Product } from '../tipos/Cardapio';

/**
 * Regras de cadastro/exibição por categoria.
 *
 * | Categoria   | Tamanhos | Preço       | Cliente vê   | Observação | Acompanhamentos |
 * | ----------- | -------- | ----------- | ------------ | ---------- | --------------- |
 * | Açaí        | Sim      | Por tamanho | A partir de  | Sim        | Sim             |
 * | Sorvetes    | Sim      | Por tamanho | A partir de  | Não        | Não             |
 * | Milk Shakes | Sim      | Por tamanho | A partir de  | Não        | Não             |
 * | Bebidas     | Não      | Fixo        | Valor        | Não        | Não             |
 * | Salgados    | Não      | Fixo        | Valor        | Não        | Não             |
 * | Churros     | Não      | Fixo        | Valor        | Não        | Não             |
 *
 * A categoria é reconhecida pelo id OU pelo nome (sem acento / maiúsculas),
 * para funcionar também com categorias criadas pelo painel
 * (ex.: id "categoria_123" com nome "Churros").
 *
 * Ordenação na tela "Todos":
 * 1º Ordem da categoria
 * 2º Agrupar produtos da mesma categoria
 * 3º Dentro da categoria, menor preço → maior preço
 */

const normalize = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const FIXED_PRICE_KEYWORDS = ['bebida', 'salgado', 'churro'];
const COMBO_KEYWORDS = ['combo'];

export const AcaiProductTypes = [
  { value: 'acai_copo', label: 'AÇAÍ NO COPO' },
  { value: 'acai_marmita', label: 'AÇAÍ NA MARMITA' },
] as const;

export const ComboProductTypes = [
  { value: 'combo_salgados', label: 'COMBO DE SALGADOS' },
  { value: 'combo_churros', label: 'COMBO DE CHURROS' },
] as const;

export const getProductTypes = (categoryId?: string, categories?: Category[]) => {
  const flags = getCategoryFlags(categoryId, categories);
  return flags.isAcai ? AcaiProductTypes : flags.isCombo ? ComboProductTypes : [];
};

/** Texto usado na mensagem do pedido: "Açaí no Copo" / "Açaí na Marmita". */
export const getAcaiTypeMessageLabel = (type?: string | null): string | undefined => {
  if (type === 'acai_copo') return 'Açaí no Copo';
  if (type === 'acai_marmita') return 'Açaí na Marmita';
  return undefined;
};

export const getProductTypeLabel = (type?: string | null) => {
  if (!type) return undefined;

  const normalizedType = normalize(type).replace(/\s+/g, '_');
  const knownType = [...AcaiProductTypes, ...ComboProductTypes].find(
    (item) => normalizedType === item.value || normalize(item.label) === normalize(type)
  );
  if (knownType) return knownType.label;

  // Mantém os tipos futuros de combo legíveis sem expor seu identificador interno.
  if (normalizedType.startsWith('combo_')) {
    const comboName = normalizedType.slice('combo_'.length).replace(/_/g, ' ').toLocaleUpperCase('pt-BR');
    return comboName.startsWith('DE ') ? `COMBO ${comboName}` : `COMBO DE ${comboName}`;
  }

  return undefined;
};

export const findCategory = (
  categoryId: string | undefined,
  categories?: Category[]
): Category | undefined =>
  categories?.find((category) => category.id === categoryId);

/** Bebidas, Salgados e Churros: um único preço, sem tamanhos. */
export const isFixedPriceCategory = (
  categoryId: string | undefined,
  categoryName?: string
): boolean => {
  const text = `${normalize(categoryId)} ${normalize(categoryName)}`;
  return FIXED_PRICE_KEYWORDS.some((keyword) => text.includes(keyword)) ||
    COMBO_KEYWORDS.some((keyword) => text.includes(keyword));
};

export const isComboCategory = (categoryId?: string, categoryName?: string) => {
  const text = `${normalize(categoryId)} ${normalize(categoryName)}`;
  return COMBO_KEYWORDS.some((keyword) => text.includes(keyword));
};

/** Somente Açaí possui observação e acompanhamentos. */
export const isAcaiCategory = (
  categoryId: string | undefined,
  categoryName?: string
): boolean =>
  normalize(categoryId) === 'acai' || normalize(categoryName) === 'acai';

/** Conveniência: resolve o nome da categoria a partir da lista. */
export const getCategoryFlags = (
  categoryId: string | undefined,
  categories?: Category[]
) => {
  const name = findCategory(categoryId, categories)?.name;
  const fixedPrice = isFixedPriceCategory(categoryId, name);
  return {
    isFixedPrice: fixedPrice,
    usesSizes: !fixedPrice,
    isAcai: isAcaiCategory(categoryId, name),
    isCombo: isComboCategory(categoryId, name),
    categoryName: name,
  };
};

/**
 * Menor preço do produto para ordenação.
 * Com tamanhos: usa o menor preço entre os tamanhos ativos.
 * Sem tamanhos / preço fixo: usa basePrice.
 */
export const getProductMinPrice = (product: Product): number => {
  const activeSizes = (product.sizes || []).filter((size) => size.active !== false);
  if (activeSizes.length > 0) {
    return Math.min(...activeSizes.map((size) => Number(size.price) || 0));
  }
  return Number(product.basePrice) || 0;
};

/**
 * Ordena produtos para o cardápio do cliente:
 * ordem da categoria → preço crescente dentro da categoria.
 * Novos produtos entram automaticamente no grupo e posição corretos.
 */
export const sortProductsForMenu = (
  products: Product[],
  categories: Category[]
): Product[] => {
  const categoryOrder = new Map(
    categories.map((category, index) => [
      category.id,
      category.order ?? index,
    ])
  );

  return [...products].sort((a, b) => {
    const orderA = categoryOrder.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER;
    const orderB = categoryOrder.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const priceDiff = getProductMinPrice(a) - getProductMinPrice(b);
    if (priceDiff !== 0) {
      return priceDiff;
    }

    // Empate de preço: mantém estabilidade pelo nome
    return a.name.localeCompare(b.name, 'pt-BR');
  });
};
