import { supabase, isSupabaseConfigured } from './supabase';

import {
  Product,
  Complement,
  Cobertura,
  Category,
} from '../types/menu';


type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToDatabase = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach((listener) => { try { listener(); } catch { /* ignore listener errors */ } });
};

// Kept as empty compatibility helpers; menu/catalog data is fetched from Supabase only.
export const getCachedProducts = (): Product[] => [];
export const getCachedCategorias = (): Category[] => [];
export const getCachedAcompanhamentos = (): Complement[] => [];
export const getCachedCoberturas = (): Cobertura[] => [];

// Remove legacy menu caches left by previous versions; future reads always come from Supabase.
try {
  ['acaiteria_alves_db_products_v3','acaiteria_alves_db_categorias_v1','acaiteria_alves_db_acompanhamentos_v3','acaiteria_alves_db_coberturas_v3']
    .forEach((key) => localStorage.removeItem(key));
} catch { /* Storage may be unavailable in private browsing. */ }

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

  notifyListeners();

  return true;
};

export const toggleCategoriaActive = async (
  id: string,
  active: boolean
): Promise<void> => {
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
    return products;
  } catch (error) {
    console.error('Erro ao carregar produtos do Supabase:', error);
    throw error;
  }
};

export const saveProduct = async (
  product: Product
): Promise<Product> => {
  const updatedProduct: Product = {
    ...product,
    id:
      product.id ||
      `prod_${Date.now()}`,
  };

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

  notifyListeners();
  return updatedProduct;
};

export const restoreCachedProduct = (productId: string, previous?: Product) => {
  void productId;
  void previous;
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

  notifyListeners();

  return true;
};

export const toggleProductActive = async (
  productId: string,
  active: boolean
): Promise<void> => {
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
    const list = await getAcompanhamentos();

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

    notifyListeners();
  };

export const toggleAcompanhamentoActive =
  async (
    id: string,
    active: boolean
  ): Promise<void> => {
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
  const list = await getCoberturas();

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

    notifyListeners();
  };

export const toggleCoberturaActive =
  async (
    id: string,
    active: boolean
  ): Promise<void> => {
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
