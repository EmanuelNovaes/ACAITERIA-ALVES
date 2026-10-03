import { supabase, isSupabaseConfigured } from './supabase';

import {
  Product,
  Complement,
  Cobertura,
  Category,
  ProductSize,
} from '../types/menu';
import { diagnosticNow, reportPerformance } from '../utils/performanceDiagnostics';

type Listener = () => void;

const listeners = new Set<Listener>();
let productRequestSequence = 0;
let categoryRequestSequence = 0;
let sizesRequestSequence = 0;

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
      // Ignora erro de listener.
    }
  });
};

// =============================================================
// CACHE DE PRODUTOS
// =============================================================

// Legacy names kept for callers in the admin panel. Menu data is never
// sourced from browser storage or bundled sample data.
export const getCachedProducts = (): Product[] => [];
export const getCachedCategorias = (): Category[] => [];
export const getCachedAcompanhamentos = (): Complement[] => [];
export const getCachedCoberturas = (): Cobertura[] => [];

// =============================================================
// CATEGORIAS
// =============================================================

export const getCategorias = async (): Promise<Category[]> => {
  const requestId = ++categoryRequestSequence;
  const requestStartedAt = diagnosticNow();
  reportPerformance('Categorias: início', { requestId, selectColumns: 4, filters: ['ativo=true'], order: 'ordem ASC' });
  if (!isSupabaseConfigured()) {
    reportPerformance('Categorias: Supabase não configurado', { requestId }, diagnosticNow() - requestStartedAt);
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, ativo, ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    const queryFinishedAt = diagnosticNow();
    reportPerformance('Categorias: consulta concluída', { requestId, rows: data?.length ?? 0 }, queryFinishedAt - requestStartedAt);
    if (error) throw error;

    const processingStartedAt = diagnosticNow();
    const categories = (data || []).map(
      (item: any) => ({
        id: item.id,
        name: item.nome,
        active: item.ativo !== false,
        order: item.ordem ?? 0,
      })
    );
    reportPerformance('Categorias: processamento concluído', { requestId, rows: categories.length }, diagnosticNow() - processingStartedAt);

    return categories;
  } catch (error) {
    reportPerformance('Categorias: falha', { requestId, error: String(error) }, diagnosticNow() - requestStartedAt);
    console.error(
      'Erro ao carregar categorias do Supabase:',
      error
    );

    return [];
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



  notifyListeners();
};

// =============================================================
// PRODUTOS
// =============================================================

export const getProducts = async (): Promise<Product[]> => {
  const requestId = ++productRequestSequence;
  const requestStartedAt = diagnosticNow();
  reportPerformance('Produtos: início', {
    requestId,
    selectColumns: 10,
    select: 'id,nome,categoria,descricao,imagem_url,preco_base,unidades,tipo,ativo,ordem',
    order: 'ordem ASC',
    filters: [],
  });
  if (!isSupabaseConfigured()) {
    reportPerformance('Produtos: Supabase não configurado', { requestId }, diagnosticNow() - requestStartedAt);
    return [];
  }

  try {
    const queryStartedAt = diagnosticNow();
    const { data, error } = await supabase.from('produtos').select(`
        id,
        nome,
        categoria,
        descricao,
        imagem_url,
        preco_base,
        unidades,
        tipo,
        ativo,
        ordem
      `).order('ordem', { ascending: true });

    const queryFinishedAt = diagnosticNow();
    reportPerformance('Produtos: consulta concluída', { requestId, rows: data?.length ?? 0 }, queryFinishedAt - queryStartedAt);
    if (error) throw error;

    const processingStartedAt = diagnosticNow();
    const products = (data || []).map((item: any) => ({
      id: item.id,
      name: item.nome,
      categoryId: item.categoria,
      description: item.descricao,
      image: item.imagem_url,
      basePrice: item.preco_base == null ? 0 : Number(item.preco_base),
      units: item.unidades == null ? undefined : Number(item.unidades),
      tipo: item.tipo || undefined,
      active: item.ativo !== false,
      order: item.ordem ?? 0,
      sizes: [],
    }));
    reportPerformance('Produtos: processamento concluído', { requestId, rows: products.length }, diagnosticNow() - processingStartedAt);
    return products;
  } catch (error) {
    reportPerformance('Produtos: falha', { requestId, error: String(error) }, diagnosticNow() - requestStartedAt);
    console.error(
      'Erro ao carregar produtos do Supabase:',
      error
    );

    return [];
  }
};

export type LoadedProductSize = ProductSize & { productId: string };

export const getProductSizes = async (productIds?: string[]): Promise<LoadedProductSize[]> => {
  const requestId = ++sizesRequestSequence;
  const requestStartedAt = diagnosticNow();
  reportPerformance('Tamanhos: início', { requestId, scope: productIds ? 'produto(s) específico(s)' : 'tabela completa', productCount: productIds?.length });
  if (!isSupabaseConfigured() || productIds?.length === 0) {
    reportPerformance('Tamanhos: consulta ignorada', { requestId, reason: !isSupabaseConfigured() ? 'Supabase não configurado' : 'lista de produtos vazia' }, diagnosticNow() - requestStartedAt);
    return [];
  }

  try {
    let query = supabase.from('produto_tamanhos').select(`
      id,
      produto_id,
      nome,
      volume,
      preco,
      limite_acompanhamentos,
      ativo
    `);
    if (productIds) query = query.in('produto_id', productIds);

    const queryStartedAt = diagnosticNow();
    const { data, error } = await query;
    const queryFinishedAt = diagnosticNow();
    reportPerformance('Tamanhos: consulta concluída', { requestId, rows: data?.length ?? 0 }, queryFinishedAt - queryStartedAt);
    if (error) throw error;

    const processingStartedAt = diagnosticNow();
    const sizes = (data || []).map((size: any) => ({
      id: size.id,
      productId: size.produto_id,
      label: size.nome,
      volume: size.volume || size.nome,
      price: Number(size.preco),
      maxComplements: Number(size.limite_acompanhamentos ?? 0),
      active: size.ativo !== false,
    }));
    reportPerformance('Tamanhos: processamento concluído', { requestId, rows: sizes.length }, diagnosticNow() - processingStartedAt);
    return sizes;
  } catch (error) {
    reportPerformance('Tamanhos: falha', { requestId, error: String(error) }, diagnosticNow() - requestStartedAt);
    console.error('Erro ao carregar tamanhos dos produtos:', error);
    return [];
  }
};

export const attachProductSizes = (
  products: Product[],
  sizes: LoadedProductSize[],
  preserveExistingWhenMissing = false
): Product[] => {
  const sizesByProduct = new Map<string, ProductSize[]>();
  for (const size of sizes) {
    const productId = size.productId;
    const productSizes = sizesByProduct.get(productId);
    const { productId: _productId, ...productSize } = size;
    if (productSizes) productSizes.push(productSize);
    else sizesByProduct.set(productId, [productSize]);
  }
  return products.map((product) => {
    const productSizes = sizesByProduct.get(product.id);
    if (!productSizes && preserveExistingWhenMissing) return product;
    return { ...product, sizes: productSizes || [] };
  });
};

export const saveProduct = async (
  product: Product
): Promise<Product> => {
  let currentProducts =
    getCachedProducts();

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

  // Atualiza o cache e os notificadores
  // antes da operação remota.
  currentProducts = exists
    ? currentProducts.map(
      (item) =>
        item.id === updatedProduct.id
          ? updatedProduct
          : item
    )
    : [
      ...currentProducts,
      updatedProduct,
    ];



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
          unidades:
            updatedProduct.units ?? null,
          tipo:
            updatedProduct.tipo || null,
          ativo:
            updatedProduct.active !== false,
          ordem:
            updatedProduct.order || 0,
        });

      if (productError) {
        throw productError;
      }

      // Remove tamanhos antigos antes de gravar
      // os tamanhos atuais.
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

export const restoreCachedProduct = (
  productId: string,
  previous?: Product
) => {
  const products =
    getCachedProducts().filter(
      (item) =>
        item.id !== productId
    );

  if (previous) {
    products.push(previous);
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

    return [];
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

    return [];
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
