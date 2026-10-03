import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { CombosSection } from './components/CombosSection';
import { CartDrawer } from './components/CartDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductOptionsModal } from './components/ProductOptionsModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { Footer } from './components/Footer';
import { CategoryId, Category, Product, ProductSize, Complement, Cobertura } from './types/menu';
import { Search } from 'lucide-react';
import {
  getProducts,
  getCategorias,
  getAcompanhamentos,
  getCoberturas,
  getCachedAcompanhamentos,
  getCachedCoberturas,
  subscribeToDatabase,
} from './services/databaseService';
import { getCurrentSession } from './services/supabase';
import { AdminLogin } from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { getCategoryFlags, getProductTypes, isComboCategory, sortProductsForMenu } from './utils/categoryRules';

function MenuContent({ onNavigateToAdmin }: { onNavigateToAdmin: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'todos'>('todos');
  const visibleSections = useRef(new Map<string, number>());
  const programmaticTarget = useRef<string | null>(null);

  // Database-backed dynamic state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [acompanhamentos, setAcompanhamentos] = useState<Complement[]>(getCachedAcompanhamentos);
  const [coberturas, setCoberturas] = useState<Cobertura[]>(getCachedCoberturas);
  const optionsLoaded = useRef(false);
  const menuRequest = useRef<Promise<void> | null>(null);

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

  // Modal customization state
  const [customizingProduct, setCustomizingProduct] = useState<{
    product: Product;
    defaultSize?: ProductSize;
  } | null>(null);

  // Fetch data from databaseService & subscribe to live admin updates
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
          // ignore
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

  // The main listing remains a single continuous menu; search filters its products.
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Show only active products on the public menu
      if (product.active === false) return false;

      // Search query filter
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
      {/* Top App Header (Section 1: contains Todos, Açaí, Sorvetes, Salgados, Milk Shakes, Bebidas, Carrinho) */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={scrollToCategory}
        onNavigateToAdmin={onNavigateToAdmin}
        categories={orderedCategories}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-2.5 sm:px-6 pb-20 md:pb-12">
        {/* Hero Banner Showcase (Section 2: second category bar below banner is REMOVED) */}
        {!searchQuery && (
          <HeroBanner onOrderNowClick={handleOrderNowClick} />
        )}

        {/* Search Results Notice if searching */}
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

        {/* Main Content Layout Grid */}
        <div className="mt-3 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Column: Product Catalog & Promo Banners (lg: 8.5 columns) */}
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
                      <ProductCard key={product.id} product={product} categories={categories} selectedCategory={selectedCategory} onOpenCustomize={handleOpenCustomize} />
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
                      <h2 className="text-lg sm:text-2xl font-black text-[#2e053f]">Todos os Produtos</h2>
                      <p className="text-xs text-slate-500 hidden sm:block">Explore todo o nosso cardápio delicioso e monte seu pedido!</p>
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
                                <ProductCard key={product.id} product={product} categories={categories} selectedCategory={section.id} onOpenCustomize={handleOpenCustomize} />
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

          {/* Right Column: Desktop Sidebar matching image.png */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-5">
            {/* Top: Meu pedido Card */}
            <CartDrawer isEmbeddedDesktop={true} />

            {/* Bottom: Combos em destaque Card if available */}
            {featuredCombos.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm">
                <CombosSection
                  combos={featuredCombos}
                  onSelectCombo={(combo) => handleOpenCustomize(combo)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigateToAdmin={onNavigateToAdmin} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        selectedCategory={selectedCategory}
        onReturnHome={() => {
          setSearchQuery('');
        }}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Mobile Drawer Slide-over Cart */}
      <CartDrawer isEmbeddedDesktop={false} />

      {/* Customization Options Modal (Sections 4-9) */}
      <ProductOptionsModal
        product={customizingProduct?.product || null}
        initialSize={customizingProduct?.defaultSize}
        isOpen={!!customizingProduct}
        onClose={handleCloseCustomize}
        categories={categories}
        availableAcompanhamentos={acompanhamentos}
        availableCoberturas={coberturas}
      />

      {/* Order Success / WhatsApp Redirect Modal */}
      <OrderSuccessModal />
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Sync routing on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Check auth session
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

  // Section 15: If accessing /admin or /admin/painel without authentication -> redirect to /admin/login
  if (currentPath === '/admin' || currentPath === '/admin/painel') {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            setIsAdminAuthenticated(true);
            navigate('/admin');
          }}
          onNavigateToCardapio={() => navigate('/')}
        />
      );
    }
    return (
      <AdminDashboard
        onLogout={() => {
          setIsAdminAuthenticated(false);
          navigate('/admin/login');
        }}
        onNavigateToCardapio={() => navigate('/')}
      />
    );
  }

  if (currentPath === '/admin/login') {
    if (isAdminAuthenticated) {
      navigate('/admin');
      return (
        <AdminDashboard
          onLogout={() => {
            setIsAdminAuthenticated(false);
            navigate('/admin/login');
          }}
          onNavigateToCardapio={() => navigate('/')}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          navigate('/admin');
        }}
        onNavigateToCardapio={() => navigate('/')}
      />
    );
  }

  // Public Digital Menu (SITE /)
  return (
    <CartProvider>
      <MenuContent
        onNavigateToAdmin={() =>
          navigate(isAdminAuthenticated ? '/admin' : '/admin/login')
        }
      />
    </CartProvider>
  );
}
