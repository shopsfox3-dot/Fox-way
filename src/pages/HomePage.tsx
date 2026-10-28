import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchCategories, fetchProductCountByCategory, searchAllProducts } from '@/lib/api';
import { getCategoryIcon } from '@/components/CategoryIcon';
import { CategoryBrandBillboard } from '@/components/CategoryBrandBillboard';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDA } from '@/lib/format';
import type { Category, Product } from '@/types';
import {
  ShoppingBasket,
  Loader2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  Search,
  X,
  ShoppingCart,
  Plus,
  Minus,
  PackageX,
} from 'lucide-react';

interface HomePageProps {
  onSelectCategory: (categoryId: string, categoryName: string) => void;
}

export default function HomePage({ onSelectCategory }: HomePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { addToCart } = useCart();
  const { t, language, isRTL, dir } = useLanguage();

  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProductCountByCategory()])
      .then(([cats, cnt]) => {
        setCategories(cats);
        setCounts(cnt);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle instant search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAllProducts(searchTerm);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const getQty = useCallback((productId: string) => quantities[productId] || 1, [quantities]);

  const increment = useCallback((productId: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
  }, []);

  const decrement = useCallback((productId: string) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      if (current <= 1) return prev;
      return { ...prev, [productId]: current - 1 };
    });
  }, []);

  const handleAdd = useCallback(
    (product: Product) => {
      addToCart(product, quantities[product.id] || 1);
      setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    },
    [addToCart, quantities]
  );

  return (
    <div dir={dir} className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero banner - Higgsfield Luxury Dark / Crisp Light */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-zinc-950 dark:via-[#121215] dark:to-[#141418] border border-slate-200/90 dark:border-zinc-800/90 shadow-lg dark:shadow-2xl p-8 md:p-12 mb-8 animate-fade-in-up ring-1 ring-slate-950/5 dark:ring-white/5 transition-colors duration-200">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full filter blur-[90px] -translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-teal-500/10 rounded-full filter blur-[80px] translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3 shadow-sm dark:shadow-neon-sm">
            <span>{t.home.platformBadge}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            {t.home.heroTitle}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-300">
              {t.nav.brandName}
            </span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm md:text-base mb-6 max-w-md">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 rounded-xl px-4 py-2 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm shadow-sm dark:shadow-none">
              <Truck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{t.home.featureDelivery}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 rounded-xl px-4 py-2 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm shadow-sm dark:shadow-none">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{t.home.featureQuality}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 rounded-xl px-4 py-2 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm shadow-sm dark:shadow-none">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{t.home.featureWholesale}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="relative mb-8">
        <div className="relative flex items-center">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-emerald-500 dark:text-emerald-400 pointer-events-none`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className={`w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 rounded-2xl ${
              isRTL ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'
            } py-3.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-md dark:shadow-lg ring-1 ring-slate-950/5 dark:ring-white/5`}
          />
          {searching ? (
            <Loader2 className={`absolute ${isRTL ? 'left-4' : 'right-4'} w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin`} />
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute ${isRTL ? 'left-4' : 'right-4'} p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors`}
              title={t.common.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Mode or Normal Mode */}
      {searchTerm.trim() ? (
        /* Search Results Section */
        <div className="space-y-8 animate-fade-in-up">
          {/* Matching categories if any */}
          {filteredCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                <span>{t.home.matchingCategories} ({filteredCategories.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id, cat.name)}
                      className={`p-3 bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all flex items-center gap-2.5 ${isRTL ? 'text-right' : 'text-left'} shadow-sm dark:shadow-none ring-1 ring-slate-950/5 dark:ring-white/5`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm truncate">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {t.home.searchResultsFor} "{searchTerm}"
              </h2>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                {searchResults.length} {t.home.productsCount}
              </span>
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-16 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
              </div>
            ) : searchResults.length === 0 && filteredCategories.length === 0 ? (
              <div className="card p-12 text-center bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                <PackageX className="w-12 h-12 text-slate-400 dark:text-zinc-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  {t.home.noSearchResults}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                  {t.home.noSearchResultsDesc}
                </p>
                <button onClick={() => setSearchTerm('')} className="btn-primary text-xs">
                  {t.catalog.backToHome}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => {
                  const qty = getQty(product.id);
                  const lineTotal = product.price * qty;
                  return (
                    <div
                      key={product.id}
                      className="card p-5 flex flex-col bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-950/5 dark:ring-white/5"
                    >
                      {/* Product image placeholder */}
                      <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 flex items-center justify-center mb-4">
                        <span className="text-4xl font-extrabold text-slate-400 dark:text-zinc-700">
                          {product.name.charAt(0)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4 mt-auto">
                        <div>
                          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatDA(product.price, t.common.daCurrency)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">
                            {t.catalog.perUnit}: {product.unit}
                          </p>
                        </div>
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">{t.cart.summaryTitle}</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                            {formatDA(lineTotal, t.common.daCurrency)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity + add */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                          <button
                            onClick={() => decrement(product.id)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 font-semibold text-slate-900 dark:text-white min-w-[2.5rem] text-center text-xs sm:text-sm">
                            {qty}
                          </span>
                          <button
                            onClick={() => increment(product.id)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAdd(product)}
                          disabled={product.market_unavailable}
                          className="flex-1 btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {t.catalog.addToCart}
                        </button>
                      </div>

                      {product.market_unavailable ? (
                        <p className="text-xs text-red-400 font-medium mt-2">⛔ {t.catalog.outOfStock}</p>
                      ) : product.stock > 0 ? (
                        <p className="text-xs text-emerald-400 font-medium mt-2">
                          {t.catalog.availableNow}: {product.stock} {product.unit}
                        </p>
                      ) : (
                        <p className="text-xs text-teal-400 font-medium mt-2">
                          ⚡ JIT ({t.catalog.availableNow})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Normal Categories Grid */
        <div>
          {/* Section title */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.home.allCategories}</h2>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">{categories.length} {t.home.productsCount}</span>
            </div>

            <button
              onClick={() => onSelectCategory('all', t.common.all)}
              className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>{t.home.viewCategory}</span>
              <ForwardArrow className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {categories.map((cat, index) => {
                const count = counts[cat.id] || 0;
                const localizedName = language === 'fr' ? (cat.name_fr || cat.name) : cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id, localizedName)}
                    className={`card p-4 sm:p-5 rounded-2xl ${isRTL ? 'text-right' : 'text-left'} group hover:border-emerald-500/60 hover:shadow-xl dark:hover:shadow-neon-sm bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 transition-all duration-300 animate-fade-in-up ring-1 ring-slate-950/5 dark:ring-white/5 flex flex-col justify-between`}
                    style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
                  >
                    <div>
                      {/* Dynamic Brand Billboard Rotating Brands (Grand & Full-Bleed 16:9) */}
                      <div className="mb-3">
                        <CategoryBrandBillboard
                          brandImages={cat.brand_images}
                          categoryName={localizedName}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                          {localizedName}
                        </h3>
                        <ForwardArrow className={`w-4 h-4 text-slate-400 dark:text-zinc-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 shrink-0`} />
                      </div>
                    </div>

                    <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between px-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <ShoppingBasket className="w-3.5 h-3.5 text-emerald-500/80 dark:text-emerald-400/70" />
                        {count} {t.home.productsCount}
                      </p>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-90 group-hover:opacity-100 group-hover:underline transition-all">
                        {t.home.viewCategory}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
