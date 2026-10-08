import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProvedorCarrinho, usarCarrinho } from './contexto/ContextoCarrinho';
import { Cabecalho } from './componentes/Cabecalho';
import { BannerPrincipal } from './componentes/BannerPrincipal';
import { CartaoProduto } from './componentes/CartaoProduto';
import { SecaoCombos } from './componentes/SecaoCombos';
import { CarrinhoLateral } from './componentes/CarrinhoLateral';
import { NavegacaoInferiorMovel } from './componentes/NavegacaoInferiorMovel';
import { ModalOpcoesProduto } from './componentes/ModalOpcoesProduto';
import { ModalPedidoConcluido } from './componentes/ModalPedidoConcluido';
import { Rodape } from './componentes/Rodape';
import { CategoryId, Category, Product, ProductSize, Complement, Cobertura } from './tipos/Cardapio';
import { Search } from 'lucide-react';
import {
  getProducts,
  getCategorias,
  getAcompanhamentos,
  getCoberturas,
  getCachedAcompanhamentos,
  getCachedCoberturas,
  subscribeToDatabase,
} from './servicos/ServicoBancoDados';
import { getCurrentSession } from './servicos/supabase';
import { AcessoAdministrador } from './paginas/AcessoAdministrador';
import PainelAdministrador from './paginas/PainelAdministrador';
const PainelVendas = React.lazy(() => import('./paginas/PainelVendas'));
import { getCategoryFlags, getProductTypes, isComboCategory, sortProductsForMenu } from './utilitarios/RegrasCategorias';
import { isStoreOpenAt, ENFORCE_STORE_HOURS } from './utilitarios/HorarioLoja';

function MenuContent({ onNavigateToAdmin }: { onNavigateToAdmin: () => void }) {
  const [storeIsOpen, setStoreIsOpen] = useState(() => isStoreOpenAt());
  const [showClosedNotice, setShowClosedNotice] = useState(() => !isStoreOpenAt());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'todos'>('todos');
  const visibleSections = useRef(new Map<string, number>());
  const programmaticTarget = useRef<string | null>(null);

  // Estado dinâmico persistido no banco de dados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [acompanhamentos, setAcompanhamentos] = useState<Complement[]>(getCachedAcompanhamentos);
  const [coberturas, setCoberturas] = useState<Cobertura[]>(getCachedCoberturas);
  const optionsLoaded = useRef(false);
  const menuRequest = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setStoreIsOpen(isStoreOpenAt()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // A ordem recebida do Supabase é mantida na navegação e nas seções.
  const orderedCategories = categories;

  const getMenuSection = (id: string) =>
    [...document.querySelectorAll<HTMLElement>('[data-category-section]')]
      .find((section) => section.getAttribute('data-category-section') === id);

  const scrollToCategory = (categoryId: CategoryId | 'todos') => {
    const targetId = String(categoryId);
    programmaticTarget.current = targetId;
    setSearchQuery('');
    setSelectedCategory(categoryId);
    requestAnimationFrame(() => {
      const section = getMenuSection(targetId);
      if (!section) return;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      const targetTop = window.scrollY + section.getBoundingClientRect().top - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    });
  };

  // Estado de personalização do modal
  const [customizingProduct, setCustomizingProduct] = useState<{
    product: Product;
    defaultSize?: ProductSize;
  } | null>(null);

  // Busca dados do serviço de banco e acompanha atualizações administrativas em tempo real
  const refreshMenuData = async () => {
    if (!menuRequest.current) {
      menuRequest.current = (async () => {
        try {
          const [productsResult, categoriesResult] = await Promise.allSettled([
            getProducts(),
            getCategorias(),
          ]);
          setProducts(productsResult.status === 'fulfilled' ? productsResult.value : []);
          setCategories(categoriesResult.status === 'fulfilled' ? categoriesResult.value : []);
        } catch {
          // ignora
        } finally {
          setMenuLoaded(true);
          menuRequest.current = null;
        }
      })();
    }
    return menuRequest.current;
  };

  useEffect(() => {
    refreshMenuData();
    const unsubscribe = subscribeToDatabase(() => {
      refreshMenuData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Se a categoria selecionada foi excluída pelo ADM, volta para "Todos"
  // automaticamente para não deixar o cliente numa aba que já não existe.
  useEffect(() => {
    if (
      selectedCategory !== 'todos' &&
      categories.length > 0 &&
      !categories.some((cat) => cat.id === selectedCategory)
    ) {
      setSelectedCategory('todos');
    }
  }, [categories, selectedCategory]);

  // A listagem principal mantém um cardápio contínuo; a busca filtra seus produtos.
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Mostra apenas produtos ativos no cardápio público
      if (product.active === false) return false;

      // Filtro de busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = (product.description || '').toLowerCase().includes(query);
        const matchesCategory = String(product.categoryId).toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCategory;
      }

      return true;
    });

    // Agrupa por ordem da categoria e ordena pelo menor preço dentro de cada grupo
    return sortProductsForMenu(filtered, categories);
  }, [products, categories, searchQuery]);

  const featuredCombos = useMemo(() => {
    return products.filter((p) => (p.isCombo || String(p.categoryId).toLowerCase().includes('combo') || categories.find((category) => category.id === p.categoryId)?.name.toLowerCase().includes('combo')) && p.active !== false);
  }, [products, categories]);

  const isComboProduct = (product: Product) =>
    product.isCombo === true || getCategoryFlags(product.categoryId, categories).isCombo;

  const categorySections = useMemo(() => orderedCategories.map((category) => {
    const categoryIsCombo = isComboCategory(category.id, category.name);
    const sectionProducts = filteredProducts.filter((product) => categoryIsCombo
      ? isComboProduct(product)
      : product.categoryId === category.id && !isComboProduct(product));
    const productTypes = getProductTypes(category.id, orderedCategories);
    const groups = productTypes.length > 0
      ? [
        ...productTypes.map((type) => ({
          id: type.value,
          title: type.label,
          products: sectionProducts.filter((product) => product.tipo === type.value),
        })),
        ...(sectionProducts.some((product) => !product.tipo || !productTypes.some((type) => type.value === product.tipo))
          ? [{ id: 'legacy', title: categoryIsCombo ? 'Outros Combos' : 'Outros Açaís', products: sectionProducts.filter((product) => !product.tipo || !productTypes.some((type) => type.value === product.tipo)) }]
          : []),
      ]
      : [{ id: 'all', title: '', products: sectionProducts }];
    return { ...category, groups };
  }), [orderedCategories, filteredProducts, categories]);

  useEffect(() => {
    if (searchQuery.trim()) return;
    visibleSections.current.clear();
    const stickyHeader = document.querySelector('header');
    const headerHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('data-category-section');
        if (!id) return;
        if (entry.isIntersecting) visibleSections.current.set(id, entry.intersectionRect.height);
        else visibleSections.current.delete(id);
      });
      const targetId = programmaticTarget.current;
      if (targetId) {
        const target = getMenuSection(targetId);
        if (target && target.getBoundingClientRect().top <= headerHeight + 40) {
          programmaticTarget.current = null;
          setSelectedCategory(targetId as CategoryId | 'todos');
          return;
        } else {
          return;
        }
      }

      const visible = [...visibleSections.current.entries()].sort((a, b) => b[1] - a[1])[0];
      if (visible) setSelectedCategory(visible[0] as CategoryId | 'todos');
    }, {
      rootMargin: `-${headerHeight}px 0px -20% 0px`,
      threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
    });

    document.querySelectorAll('[data-category-section]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [orderedCategories, searchQuery]);

  useEffect(() => {
    const cancelProgrammaticScroll = () => {
      programmaticTarget.current = null;
    };
    const handleScrollEnd = () => {
      const targetId = programmaticTarget.current;
      const target = targetId ? getMenuSection(targetId) : null;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      if (target && target.getBoundingClientRect().top <= headerHeight + 40) {
        programmaticTarget.current = null;
      }
    };
    window.addEventListener('wheel', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('pointerdown', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('scrollend', handleScrollEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', cancelProgrammaticScroll);
      window.removeEventListener('touchstart', cancelProgrammaticScroll);
      window.removeEventListener('pointerdown', cancelProgrammaticScroll);
      window.removeEventListener('scrollend', handleScrollEnd);
    };
  }, []);

  const handleOrderNowClick = () => {
    scrollToCategory('todos');
  };

  const handleOpenCustomize = (product: Product, defaultSize?: ProductSize) => {
    setCustomizingProduct({ product, defaultSize });
    if (!optionsLoaded.current) {
      optionsLoaded.current = true;
      Promise.all([getAcompanhamentos(), getCoberturas()]).then(([acomps, cobs]) => {
        setAcompanhamentos(acomps);
        setCoberturas(cobs);
      });
    }
  };

  const handleCloseCustomize = () => {
    setCustomizingProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f8] text-slate-800 selection:bg-[#b6f625] selection:text-[#1e032b]">
      {/* Cabeçalho da aplicação (Seção 1: contém Todos, Açaí, Sorvetes, Salgados, Milk Shakes, Bebidas, Carrinho) */}
      <Cabecalho
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={scrollToCategory}
        onNavigateToAdmin={onNavigateToAdmin}
        categories={orderedCategories}
        storeIsOpen={storeIsOpen}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-2.5 sm:px-6 pb-20 md:pb-12">
        {/* Exibição do banner principal (Seção 2: segunda barra de categorias abaixo do banner REMOVIDA) */}
        {!searchQuery && (
          <BannerPrincipal onOrderNowClick={handleOrderNowClick} />
        )}

        {/* Aviso de resultados durante a busca */}
        {searchQuery.trim() && (
          <div className="my-3 px-1 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-600">
              Resultados para <strong className="text-[#35074a]">"{searchQuery}"</strong> (
              {filteredProducts.length} encontrados)
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        )}

        {/* Grade do conteúdo principal */}
        <div className="mt-3 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Coluna esquerda: catálogo de produtos e banners promocionais (lg: 8,5 colunas) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
            {!menuLoaded ? (
              <div className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-purple-700" />
                <p className="text-sm font-semibold text-slate-500">Carregando cardápio...</p>
              </div>
            ) : searchQuery.trim() ? (
              <section className="scroll-mt-32 lg:scroll-mt-24">
                <div className="flex items-center gap-2 pb-1 px-1">
                  <Search className="w-5 h-5 text-purple-700" />
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-[#2e053f]">Resultados da busca</h2>
                    <p className="text-xs text-slate-500">{filteredProducts.length} produtos encontrados</p>
                  </div>
                </div>
                {filteredProducts.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                    {filteredProducts.map((product) => (
                      <CartaoProduto key={product.id} product={product} categories={categories} selectedCategory={selectedCategory} onOpenCustomize={handleOpenCustomize} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 text-center border border-purple-100 shadow-xs space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-sm">Nenhum produto encontrado.</h3>
                  </div>
                )}
              </section>
            ) : (
              <div className="space-y-8 sm:space-y-10">
                <section data-category-section="todos" className="scroll-mt-32 lg:scroll-mt-24">
                  <div className="pb-1 px-1 mb-3">
                    <div>
                      <h2 className="max-w-full whitespace-normal break-words text-lg sm:text-2xl font-black text-[#2e053f]">Explore todo o nosso cardápio delicioso e monte seu pedido!</h2>
                    </div>
                  </div>
                  {!filteredProducts.length && (
                    <div className="bg-white rounded-3xl p-8 text-center border border-purple-100 shadow-xs space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">Nenhum produto cadastrado ainda.</h3>
                    </div>
                  )}
                </section>

                {categorySections.map((section) => (
                  <section key={section.id} data-category-section={section.id} className="scroll-mt-32 lg:scroll-mt-24">
                    <div className="pb-1 px-1 mb-3">
                      <h2 className="text-lg sm:text-2xl font-black text-[#2e053f]">{section.name}</h2>
                    </div>
                    {section.groups.some((group) => group.products.length > 0) ? (
                      <div className="space-y-5">
                        {section.groups.filter((group) => group.products.length > 0).map((group) => (
                          <div key={group.id}>
                            {group.title && <h3 className="mb-3 px-1 text-base font-black uppercase tracking-wide text-[#2e053f]">{group.title}</h3>}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                              {group.products.map((product) => (
                                <CartaoProduto key={product.id} product={product} categories={categories} selectedCategory={section.id} onOpenCustomize={handleOpenCustomize} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-1 text-xs text-slate-500">Nenhum produto disponível nesta categoria.</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>

          {/* Coluna direita: barra lateral para computador conforme image.png */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-5">
            {/* Parte superior: cartão Meu pedido */}
            <CarrinhoLateral isEmbeddedDesktop={true} storeIsOpen={storeIsOpen} onClosedOrderAttempt={() => setShowClosedNotice(true)} />

            {/* Parte inferior: cartão Combos em destaque, quando disponível */}
            {featuredCombos.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm">
                <SecaoCombos
                  combos={featuredCombos}
                  onSelectCombo={(combo) => handleOpenCustomize(combo)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Rodape onNavigateToAdmin={onNavigateToAdmin} />

      {/* Barra de navegação inferior para celular */}
      <NavegacaoInferiorMovel
        selectedCategory={selectedCategory}
        onReturnHome={() => {
          setSearchQuery('');
        }}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Carrinho lateral deslizante para celular */}
      <CarrinhoLateral isEmbeddedDesktop={false} storeIsOpen={storeIsOpen} onClosedOrderAttempt={() => setShowClosedNotice(true)} />

      {ENFORCE_STORE_HOURS && showClosedNotice && !storeIsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="store-closed-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 id="store-closed-title" className="text-xl font-black text-[#35074a]">A Açaiteria Alves está fechada no momento 💜</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Nosso horário de atendimento é das 15:00 às 23:30. Você pode continuar visualizando nosso cardápio e montar seu carrinho, mas os pedidos só poderão ser finalizados durante o horário de funcionamento.</p>
            <button onClick={() => setShowClosedNotice(false)} className="mt-5 w-full rounded-xl bg-[#4b1764] px-4 py-3 font-black text-white">Entendi</button>
          </section>
        </div>
      )}

      {/* Modal de opções de personalização (Seções 4–9) */}
      <ModalOpcoesProduto
        product={customizingProduct?.product || null}
        initialSize={customizingProduct?.defaultSize}
        isOpen={!!customizingProduct}
        onClose={handleCloseCustomize}
        categories={categories}
        availableAcompanhamentos={acompanhamentos}
        availableCoberturas={coberturas}
      />

      {/* Modal de pedido concluído e encaminhamento ao WhatsApp */}
      <ModalPedidoConcluido />
    </div>
  );
}

export default function Aplicacao() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Sincroniza rotas no evento popstate (voltar/avançar do navegador)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Verifica a sessão de autenticação
  useEffect(() => {
    const verifyAuth = async () => {
      const session = await getCurrentSession();
      const testSession = sessionStorage.getItem('acaiteria_admin_session_test');
      if (session || testSession === 'true') {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    };
    verifyAuth();
  }, [currentPath]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Seção 15: ao acessar /admin ou /admin/painel sem autenticação, encaminha para /admin/login
  if (currentPath === '/admin/dashboard') {
    if (!isAdminAuthenticated) {
      return <AcessoAdministrador onLoginSuccess={() => { setIsAdminAuthenticated(true); navigate('/admin/dashboard'); }} onNavigateToCardapio={() => navigate('/')} />;
    }
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#f7f5f9] p-10 text-center font-semibold text-purple-800">Carregando Dashboard…</div>}>
        <PainelVendas onBack={() => navigate('/admin')} />
      </React.Suspense>
    );
  }

  if (currentPath === '/admin' || currentPath === '/admin/painel') {
    if (!isAdminAuthenticated) {
      return (
        <AcessoAdministrador
          onLoginSuccess={() => {
            setIsAdminAuthenticated(true);
            navigate('/admin');
          }}
          onNavigateToCardapio={() => navigate('/')}
        />
      );
    }
    return (
      <PainelAdministrador
        onLogout={() => {
          setIsAdminAuthenticated(false);
          navigate('/admin/login');
        }}
        onNavigateToCardapio={() => navigate('/')}
        onNavigateToDashboard={() => navigate('/admin/dashboard')}
      />
    );
  }

  if (currentPath === '/admin/login') {
    if (isAdminAuthenticated) {
      navigate('/admin');
      return (
        <PainelAdministrador
          onLogout={() => {
            setIsAdminAuthenticated(false);
            navigate('/admin/login');
          }}
          onNavigateToCardapio={() => navigate('/')}
          onNavigateToDashboard={() => navigate('/admin/dashboard')}
        />
      );
    }
    return (
      <AcessoAdministrador
        onLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          navigate('/admin');
        }}
        onNavigateToCardapio={() => navigate('/')}
      />
    );
  }

  // Cardápio digital público (SITE /)
  return (
    <ProvedorCarrinho>
      <MenuContent
        onNavigateToAdmin={() =>
          navigate(isAdminAuthenticated ? '/admin' : '/admin/login')
        }
      />
    </ProvedorCarrinho>
  );
}
