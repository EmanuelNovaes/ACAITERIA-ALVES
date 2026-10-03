import React, {
  useEffect,
  useState,
  useRef,
} from 'react';

import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowLeft,
  LogOut,
  Upload,
  Image as ImageIcon,
  ShoppingBag,
  Layers,
  List,
  IceCream,
  Power,
} from 'lucide-react';

import { getCategoryFlags, getProductTypes } from '../utils/categoryRules';

import {
  Product,
  ProductSize,
  Complement,
  Cobertura,
  Category,
} from '../types/menu';

import {
  getProducts,
  getProductSizes,
  attachProductSizes,
  saveProduct,
  deleteProduct,
  toggleProductActive,

  getCategorias,
  saveCategoria,
  deleteCategoria,
  toggleCategoriaActive,

  getAcompanhamentos,
  saveAcompanhamento,
  deleteAcompanhamento,
  toggleAcompanhamentoActive,

  getCoberturas,
  saveCobertura,
  deleteCobertura,
  toggleCoberturaActive,


  uploadProductImage,
  getCachedAcompanhamentos,
  getCachedCoberturas,
  restoreCachedProduct,
} from '../services/databaseService';

import { signOut } from '../services/supabase';
import { BrandLogo } from '../components/BrandLogo';

type AdminTab =
  | 'produtos'
  | 'categorias'
  | 'acompanhamentos'
  | 'coberturas';

const money = (value: number) =>
  Number(value || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  );

const emptyProduct = (
  categoryId: string
): Product => ({
  id: '',
  name: '',
  categoryId,
  description: '',
  image: '',
  basePrice: 0,
  sizes: [],
  active: true,
  order: 0,
});

const emptySize = (): ProductSize => ({
  id: `size_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 7)}`,
  label: '',
  volume: '',
  price: 0,
  maxComplements: undefined,
  active: true,
});

export default function AdminDashboard({
  onLogout,
  onNavigateToCardapio,
}: {
  onLogout: () => void;
  onNavigateToCardapio: () => void;
}) {
  const [activeTab, setActiveTab] =
    useState<AdminTab>('produtos');

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categorias, setCategorias] =
    useState<Category[]>([]);

  const [
    acompanhamentos,
    setAcompanhamentos,
  ] = useState<Complement[]>(getCachedAcompanhamentos);

  const [
    coberturas,
    setCoberturas,
  ] = useState<Cobertura[]>(getCachedCoberturas);


  const [loading, setLoading] =
    useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const savingProductRef = useRef(false);

  const [
    feedbackMessage,
    setFeedbackMessage,
  ] = useState('');

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(null);

  const [
    isNewProduct,
    setIsNewProduct,
  ] = useState(false);

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState('');

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState<string | null>(null);

  const [
    editingCategoryName,
    setEditingCategoryName,
  ] = useState('');

  const [
    newAcompName,
    setNewAcompName,
  ] = useState('');

  const [
    newCoberturaName,
    setNewCoberturaName,
  ] = useState('');


  const showFeedback = (
    message: string
  ) => {
    setFeedbackMessage(message);

    window.setTimeout(() => {
      setFeedbackMessage('');
    }, 3000);
  };

  const loadData = async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      getProducts(), getProductSizes(), getCategorias(), getAcompanhamentos(), getCoberturas(),
    ]);
    const [productsResult, sizesResult, categoriesResult, complementsResult, toppingsResult] = results;
    const currentProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];
    const currentSizes = sizesResult.status === 'fulfilled' ? sizesResult.value : [];
    setProducts(attachProductSizes(currentProducts, currentSizes));
    setCategorias(categoriesResult.status === 'fulfilled' ? categoriesResult.value : []);
    if (complementsResult.status === 'fulfilled') setAcompanhamentos(complementsResult.value);
    if (toppingsResult.status === 'fulfilled') setCoberturas(toppingsResult.value);
    if (results.some((result) => result.status === 'rejected')) {
      showFeedback('Alguns dados não puderam ser carregados. Verifique a conexão e tente novamente.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===========================================================
  // PRODUTOS
  // ===========================================================

  const openNewProduct = (
    presetCategoryId?: string
  ) => {
    if (presetCategoryId) {
      setEditingProduct(
        emptyProduct(presetCategoryId)
      );

      setIsNewProduct(true);
      return;
    }

    const firstCategory =
      categorias.find(
        (category) => category.active
      );

    setEditingProduct(
      emptyProduct(
        firstCategory?.id ||
        categorias[0]?.id ||
        'acai'
      )
    );

    setIsNewProduct(true);
  };

  const openEditProduct = (
    product: Product
  ) => {
    setEditingProduct({
      ...product,
      sizes: product.sizes
        ? product.sizes.map(
          (size) => ({
            ...size,
          })
        )
        : [],
    });

    setIsNewProduct(false);
  };

  const closeProductModal = () => {
    setEditingProduct(null);
    setIsNewProduct(false);
  };

  // Produtos agrupados por categoria (100% dinâmico: toda categoria
  // existente aparece, mesmo sem produtos)
  const sortedCategorias = categorias;

  const sortProducts = (list: Product[]) =>
    [...list].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

  const productGroups: {
    id: string;
    name: string;
    categoryId?: string;
    category?: Category;
    products: Product[];
  }[] = sortedCategorias.flatMap((category) => {
    const categoryProducts = products.filter((product) => product.categoryId === category.id);
    const productTypes = getProductTypes(category.id, categorias);
    if (productTypes.length === 0) {
      return [{ id: category.id, name: category.name, categoryId: category.id, category, products: sortProducts(categoryProducts) }];
    }
    const groups: { id: string; name: string; categoryId: string; category: Category; products: Product[] }[] = productTypes.map((type) => ({
      id: `${category.id}_${type.value}`,
      name: type.label,
      categoryId: category.id,
      category,
      products: sortProducts(categoryProducts.filter((product) => product.tipo === type.value)),
    }));
    const legacyProducts = categoryProducts.filter((product) => !product.tipo || !productTypes.some((type) => type.value === product.tipo));
    if (legacyProducts.length > 0) {
      groups.push({ id: `${category.id}_legacy`, name: category.name, categoryId: category.id, category, products: sortProducts(legacyProducts) });
    }
    return groups;
  });

  const orphanProducts = products.filter(
    (product) =>
      !categorias.some(
        (category) =>
          category.id === product.categoryId
      )
  );

  if (orphanProducts.length > 0) {
    productGroups.push({
      id: '__sem_categoria__',
      name: 'Sem categoria',
      products: sortProducts(orphanProducts),
    });
  }

  // Campos do cadastro mudam conforme a categoria escolhida
  const productFlags = getCategoryFlags(
    editingProduct?.categoryId,
    categorias
  );

  const handleSaveProduct =
    async () => {
      if (!editingProduct || savingProductRef.current) {
        return;
      }

      if (
        !editingProduct.name.trim()
      ) {
        showFeedback(
          'Informe o nome do produto.'
        );
        return;
      }

      if (
        !editingProduct.categoryId
      ) {
        showFeedback(
          'Selecione uma categoria.'
        );
        return;
      }

      let productToSave: Product = {
        ...editingProduct,
      };

      if (getProductTypes(editingProduct.categoryId, categorias).length > 0 && !editingProduct.tipo) {
        showFeedback('Selecione o tipo do produto.');
        return;
      }

      if (productFlags.isFixedPrice) {
        // Bebidas, Salgados e Churros: preço único, sem tamanhos
        if (
          !(editingProduct.basePrice > 0)
        ) {
          showFeedback(
            'Informe o valor do produto.'
          );
          return;
        }

        productToSave.sizes = [];
        if (productFlags.isCombo && !(editingProduct.units && editingProduct.units > 0)) {
          showFeedback('Informe a quantidade de unidades do combo.');
          return;
        }
      } else {
        const sizes =
          editingProduct.sizes || [];

        if (sizes.length === 0) {
          showFeedback(
            'Cadastre pelo menos um tamanho.'
          );
          return;
        }

        for (const size of sizes) {
          if (!size.label.trim()) {
            showFeedback(
              'Informe o nome de todos os tamanhos.'
            );
            return;
          }

          if (!(size.price > 0)) {
            showFeedback(
              'Informe o valor de todos os tamanhos.'
            );
            return;
          }

          if (
            productFlags.isAcai &&
            !size.maxComplements
          ) {
            showFeedback(
              'Informe a quantidade de acompanhamentos de todos os tamanhos.'
            );
            return;
          }
        }

        // O preço "a partir de" é o menor valor entre os tamanhos
        productToSave.basePrice =
          Math.min(
            ...sizes.map(
              (size) => size.price
            )
          );
      }

      const previous = products.find((item) => item.id === productToSave.id);
      if (isNewProduct) {
        productToSave.id = productToSave.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
      savingProductRef.current = true;
      setSavingProduct(true);
      setProducts((current) => current.some((item) => item.id === productToSave.id)
        ? current.map((item) => item.id === productToSave.id ? productToSave : item)
        : [...current, productToSave]);
      closeProductModal();
      showFeedback(isNewProduct ? 'Produto cadastrado. Sincronizando…' : 'Produto atualizado. Sincronizando…');

      void saveProduct(productToSave)
        .then((saved) => {
          setProducts((current) => current.map((item) => item.id === saved.id ? saved : item));
          showFeedback(isNewProduct ? 'Produto cadastrado!' : 'Produto atualizado!');
        })
        .catch((error) => {
          console.error('Erro ao sincronizar produto:', error);
          restoreCachedProduct(productToSave.id, previous);
          setProducts((current) => {
            const withoutOptimistic = current.filter((item) => item.id !== productToSave.id);
            return previous ? [...withoutOptimistic, previous] : withoutOptimistic;
          });
          showFeedback('Não foi possível salvar no Supabase. A alteração foi desfeita. Tente novamente.');
        })
        .finally(() => { savingProductRef.current = false; setSavingProduct(false); });
    };

  const handleDeleteProduct =
    async (product: Product) => {
      const confirmed =
        window.confirm(
          `Excluir "${product.name}"?`
        );

      if (!confirmed) {
        return;
      }

      await deleteProduct(
        product.id
      );

      await loadData();

      showFeedback(
        'Produto excluído.'
      );
    };

  const handleToggleProduct =
    async (product: Product) => {
      await toggleProductActive(
        product.id,
        product.active === false
      );

      await loadData();
    };

  const updateProductField = <
    K extends keyof Product
  >(
    field: K,
    value: Product[K]
  ) => {
    setEditingProduct(
      (current) =>
        current
          ? {
            ...current,
            [field]: value,
          }
          : current
    );
  };

  const updateSize = (
    index: number,
    field: keyof ProductSize,
    value: any
  ) => {
    if (!editingProduct) {
      return;
    }

    const sizes = [
      ...(editingProduct.sizes ||
        []),
    ];

    sizes[index] = {
      ...sizes[index],
      [field]: value,
    };

    setEditingProduct({
      ...editingProduct,
      sizes,
    });
  };

  const addSize = () => {
    if (!editingProduct) {
      return;
    }

    setEditingProduct({
      ...editingProduct,
      sizes: [
        ...(editingProduct.sizes ||
          []),
        emptySize(),
      ],
    });
  };

  const removeSize = (
    index: number
  ) => {
    if (!editingProduct) {
      return;
    }

    const sizes = [
      ...(editingProduct.sizes ||
        []),
    ];

    sizes.splice(index, 1);

    setEditingProduct({
      ...editingProduct,
      sizes,
    });
  };

  const handleProductImage =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file || !editingProduct) {
        return;
      }

      try {
        const imageUrl =
          await uploadProductImage(
            file
          );

        setEditingProduct({
          ...editingProduct,
          image: imageUrl,
        });

        showFeedback(
          'Imagem carregada.'
        );
      } catch (error) {
        console.error(error);

        showFeedback(
          'Erro ao carregar imagem.'
        );
      }
    };

  // ===========================================================
  // CATEGORIAS
  // ===========================================================

  const handleAddCategory =
    async () => {
      const name =
        newCategoryName.trim();

      if (!name) {
        showFeedback(
          'Informe o nome da categoria.'
        );
        return;
      }

      const idBase = name
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          ''
        )
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-|-$/g,
          ''
        );

      let id = idBase || `categoria_${Date.now()}`;

      if (
        categorias.some(
          (category) =>
            category.id === id
        )
      ) {
        id = `${id}_${Date.now()}`;
      }

      await saveCategoria({
        id,
        name,
        active: true,
        order:
          categorias.length + 1,
      });

      setNewCategoryName('');

      await loadData();

      showFeedback(
        'Categoria cadastrada!'
      );
    };

  const startEditCategory = (
    category: Category
  ) => {
    setEditingCategoryId(
      category.id
    );

    setEditingCategoryName(
      category.name
    );
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveCategoryEdit =
    async () => {
      if (
        !editingCategoryId
      ) {
        return;
      }

      const name =
        editingCategoryName.trim();

      if (!name) {
        showFeedback(
          'Informe o nome da categoria.'
        );
        return;
      }

      const category =
        categorias.find(
          (item) =>
            item.id ===
            editingCategoryId
        );

      if (!category) {
        return;
      }

      await saveCategoria({
        ...category,
        name,
      });

      cancelEditCategory();

      await loadData();

      showFeedback(
        'Categoria atualizada!'
      );
    };

  const handleDeleteCategory =
    async (
      category: Category
    ) => {
      const productsUsingCategory =
        products.filter(
          (product) =>
            product.categoryId ===
            category.id
        );

      if (
        productsUsingCategory.length >
        0
      ) {
        showFeedback(
          `Não é possível excluir. Existem ${productsUsingCategory.length} produto(s) nessa categoria.`
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Excluir a categoria "${category.name}"?`
        );

      if (!confirmed) {
        return;
      }

      await deleteCategoria(
        category.id
      );

      await loadData();

      showFeedback(
        'Categoria excluída.'
      );
    };

  const handleToggleCategory =
    async (
      category: Category
    ) => {
      await toggleCategoriaActive(
        category.id,
        category.active === false
      );

      await loadData();
    };

  // ===========================================================
  // ACOMPANHAMENTOS
  // ===========================================================

  const handleAddAcompanhamento =
    async () => {
      const name =
        newAcompName.trim();

      if (!name) {
        showFeedback(
          'Informe o acompanhamento.'
        );
        return;
      }

      await saveAcompanhamento({
        id: '',
        name,
        active: true,
        order:
          acompanhamentos.length + 1,
        category:
          'acompanhamento',
      });

      setNewAcompName('');

      await loadData();

      showFeedback(
        'Acompanhamento cadastrado!'
      );
    };

  const handleDeleteAcompanhamento =
    async (
      item: Complement
    ) => {
      if (
        !window.confirm(
          `Excluir "${item.name}"?`
        )
      ) {
        return;
      }

      await deleteAcompanhamento(
        item.id
      );

      await loadData();

      showFeedback(
        'Acompanhamento excluído.'
      );
    };

  const handleToggleAcompanhamento =
    async (
      item: Complement
    ) => {
      await toggleAcompanhamentoActive(
        item.id,
        item.active === false
      );

      await loadData();
    };

  // ===========================================================
  // COBERTURAS
  // ===========================================================

  const handleAddCobertura =
    async () => {
      const name =
        newCoberturaName.trim();

      if (!name) {
        showFeedback(
          'Informe a cobertura.'
        );
        return;
      }

      await saveCobertura({
        id: '',
        name,
        active: true,
        order:
          coberturas.length + 1,
      });

      setNewCoberturaName('');

      await loadData();

      showFeedback(
        'Cobertura cadastrada!'
      );
    };

  const handleDeleteCobertura =
    async (
      item: Cobertura
    ) => {
      if (
        !window.confirm(
          `Excluir "${item.name}"?`
        )
      ) {
        return;
      }

      await deleteCobertura(
        item.id
      );

      await loadData();

      showFeedback(
        'Cobertura excluída.'
      );
    };

  const handleToggleCobertura =
    async (
      item: Cobertura
    ) => {
      await toggleCoberturaActive(
        item.id,
        item.active === false
      );

      await loadData();
    };

  // ===========================================================
  // OPÇÕES DE AÇAÍ
  // ===========================================================

  // ===========================================================
  // LOGOUT
  // ===========================================================

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  // ===========================================================
  // RENDER
  // ===========================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo
              size="md"
            />

            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Painel Administrativo
              </p>

              <h1 className="text-lg font-bold text-slate-900">
                Açaíteria Alves
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut
              size={18}
            />

            <span className="hidden sm:inline">
              Sair
            </span>
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* TOP */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onNavigateToCardapio}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft
                size={16}
              />

              Voltar para a loja
            </button>

            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Gerenciamento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gerencie produtos, categorias e opções do cardápio.
            </p>
          </div>
        </div>

        {/* FEEDBACK */}
        {feedbackMessage && (
          <div className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
            {feedbackMessage}
          </div>
        )}

        {/* TABS */}
        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            <TabButton
              active={
                activeTab ===
                'produtos'
              }
              onClick={() =>
                setActiveTab(
                  'produtos'
                )
              }
              icon={
                <ShoppingBag
                  size={18}
                />
              }
              label="Produtos"
              count={
                products.length
              }
            />

            <TabButton
              active={
                activeTab ===
                'categorias'
              }
              onClick={() =>
                setActiveTab(
                  'categorias'
                )
              }
              icon={
                <Layers
                  size={18}
                />
              }
              label="Categorias"
              count={
                categorias.length
              }
            />

            <TabButton
              active={
                activeTab ===
                'acompanhamentos'
              }
              onClick={() =>
                setActiveTab(
                  'acompanhamentos'
                )
              }
              icon={
                <List
                  size={18}
                />
              }
              label="Acompanhamentos"
              count={
                acompanhamentos.length
              }
            />

            <TabButton
              active={
                activeTab ===
                'coberturas'
              }
              onClick={() =>
                setActiveTab(
                  'coberturas'
                )
              }
              icon={
                <IceCream
                  size={18}
                />
              }
              label="Coberturas"
              count={
                coberturas.length
              }
            />

          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />

            <p className="text-sm font-medium text-slate-500">
              Carregando dados...
            </p>
          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* PRODUTOS */}
            {/* ================================================= */}

            {activeTab ===
              'produtos' && (
                <section>
                  <SectionHeader
                    title="Produtos"
                    description="Cadastre e gerencie os produtos disponíveis no cardápio."
                    buttonText="Novo produto"
                    onClick={() => openNewProduct()}
                  />

                  {categorias.length === 0 && products.length === 0 ? (
                    <EmptyState
                      icon={<ShoppingBag size={30} />}
                      title="Nenhuma categoria cadastrada"
                      description="Crie uma categoria na aba Categorias para começar a cadastrar produtos."
                      buttonText="Adicionar produto"
                      onClick={() => openNewProduct()}
                    />
                  ) : (
                    <div className="space-y-8">
                      {productGroups.map((group) => (
                        <div key={group.id}>
                          {/* linha de separação ACIMA do título */}
                          <div className="border-t-2 border-slate-300 pt-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <h3 className="text-lg font-black uppercase tracking-wide text-slate-900">
                                {group.name}
                              </h3>

                              <button
                                type="button"
                                onClick={() => openNewProduct(group.categoryId)}
                                disabled={!group.categoryId}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-200 disabled:opacity-40"
                              >
                                <Plus size={14} />
                                Adicionar
                              </button>
                            </div>

                            {group.products.length === 0 ? (
                              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                                Nenhum produto cadastrado.
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                                {group.products.map((product) => (
                                  <ProductCard
                                    key={product.id}
                                    product={product}
                                    category={group.category}
                                    onEdit={() => openEditProduct(product)}
                                    onDelete={() => handleDeleteProduct(product)}
                                    onToggle={() => handleToggleProduct(product)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

            {/* ================================================= */}
            {/* CATEGORIAS */}
            {/* ================================================= */}

            {activeTab ===
              'categorias' && (
                <section>
                  <SectionHeader
                    title="Categorias"
                    description="Crie, edite, ative ou exclua categorias do cardápio."
                  />

                  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Nova categoria
                        </label>

                        <input
                          type="text"
                          value={
                            newCategoryName
                          }
                          onChange={(
                            event
                          ) =>
                            setNewCategoryName(
                              event.target
                                .value
                            )
                          }
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                              'Enter'
                            ) {
                              handleAddCategory();
                            }
                          }}
                          placeholder="Ex.: Combos"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={
                            handleAddCategory
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700 sm:w-auto"
                        >
                          <Plus
                            size={18}
                          />

                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {categorias.length ===
                      0 ? (
                      <div className="p-10 text-center">
                        <Layers
                          size={32}
                          className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="font-semibold">
                          Nenhuma categoria.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {categorias.map(
                          (
                            category
                          ) => (
                            <div
                              key={
                                category.id
                              }
                              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                                  <Layers
                                    size={
                                      19
                                    }
                                  />
                                </div>

                                <div>
                                  {editingCategoryId ===
                                    category.id ? (
                                    <input
                                      autoFocus
                                      value={
                                        editingCategoryName
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setEditingCategoryName(
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-purple-500"
                                    />
                                  ) : (
                                    <p className="font-bold text-slate-900">
                                      {
                                        category.name
                                      }
                                    </p>
                                  )}

                                  <p className="text-xs text-slate-400">
                                    ID:{' '}
                                    {
                                      category.id
                                    }
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleCategory(
                                      category
                                    )
                                  }
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${category.active ===
                                    false
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                >
                                  <Power
                                    size={
                                      14
                                    }
                                  />

                                  {category.active ===
                                    false
                                    ? 'Inativa'
                                    : 'Ativa'}
                                </button>

                                {editingCategoryId ===
                                  category.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={
                                        handleSaveCategoryEdit
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                      title="Salvar"
                                    >
                                      <Check
                                        size={
                                          17
                                        }
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditCategory
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      title="Cancelar"
                                    >
                                      <X
                                        size={
                                          17
                                        }
                                      />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditCategory(
                                        category
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    title="Editar"
                                  >
                                    <Edit2
                                      size={
                                        17
                                      }
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCategory(
                                      category
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                  title="Excluir"
                                >
                                  <Trash2
                                    size={
                                      17
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

            {/* ================================================= */}
            {/* ACOMPANHAMENTOS */}
            {/* ================================================= */}

            {activeTab ===
              'acompanhamentos' && (
                <SimpleListSection
                  title="Acompanhamentos"
                  description="Gerencie os acompanhamentos disponíveis para os produtos."
                  placeholder="Ex.: Granola"
                  value={
                    newAcompName
                  }
                  onChange={
                    setNewAcompName
                  }
                  onAdd={
                    handleAddAcompanhamento
                  }
                  items={
                    acompanhamentos
                  }
                  onDelete={
                    handleDeleteAcompanhamento
                  }
                  onToggle={
                    handleToggleAcompanhamento
                  }
                  type="acompanhamento"
                />
              )}

            {/* ================================================= */}
            {/* COBERTURAS */}
            {/* ================================================= */}

            {activeTab ===
              'coberturas' && (
                <SimpleListSection
                  title="Coberturas"
                  description="Gerencie as coberturas disponíveis no cardápio."
                  placeholder="Ex.: Chocolate"
                  value={
                    newCoberturaName
                  }
                  onChange={
                    setNewCoberturaName
                  }
                  onAdd={
                    handleAddCobertura
                  }
                  items={
                    coberturas
                  }
                  onDelete={
                    handleDeleteCobertura
                  }
                  onToggle={
                    handleToggleCobertura
                  }
                  type="cobertura"
                />
              )}

          </>
        )}
      </main>

      {/* ======================================================= */}
      {/* PRODUCT MODAL */}
      {/* ======================================================= */}

      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto my-4 max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-xl font-black">
                  {isNewProduct
                    ? 'Novo produto'
                    : 'Editar produto'}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Preencha as informações do produto.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeProductModal
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* NOME */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Nome do produto
                </label>

                <input
                  value={
                    editingProduct.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateProductField(
                      'name',
                      event.target
                        .value
                    )
                  }
                  placeholder="Informe o nome"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* CATEGORIA */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Categoria
                </label>

                <select
                  value={
                    editingProduct.categoryId
                  }
                  onChange={(
                    event
                  ) => {
                    const categoryId = event.target.value;
                    updateProductField('categoryId', categoryId);
                    const allowedTypes = getProductTypes(categoryId, categorias);
                    if (!allowedTypes.some((type) => type.value === editingProduct.tipo)) updateProductField('tipo', null);
                  }
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  {categorias
                    .filter(
                      (
                        category
                      ) =>
                        category.active !==
                        false
                    )
                    .map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                </select>

                {categorias.filter(
                  (category) =>
                    category.active !==
                    false
                ).length ===
                  0 && (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      Cadastre pelo menos uma categoria antes de criar produtos.
                    </p>
                  )}
              </div>

              {getProductTypes(editingProduct.categoryId, categorias).length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Tipo</label>
                  <select
                    value={editingProduct.tipo || ''}
                    onChange={(event) => updateProductField('tipo', event.target.value || null)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">Selecione o tipo</option>
                    {getProductTypes(editingProduct.categoryId, categorias).map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* DESCRIÇÃO */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Descrição
                </label>

                <textarea
                  value={
                    editingProduct.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateProductField(
                      'description',
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Descrição do produto..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* VALOR (preço fixo) + ORDEM */}
              <div className="grid gap-4 sm:grid-cols-2">
                {productFlags.isCombo && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Unidades</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingProduct.units || ''}
                      onChange={(event) => updateProductField('units', event.target.value === '' ? undefined : Number(event.target.value))}
                      placeholder="Informe a quantidade"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                )}
                {productFlags.isFixedPrice && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Valor
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editingProduct.basePrice
                          ? editingProduct.basePrice
                          : ''
                      }
                      onChange={(event) =>
                        updateProductField(
                          'basePrice',
                          event.target.value === ''
                            ? 0
                            : Number(event.target.value)
                        )
                      }
                      placeholder="Informe o valor"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Ordem
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      editingProduct.order
                        ? editingProduct.order
                        : ''
                    }
                    onChange={(event) =>
                      updateProductField(
                        'order',
                        event.target.value === ''
                          ? 0
                          : Number(event.target.value)
                      )
                    }
                    placeholder="Informe a ordem"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              {/* IMAGEM */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Imagem
                </label>

                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {editingProduct.image ? (
                      <img
                        src={
                          editingProduct.image
                        }
                        alt={
                          editingProduct.name ||
                          'Produto'
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={36}
                        className="text-slate-300"
                      />
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm font-bold text-slate-600 transition hover:border-purple-400 hover:bg-purple-50">
                      <Upload
                        size={18}
                      />

                      Escolher imagem

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handleProductImage
                        }
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={
                        editingProduct.image
                      }
                      onChange={(
                        event
                      ) =>
                        updateProductField(
                          'image',
                          event.target
                            .value
                        )
                      }
                      placeholder="Ou cole a URL da imagem"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* ATIVO */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-bold text-slate-800">
                    Produto ativo
                  </p>

                  <p className="text-xs text-slate-500">
                    Produtos inativos não aparecem no cardápio público.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateProductField(
                      'active',
                      editingProduct.active ===
                      false
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${editingProduct.active ===
                    false
                    ? 'bg-slate-300'
                    : 'bg-emerald-500'
                    }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${editingProduct.active ===
                      false
                      ? 'left-1'
                      : 'left-6'
                      }`}
                  />
                </button>
              </div>

              {/* TAMANHOS — somente categorias com tamanhos */}
              {productFlags.usesSizes && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-black">
                        Tamanhos e valores
                      </h4>

                      <p className="text-xs text-slate-400">
                        O cliente verá &quot;A partir de&quot; com o menor valor.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addSize}
                      className="flex items-center gap-2 rounded-xl bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-200"
                    >
                      <Plus size={15} />
                      Tamanho
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editingProduct.sizes || []).map((size, index) => (
                      <div
                        key={size.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold">
                            Tamanho {index + 1}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeSize(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600">Nome</label>
                            <input
                              value={size.label}
                              onChange={(event) =>
                                updateSize(index, 'label', event.target.value)
                              }
                              placeholder="Informe o nome"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600">Volume</label>
                            <input
                              value={size.volume || ''}
                              onChange={(event) =>
                                updateSize(index, 'volume', event.target.value)
                              }
                              placeholder="Informe o volume"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600">Valor</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={size.price === 0 ? '' : size.price}
                              onChange={(event) =>
                                updateSize(
                                  index,
                                  'price',
                                  event.target.value === ''
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                              placeholder="Informe o valor"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                            />
                          </div>

                          {productFlags.isAcai && (
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-600">Acompanhamentos</label>
                              <input
                                type="number"
                                min="0"
                                value={
                                  size.maxComplements ? size.maxComplements : ''
                                }
                                onChange={(event) =>
                                  updateSize(
                                    index,
                                    'maxComplements',
                                    event.target.value === ''
                                      ? undefined
                                      : Number(event.target.value)
                                  )
                                }
                                placeholder="Informe a quantidade de acompanhamentos"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Ativo</span>

                          <button
                            type="button"
                            onClick={() =>
                              updateSize(index, 'active', size.active === false)
                            }
                            className={`relative h-6 w-11 rounded-full ${
                              size.active === false
                                ? 'bg-slate-300'
                                : 'bg-emerald-500'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${
                                size.active === false ? 'left-1' : 'left-6'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(editingProduct.sizes || []).length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                        Nenhum tamanho cadastrado. Clique em &quot;Tamanho&quot; para adicionar.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={
                  closeProductModal
                }
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleSaveProduct
                }
                disabled={savingProduct}
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <Check
                    size={18}
                  />

                  {savingProduct ? 'Sincronizando…' : isNewProduct
                    ? 'Cadastrar produto'
                    : 'Salvar alterações'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// COMPONENTES AUXILIARES
// =============================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${active
        ? 'bg-purple-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      {icon}

      <span>
        {label}
      </span>

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${active
          ? 'bg-white/20 text-white'
          : 'bg-slate-100 text-slate-500'
          }`}
      >
        {count}
      </span>
    </button>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
  buttonText?: string;
  onClick?: () => void;
}

function SectionHeader({
  title,
  description,
  buttonText,
  onClick,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-xl font-black">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {buttonText &&
        onClick && (
          <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
          >
            <Plus
              size={18}
            />

            {buttonText}
          </button>
        )}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}

function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
        {icon}
      </div>

      <h4 className="font-black">
        {title}
      </h4>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
      >
        {buttonText}
      </button>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  category?: Category;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function ProductCard({
  product,
  category,
  onEdit,
  onDelete,
  onToggle,
}: ProductCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${product.active ===
        false
        ? 'border-slate-200 opacity-70'
        : 'border-slate-200 hover:shadow-md'
        }`}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {product.image ? (
          <img
            src={
              product.image
            }
            alt={
              product.name
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ImageIcon
              size={40}
            />
          </div>
        )}

        <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-700 shadow">
            {category?.name ||
              'Sem categoria'}
          </span>
        </div>

        {product.active ===
          false && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                Inativo
              </span>
            </div>
          )}
      </div>

      <div className="p-2.5 sm:p-4">
        <h4 className="text-xs sm:text-base font-black text-slate-900 line-clamp-1">
          {product.name}
        </h4>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {
              product.description
            }
          </p>
        )}

        <div className="mt-2 sm:mt-3 flex items-center justify-between">
          <span className="text-sm sm:text-base font-black text-purple-600">
            <span className="mr-1 text-[10px] sm:text-xs font-semibold text-slate-400">
              {getCategoryFlags(
                product.categoryId,
                category ? [category] : []
              ).isFixedPrice
                ? 'Valor'
                : 'A partir de'}
            </span>
            {money(
              product.basePrice
            )}
          </span>

          {product.sizes &&
            product.sizes.length >
            0 && (
              <span className="text-xs font-medium text-slate-400">
                {
                  product.sizes
                    .length
                }{' '}
                tamanho(s)
              </span>
            )}
        </div>

        <div className="mt-2 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-100"
          >
            <Edit2
              size={12}
            />

            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            type="button"
            onClick={onToggle}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold ${product.active ===
              false
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
          >
            <Power
              size={12}
            />

            <span className="hidden sm:inline">{product.active ===
              false
              ? 'Ativar'
              : 'Pausar'}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-red-600 hover:bg-red-100"
          >
            <Trash2
              size={12}
            />

            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

type SimpleItem = Complement | Cobertura;

interface SimpleListSectionProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  onAdd: () => void;
  items: SimpleItem[];
  onDelete: (
    item: any
  ) => void;
  onToggle: (
    item: any
  ) => void;
  type:
  | 'acompanhamento'
  | 'cobertura';
}

function SimpleListSection({
  title,
  description,
  placeholder,
  value,
  onChange,
  onAdd,
  items,
  onDelete,
  onToggle,
  type,
}: SimpleListSectionProps) {
  return (
    <section>
      <SectionHeader
        title={title}
        description={
          description
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Novo item
            </label>

            <input
              type="text"
              value={value}
              onChange={(
                event
              ) =>
                onChange(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  onAdd();
                }
              }}
              placeholder={
                placeholder
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700 sm:w-auto"
            >
              <Plus
                size={18}
              />

              Adicionar
            </button>
          </div>
        </div>
      </div>

      {items.length ===
        0 ? (
        <EmptyState
          icon={
            type ===
              'cobertura' ? (
              <IceCream
                size={30}
              />
            ) : (
              <List
                size={30}
              />
            )
          }
          title="Nenhum item cadastrado"
          description="Adicione o primeiro item acima."
          buttonText="Adicionar"
          onClick={onAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      {type ===
                        'cobertura' ? (
                        <IceCream
                          size={
                            18
                          }
                        />
                      ) : (
                        <List
                          size={
                            18
                          }
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {
                          item.name
                        }
                      </p>

                      <p className="text-xs text-slate-400">
                        Ordem:{' '}
                        {
                          item.order ||
                          0
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggle(
                          item
                        )
                      }
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${item.active ===
                        false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-50 text-emerald-700'
                        }`}
                    >
                      <Power
                        size={
                          14
                        }
                      />

                      {item.active ===
                        false
                        ? 'Inativo'
                        : 'Ativo'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          item
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Excluir"
                    >
                      <Trash2
                        size={
                          17
                        }
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}
