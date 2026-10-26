import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchProductsByCategory, fetchCategories, fetchProductCountByCategory } from '@/lib/api';
import { getCategoryIcon } from '@/components/CategoryIcon';
import { formatDA } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Product, Category } from '@/types';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  ShoppingCart,
  PackageX,
  Search,
  X,
  Layers,
  Package,
  Box,
} from 'lucide-react';

interface ProductsPageProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

export default function ProductsPage({
  categoryId: initialCategoryId,
  categoryName: initialCategoryName,
  onBack,
}: ProductsPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategoryId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // وضع الشراء لكل منتج: 'unit' = حبة، 'pack' = كرتونة
  const [purchaseModes, setPurchaseModes] = useState<Record<string, 'unit' | 'pack'>>({});
  const { addToCart } = useCart();
  const { t, language, isRTL, dir } = useLanguage();

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Load all categories for filter tabs
  useEffect(() => {
    Promise.all([fetchCategories(), fetchProductCountByCategory()])
      .then(([cats, cnt]) => {
        setCategories(cats);
        setCounts(cnt);
      })
      .catch(() => {});
  }, []);

  // Update selectedCatId if parent prop changes
  useEffect(() => {
    setSelectedCatId(initialCategoryId);
  }, [initialCategoryId]);

  // Fetch products whenever selectedCatId changes
  useEffect(() => {
    setLoading(true);
    setFilterTerm('');
    fetchProductsByCategory(selectedCatId)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [selectedCatId]);

  const activeCategoryName = useMemo(() => {
    if (selectedCatId === 'all') return t.common.all;
    const found = categories.find((c) => c.id === selectedCatId);
    return found ? found.name : initialCategoryName;
  }, [selectedCatId, categories, initialCategoryName, t.common.all]);

  const totalAllCount = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [counts]);

  const filteredProducts = useMemo(() => {
    if (!filterTerm.trim()) return products;
    const term = filterTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );
  }, [products, filterTerm]);

  const getQty = useCallback((productId: string) => quantities[productId] || 1, [quantities]);
  const getMode = useCallback((productId: string): 'unit' | 'pack' => purchaseModes[productId] || 'unit', [purchaseModes]);

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

  const toggleMode = useCallback((productId: string) => {
    setPurchaseModes((prev) => ({
      ...prev,
      [productId]: prev[productId] === 'pack' ? 'unit' : 'pack',
    }));
    setQuantities((prev) => ({ ...prev, [productId]: 1 }));
  }, []);

  const handleAdd = useCallback(
    (product: Product) => {
      const mode = getMode(product.id);
      addToCart(product, quantities[product.id] || 1, mode);
      setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    },
    [addToCart, quantities, getMode]
  );

  // سعر الحبة الظاهر بناءً على وضع الشراء
  const getDisplayUnitPrice = useCallback((product: Product, mode: 'unit' | 'pack') => {
    if (mode === 'pack' && product.units_per_pack) {
      return product.pack_price ?? product.price;
    }
    return product.price;
  }, []);

  // سعر الكرتونة الكامل
  const getPackTotalPrice = useCallback((product: Product) => {
    if (!product.units_per_pack) return 0;
    const pricePerUnit = product.pack_price ?? product.price;
    return pricePerUnit * product.units_per_pack;
  }, []);

  // مبلغ التوفير عند شراء كرتونة كاملة
  const getSavingsPerPack = useCallback((product: Product) => {
    if (!product.units_per_pack || !product.pack_price) return 0;
    return (product.price - product.pack_price) * product.units_per_pack;
  }, []);

  return (
    <div dir={dir} className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb / back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group text-sm font-semibold"
      >
        <BackArrow className={`w-5 h-5 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
        <span>{t.catalog.backToHome}</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeCategoryName}</h1>
          <p className="text-slate-500 dark:text-zinc-500 text-sm mt-1">
            {loading ? '...' : `${filteredProducts.length} / ${products.length} ${t.home.productsCount}`}
          </p>
        </div>

        {/* Search in category */}
        {products.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none`} />
            <input
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              placeholder={t.catalog.searchInCat}
              className={`w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 rounded-xl ${
                isRTL ? 'pr-10 pl-9 text-right' : 'pl-10 pr-9 text-left'
              } py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm`}
            />
            {filterTerm && (
              <button
                onClick={() => setFilterTerm('')}
                className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Pills Filter Bar */}
      {categories.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-none flex items-center gap-2">
          {/* "All" button */}
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all flex items-center gap-2 ${
              selectedCatId === 'all'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-neon-sm scale-[1.02]'
                : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.common.all}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                selectedCatId === 'all'
                  ? 'bg-zinc-950/40 text-zinc-950 font-black'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
              }`}
            >
              {totalAllCount}
            </span>
          </button>

          {/* Individual Category buttons */}
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const isSelected = selectedCatId === cat.id;
            const count = counts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-neon-sm scale-[1.02]'
                    : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-zinc-950 font-bold' : 'text-emerald-500 dark:text-emerald-400'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-zinc-950/40 text-zinc-950 font-black'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-zinc-500">
          <PackageX className="w-12 h-12 mb-3 text-slate-400 dark:text-zinc-600" />
          <p>{t.catalog.noProducts}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <PackageX className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            {t.home.noSearchResults} "{filterTerm}"
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">{t.home.noSearchResultsDesc}</p>
          <button onClick={() => setFilterTerm('')} className="btn-primary text-xs">
            {t.common.refresh}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => {
            const qty = getQty(product.id);
            const mode = getMode(product.id);
            const hasPack = !!(product.units_per_pack && product.units_per_pack > 1);
            const packLabel = product.pack_label || t.common.cartonUnit;
            const unitPrice = getDisplayUnitPrice(product, mode);
            const packTotal = hasPack ? getPackTotalPrice(product) : 0;
            const savings = hasPack ? getSavingsPerPack(product) : 0;
            const lineTotal = mode === 'pack' ? packTotal * qty : unitPrice * qty;

            return (
              <div
                key={product.id}
                className="card p-5 flex flex-col bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 hover:border-emerald-500/40 dark:hover:border-zinc-700 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 dark:ring-white/5 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                {/* Product image placeholder */}
                <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 flex items-center justify-center mb-4">
                  <span className="text-4xl font-extrabold text-slate-400 dark:text-zinc-700">
                    {product.name.charAt(0)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Mode toggle */}
                {hasPack && (
                  <div className="flex items-center gap-1.5 mb-3 bg-slate-100 dark:bg-zinc-900/90 rounded-xl p-1 border border-slate-200 dark:border-zinc-800">
                    <button
                      onClick={() => mode === 'pack' && toggleMode(product.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'unit'
                          ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/30'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{t.catalog.buyUnit}</span>
                      <span className="text-[10px] font-normal opacity-70">
                        {formatDA(product.price, t.common.daCurrency)}
                      </span>
                    </button>
                    <button
                      onClick={() => mode === 'unit' && toggleMode(product.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'pack'
                          ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/30'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>{packLabel}</span>
                      {product.pack_price && product.pack_price < product.price && (
                        <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                          {formatDA(product.pack_price, t.common.daCurrency)}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Pack savings note */}
                {hasPack && mode === 'pack' && (
                  <div className="mb-3 space-y-1">
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg font-medium">
                      📦 1 {packLabel} = {product.units_per_pack} {product.unit} × {formatDA(unitPrice, t.common.daCurrency)} = <strong className="text-emerald-600 dark:text-emerald-400">{formatDA(packTotal, t.common.daCurrency)}</strong>
                    </p>
                    {savings > 0 && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
                        🎉 {t.catalog.packSavings}: {formatDA(savings, t.common.daCurrency)} / {packLabel}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <div>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {mode === 'pack'
                        ? formatDA(packTotal, t.common.daCurrency)
                        : formatDA(unitPrice, t.common.daCurrency)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {mode === 'pack' ? `${t.catalog.perPack} (${packLabel})` : `${t.catalog.perUnit} (${product.unit})`}
                    </p>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">{t.cart.summaryTitle}</p>
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
                      className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-semibold text-slate-900 dark:text-white min-w-[2.5rem] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => increment(product.id)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAdd(product)}
                    disabled={product.market_unavailable}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t.catalog.addToCart}
                  </button>
                </div>

                {product.market_unavailable ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-2">⛔ {t.catalog.outOfStock}</p>
                ) : product.stock > 0 ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-2">
                    {t.catalog.availableNow}: {product.stock} {product.unit}
                  </p>
                ) : (
                  <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-2">
                    ⚡ JIT ({t.catalog.availableNow})
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
