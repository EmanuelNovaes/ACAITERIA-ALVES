import { supabase, isSupabaseConfigured } from './supabase';

import {
  Product,
  Complement,
  Cobertura,
  Category,
} from '../types/menu';

import {
  INITIAL_ACOMPANHAMENTOS,
  INITIAL_COBERTURAS,
} from '../data/menuConfig';

const STORAGE_PRODUCTS_KEY =
  'acaiteria_alves_db_products_v3';

const STORAGE_CATEGORIAS_KEY =
  'acaiteria_alves_db_categorias_v1';

const STORAGE_ACOMPANHAMENTOS_KEY =
  'acaiteria_alves_db_acompanhamentos_v3';

const STORAGE_COBERTURAS_KEY =
  'acaiteria_alves_db_coberturas_v3';

// IDs pertencentes ao catálogo de demonstração antigo. A migração remove
// somente esses registros do cache, preservando produtos legítimos locais.
const LEGACY_SAMPLE_PRODUCT_IDS = new Set([
  'acai-copo',
  'acai-marmita',
  'acai-leitinho',
  'acai-avela',
  'acai-zero',
  'acai-banana',
  'acai-natural',
]);

type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToDatabase = (
  listener: Listener
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignora erro de listener
    }
  });
};

export const getCachedProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!saved) return [];

    const cachedProducts = JSON.parse(saved) as Product[];
    if (!Array.isArray(cachedProducts)) return [];

    const currentProducts = cachedProducts.filter(
      (product) => !LEGACY_SAMPLE_PRODUCT_IDS.has(product.id)
    );
    if (currentProducts.length !== cachedProducts.length) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(currentProducts));
    }
    return currentProducts;
  } catch {
    return [];
  }
};

export const getCachedCategorias = (): Category[] => {
  try {
    const saved = localStorage.getItem(STORAGE_CATEGORIAS_KEY);
    const categories: Category[] = saved ? JSON.parse(saved) : [];
    return categories.filter((category) => category.active !== false);
  } catch {
    return [];
  }
};

export const getCachedAcompanhamentos = (): Complement[] => {
  try {
    const saved = localStorage.getItem(STORAGE_ACOMPANHAMENTOS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ACOMPANHAMENTOS;
  } catch {
    return INITIAL_ACOMPANHAMENTOS;
  }
};

export const getCachedCoberturas = (): Cobertura[] => {
  try {
    const saved = localStorage.getItem(STORAGE_COBERTURAS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_COBERTURAS;
  } catch {
    return INITIAL_COBERTURAS;
  }
};

// =============================================================
// CATEGORIAS
// =============================================================

export const getCategorias = async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, ativo, ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) throw error;

    const categories = (data || []).map((item: any) => ({
      id: item.id,
      name: item.nome,
      active: item.ativo !== false,
      order: item.ordem ?? 0,
    }));
    try {
      localStorage.setItem(STORAGE_CATEGORIAS_KEY, JSON.stringify(categories));
    } catch {
      // Cache is optional.
    }
    return categories;
  } catch (error) {
    console.error('Erro ao carregar categorias do Supabase:', error);
    throw error;
  }
};

export const saveCategoria = async (
  item: Category
): Promise<Category> => {
  const list = await getCategorias();

  const newItem: Category = {
    ...item,
    id:
      item.id ||
      `categoria_${Date.now()}`,
    active: item.active !== false,
    order:
      item.order ??
      list.length + 1,
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('categorias')
        .upsert({
          id: newItem.id,
          nome: newItem.name,
          ativo: newItem.active !== false,
          ordem: newItem.order ?? 0,
        });

      if (error) {
        console.error(
          'Erro ao salvar categoria no Supabase:',
          error
        );

        throw error;
      }
    } catch (error) {
      console.error(
        'Erro ao salvar categoria no Supabase:',
        error
      );
    }
  }

  const updatedList = list.some(
    (category) =>
      category.id === newItem.id
  )
    ? list.map((category) =>
      category.id === newItem.id
        ? newItem
        : category
    )
    : [...list, newItem];

  try {
    localStorage.setItem(
      STORAGE_CATEGORIAS_KEY,
      JSON.stringify(updatedList)
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();

  return newItem;
};

export const deleteCategoria = async (
  id: string
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(
          'Erro ao excluir categoria do Supabase:',
          error
        );

        return false;
      }
    } catch (error) {
      console.error(
        'Erro ao excluir categoria:',
        error
      );

      return false;
    }
  }

  const list = getCachedCategorias();

  const updatedList = list.filter(
    (category) =>
      category.id !== id
  );

  try {
    localStorage.setItem(
      STORAGE_CATEGORIAS_KEY,
      JSON.stringify(updatedList)
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();

  return true;
};

export const toggleCategoriaActive = async (
  id: string,
  active: boolean
): Promise<void> => {
  let list = getCachedCategorias();

  list = list.map((category) =>
    category.id === id
      ? {
        ...category,
        active,
      }
      : category
  );

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('categorias')
        .update({
          ativo: active,
        })
        .eq('id', id);

      if (error) {
        console.error(
          'Erro ao atualizar categoria:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Erro ao atualizar categoria:',
        error
      );
    }
  }

  try {
    localStorage.setItem(
      STORAGE_CATEGORIAS_KEY,
      JSON.stringify(list)
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();
};

// =============================================================
// PRODUTOS
// =============================================================

export const getProducts = async (): Promise<Product[]> => {
  // Limpa entradas de demonstração antigas antes de qualquer consulta.
  getCachedProducts();
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
          id,
          nome,
          categoria,
          descricao,
          imagem_url,
          preco_base,
          unidades,
          tipo,
          ativo,
          ordem,
          produto_tamanhos (
            id,
            nome,
            volume,
            preco,
            limite_acompanhamentos,
            ativo
          )
      `)
      .order('ordem', { ascending: true });

    if (error) throw error;

    const products = (data || []).map((item: any) => ({
      id: item.id,
      name: item.nome,
      categoryId: item.categoria,
      description: item.descricao,
      image: item.imagem_url,
      basePrice: Number(item.preco_base),
      units: item.unidades == null ? undefined : Number(item.unidades),
      tipo: item.tipo || undefined,
      active: item.ativo,
      order: item.ordem,
      sizes: (item.produto_tamanhos || []).map((size: any) => ({
        id: size.id,
        label: size.nome,
        volume: size.volume || size.nome,
        price: Number(size.preco),
        maxComplements: Number(size.limite_acompanhamentos ?? 0),
        active: size.ativo !== false,
      })),
    }));
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // Cache is optional.
    }
    return products;
  } catch (error) {
    console.error('Erro ao carregar produtos do Supabase:', error);
    throw error;
  }
};

export const saveProduct = async (
  product: Product
): Promise<Product> => {
  let currentProducts = getCachedProducts();

  const exists = currentProducts.some(
    (item) =>
      item.id === product.id
  );

  const updatedProduct: Product = {
    ...product,
    id:
      product.id ||
      `prod_${Date.now()}`,
  };

  // Atualiza cache e notificadores antes de iniciar qualquer operação remota.
  currentProducts = exists
    ? currentProducts.map((item) => item.id === updatedProduct.id ? updatedProduct : item)
    : [...currentProducts, updatedProduct];
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(currentProducts));
  } catch {
    // Cache is optional.
  }
  notifyListeners();

  if (isSupabaseConfigured()) {
    try {
      const {
        error: productError,
      } = await supabase
        .from('produtos')
        .upsert({
          id: updatedProduct.id,
          nome: updatedProduct.name,
          categoria:
            updatedProduct.categoryId,
          descricao:
            updatedProduct.description,
          imagem_url:
            updatedProduct.image,
          preco_base:
            updatedProduct.basePrice,
          unidades: updatedProduct.units ?? null,
          tipo: updatedProduct.tipo || null,
          ativo:
            updatedProduct.active !==
            false,
          ordem:
            updatedProduct.order ||
            0,
        });

      if (productError) {
        throw productError;
      }

      // Remove tamanhos antigos (ex.: tamanho excluído no painel ou
      // produto que virou preço fixo) antes de gravar os atuais.
      const {
        error: cleanSizesError,
      } = await supabase
        .from('produto_tamanhos')
        .delete()
        .eq(
          'produto_id',
          updatedProduct.id
        );

      if (cleanSizesError) {
        throw cleanSizesError;
      }

      if (
        updatedProduct.sizes &&
        updatedProduct.sizes.length > 0
      ) {
        const sizesToInsert =
          updatedProduct.sizes.map(
            (size) => ({
              id: size.id.includes(
                'size_'
              )
                ? size.id
                : `size_${updatedProduct.id}_${size.label}`,
              produto_id:
                updatedProduct.id,
              nome: size.label,
              volume:
                size.volume ||
                size.label,
              preco: size.price,
              limite_acompanhamentos:
                size.maxComplements ??
                0,
              ativo:
                size.active !== false,
            })
          );

        const {
          error: sizeError,
        } = await supabase
          .from('produto_tamanhos')
          .upsert(
            sizesToInsert
          );

        if (sizeError) {
          throw sizeError;
        }
      }
    } catch (error) {
      console.error(
        'Erro ao salvar produto no Supabase:',
        error
      );
      throw error;
    }
  }

  return updatedProduct;
};

export const restoreCachedProduct = (productId: string, previous?: Product) => {
  const products = getCachedProducts().filter((item) => item.id !== productId);
  if (previous) products.push(previous);
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    // Cache is optional.
  }
  notifyListeners();
};

export const deleteProduct = async (
  productId: string
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const {
        error: sizeError,
      } = await supabase
        .from('produto_tamanhos')
        .delete()
        .eq(
          'produto_id',
          productId
        );

      if (sizeError) {
        console.error(
          'Erro ao excluir tamanhos:',
          sizeError
        );
      }

      const {
        error: productError,
      } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);

      if (productError) {
        console.error(
          'Erro ao excluir produto:',
          productError
        );

        return false;
      }
    } catch (error) {
      console.error(
        'Erro ao excluir produto:',
        error
      );

      return false;
    }
  }

  let currentProducts =
    await getProducts();

  currentProducts =
    currentProducts.filter(
      (product) =>
        product.id !== productId
    );

  try {
    localStorage.setItem(
      STORAGE_PRODUCTS_KEY,
      JSON.stringify(
        currentProducts
      )
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();

  return true;
};

export const toggleProductActive = async (
  productId: string,
  active: boolean
): Promise<void> => {
  let currentProducts =
    await getProducts();

  currentProducts =
    currentProducts.map(
      (product) =>
        product.id === productId
          ? {
            ...product,
            active,
          }
          : product
    );

  if (isSupabaseConfigured()) {
    try {
      const { error } =
        await supabase
          .from('produtos')
          .update({
            ativo: active,
          })
          .eq(
            'id',
            productId
          );

      if (error) {
        console.error(
          'Erro ao atualizar produto:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Erro ao atualizar produto:',
        error
      );
    }
  }

  try {
    localStorage.setItem(
      STORAGE_PRODUCTS_KEY,
      JSON.stringify(
        currentProducts
      )
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();
};

// =============================================================
// ACOMPANHAMENTOS
// =============================================================

export const getAcompanhamentos =
  async (): Promise<Complement[]> => {
    if (isSupabaseConfigured()) {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('acompanhamentos')
          .select('*')
          .order('ordem', {
            ascending: true,
          });

        if (!error && data) {
          return data.map(
            (item: any) => ({
              id: item.id,
              name: item.nome,
              active: item.ativo,
              order: item.ordem,
              category:
                'acompanhamento',
            })
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar acompanhamentos:',
          error
        );
      }
    }

    try {
      const saved =
        localStorage.getItem(
          STORAGE_ACOMPANHAMENTOS_KEY
        );

      if (saved) {
        return JSON.parse(
          saved
        );
      }
    } catch {
      // Ignora erro
    }

    try {
      localStorage.setItem(
        STORAGE_ACOMPANHAMENTOS_KEY,
        JSON.stringify(
          INITIAL_ACOMPANHAMENTOS
        )
      );
    } catch {
      // Ignora erro
    }

    return INITIAL_ACOMPANHAMENTOS;
  };

export const saveAcompanhamento =
  async (
    item: Complement
  ): Promise<void> => {
    let list =
      await getAcompanhamentos();

    const exists = list.some(
      (acompanhamento) =>
        acompanhamento.id ===
        item.id
    );

    const newItem: Complement = {
      ...item,
      id:
        item.id ||
        `acomp_${Date.now()}`,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } =
          await supabase
            .from('acompanhamentos')
            .upsert({
              id: newItem.id,
              nome: newItem.name,
              ativo:
                newItem.active !==
                false,
              ordem:
                newItem.order ||
                list.length + 1,
            });

        if (error) {
          console.error(
            'Erro ao salvar acompanhamento:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Erro ao salvar acompanhamento:',
          error
        );
      }
    }

    if (exists) {
      list = list.map(
        (item) =>
          item.id === newItem.id
            ? newItem
            : item
      );
    } else {
      list = [
        ...list,
        newItem,
      ];
    }

    try {
      localStorage.setItem(
        STORAGE_ACOMPANHAMENTOS_KEY,
        JSON.stringify(list)
      );
    } catch {
      // Ignora erro
    }

    notifyListeners();
  };

export const deleteAcompanhamento =
  async (
    id: string
  ): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } =
          await supabase
            .from('acompanhamentos')
            .delete()
            .eq('id', id);

        if (error) {
          console.error(
            'Erro ao excluir acompanhamento:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Erro ao excluir acompanhamento:',
          error
        );
      }
    }

    let list =
      await getAcompanhamentos();

    list = list.filter(
      (item) =>
        item.id !== id
    );

    try {
      localStorage.setItem(
        STORAGE_ACOMPANHAMENTOS_KEY,
        JSON.stringify(list)
      );
    } catch {
      // Ignora erro
    }

    notifyListeners();
  };

export const toggleAcompanhamentoActive =
  async (
    id: string,
    active: boolean
  ): Promise<void> => {
    let list =
      await getAcompanhamentos();

    list = list.map(
      (item) =>
        item.id === id
          ? {
            ...item,
            active,
          }
          : item
    );

    if (isSupabaseConfigured()) {
      try {
        const { error } =
          await supabase
            .from('acompanhamentos')
            .update({
              ativo: active,
            })
            .eq('id', id);

        if (error) {
          console.error(
            'Erro ao atualizar acompanhamento:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Erro ao atualizar acompanhamento:',
          error
        );
      }
    }

    try {
      localStorage.setItem(
        STORAGE_ACOMPANHAMENTOS_KEY,
        JSON.stringify(list)
      );
    } catch {
      // Ignora erro
    }

    notifyListeners();
  };

// =============================================================
// COBERTURAS
// =============================================================

export const getCoberturas =
  async (): Promise<Cobertura[]> => {
    if (isSupabaseConfigured()) {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('coberturas')
          .select('*')
          .order('ordem', {
            ascending: true,
          });

        if (!error && data) {
          return data.map(
            (item: any) => ({
              id: item.id,
              name: item.nome,
              active: item.ativo,
              order: item.ordem,
            })
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar coberturas:',
          error
        );
      }
    }

    try {
      const saved =
        localStorage.getItem(
          STORAGE_COBERTURAS_KEY
        );

      if (saved) {
        return JSON.parse(
          saved
        );
      }
    } catch {
      // Ignora erro
    }

    try {
      localStorage.setItem(
        STORAGE_COBERTURAS_KEY,
        JSON.stringify(
          INITIAL_COBERTURAS
        )
      );
    } catch {
      // Ignora erro
    }

    return INITIAL_COBERTURAS;
  };

export const saveCobertura = async (
  item: Cobertura
): Promise<void> => {
  let list =
    await getCoberturas();

  const exists = list.some(
    (cobertura) =>
      cobertura.id === item.id
  );

  const newItem: Cobertura = {
    ...item,
    id:
      item.id ||
      `cob_${Date.now()}`,
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } =
        await supabase
          .from('coberturas')
          .upsert({
            id: newItem.id,
            nome: newItem.name,
            ativo:
              newItem.active !==
              false,
            ordem:
              newItem.order ||
              list.length + 1,
          });

      if (error) {
        console.error(
          'Erro ao salvar cobertura:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Erro ao salvar cobertura:',
        error
      );
    }
  }

  if (exists) {
    list = list.map(
      (item) =>
        item.id === newItem.id
          ? newItem
          : item
    );
  } else {
    list = [
      ...list,
      newItem,
    ];
  }

  try {
    localStorage.setItem(
      STORAGE_COBERTURAS_KEY,
      JSON.stringify(list)
    );
  } catch {
    // Ignora erro
  }

  notifyListeners();
};

export const deleteCobertura =
  async (
    id: string
  ): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } =
          await supabase
            .from('coberturas')
            .delete()
            .eq('id', id);

        if (error) {
          console.error(
            'Erro ao excluir cobertura:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Erro ao excluir cobertura:',
          error
        );
      }
    }

    let list =
      await getCoberturas();

    list = list.filter(
      (item) =>
        item.id !== id
    );

    try {
      localStorage.setItem(
        STORAGE_COBERTURAS_KEY,
        JSON.stringify(list)
      );
    } catch {
      // Ignora erro
    }

    notifyListeners();
  };

export const toggleCoberturaActive =
  async (
    id: string,
    active: boolean
  ): Promise<void> => {
    let list =
      await getCoberturas();

    list = list.map(
      (item) =>
        item.id === id
          ? {
            ...item,
            active,
          }
          : item
    );

    if (isSupabaseConfigured()) {
      try {
        const { error } =
          await supabase
            .from('coberturas')
            .update({
              ativo: active,
            })
            .eq('id', id);

        if (error) {
          console.error(
            'Erro ao atualizar cobertura:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Erro ao atualizar cobertura:',
          error
        );
      }
    }

    try {
      localStorage.setItem(
        STORAGE_COBERTURAS_KEY,
        JSON.stringify(list)
      );
    } catch {
      // Ignora erro
    }

    notifyListeners();
  };

// =============================================================
// UPLOAD DE IMAGEM
// =============================================================

export const uploadProductImage = async (
  file: File
): Promise<string> => {
  if (isSupabaseConfigured()) {
    try {
      const fileExt =
        file.name.split('.').pop();

      const fileName =
        `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;

      const filePath =
        `produtos/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from('produtos')
        .upload(
          filePath,
          file
        );

      if (!uploadError) {
        const { data } =
          supabase.storage
            .from('produtos')
            .getPublicUrl(
              filePath
            );

        return data.publicUrl;
      }
    } catch (error) {
      console.error(
        'Erro no upload da imagem:',
        error
      );
    }
  }

  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        resolve(
          reader.result as string
        );
      };

      reader.onerror = (
        error
      ) => {
        reject(error);
      };

      reader.readAsDataURL(file);
    }
  );
};
