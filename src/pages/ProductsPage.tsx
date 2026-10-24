import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchProductsByCategory, fetchCategories, fetchProductCountByCategory } from '@/lib/api';
import { getCategoryIcon } from '@/components/CategoryIcon';
import { formatDA } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import type { Product, Category } from '@/types';
import {
  ArrowRight,
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
    if (selectedCatId === 'all') return 'جميع المنتجات';
    const found = categories.find((c) => c.id === selectedCatId);
    return found ? found.name : initialCategoryName;
  }, [selectedCatId, categories, initialCategoryName]);

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
    // إعادة الكمية لـ 1 عند التبديل
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
      return product.pack_price ?? product.price; // سعر الحبة عند الكرتونة
    }
    return product.price;
  }, []);

  // سعر الكرتونة الكامل
  const getPackTotalPrice = useCallback((product: Product) => {
    if (!product.units_per_pack) return 0;
    const pricePerUnit = product.pack_price ?? product.price;
    return pricePerUnit * product.units_per_pack;
  }, []);

  // مبلغ التوفير عند شراء كرتونة كاملة (مقارنةً بسعر الحبة العادي)
  const getSavingsPerPack = useCallback((product: Product) => {
    if (!product.units_per_pack || !product.pack_price) return 0;
    return (product.price - product.pack_price) * product.units_per_pack;
  }, []);


  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb / back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors mb-4 group text-sm font-semibold"
      >
        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>العودة للأقسام</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{activeCategoryName}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {loading ? '...' : `${filteredProducts.length} من إجمالي ${products.length} منتج`}
          </p>
        </div>

        {/* Search in category */}
        {products.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              placeholder="تصفية المنتجات هنا..."
              className="w-full bg-[#121215] border border-zinc-800 focus:border-emerald-500 rounded-xl pr-10 pl-9 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-right shadow-sm"
            />
            {filterTerm && (
              <button
                onClick={() => setFilterTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
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
                : 'bg-[#121215] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>جميع المنتجات</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                selectedCatId === 'all'
                  ? 'bg-zinc-950/40 text-zinc-950 font-black'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
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
                    : 'bg-[#121215] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-zinc-950 font-bold' : 'text-emerald-400'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-zinc-950/40 text-zinc-950 font-black'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
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
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <PackageX className="w-12 h-12 mb-3 text-zinc-600" />
          <p>لا توجد منتجات في هذا القسم حالياً</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center bg-[#121215] rounded-2xl border border-zinc-800">
          <PackageX className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base mb-1">
            لا توجد منتجات تطابق "{filterTerm}"
          </h3>
          <p className="text-xs text-zinc-400 mb-4">جرّب البحث بكلمة أخرى</p>
          <button onClick={() => setFilterTerm('')} className="btn-primary text-xs">
            مسح التصفية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => {
            const qty = getQty(product.id);
            const mode = getMode(product.id);
            const hasPack = !!(product.units_per_pack && product.units_per_pack > 1);
            const packLabel = product.pack_label || 'كرتونة';
            const unitPrice = getDisplayUnitPrice(product, mode);
            const packTotal = hasPack ? getPackTotalPrice(product) : 0;
            const savings = hasPack ? getSavingsPerPack(product) : 0;
            // الإجمالي في بطاقة المنتج
            const lineTotal = mode === 'pack'
              ? packTotal * qty
              : unitPrice * qty;

            return (
              <div
                key={product.id}
                className="card p-5 flex flex-col bg-[#121215] rounded-2xl border border-zinc-800/80 hover:border-zinc-700 hover:shadow-2xl transition-all duration-300 ring-1 ring-white/5 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                {/* Product image placeholder */}
                <div className="w-full h-32 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center mb-4">
                  <span className="text-4xl font-extrabold text-zinc-700">
                    {product.name.charAt(0)}
                  </span>
                </div>

                <h3 className="font-bold text-white mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* زر التبديل حبة/كرتونة */}
                {hasPack && (
                  <div className="flex items-center gap-1.5 mb-3 bg-zinc-900/90 rounded-xl p-1 border border-zinc-800">
                    <button
                      onClick={() => mode === 'pack' && toggleMode(product.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'unit'
                          ? 'bg-[#18181b] text-emerald-400 shadow-sm border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>بالحبة</span>
                      <span className="text-[10px] font-normal opacity-70">{formatDA(product.price)}</span>
                    </button>
                    <button
                      onClick={() => mode === 'unit' && toggleMode(product.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'pack'
                          ? 'bg-[#18181b] text-emerald-400 shadow-sm border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>بالـ{packLabel}</span>
                      {product.pack_price && product.pack_price < product.price && (
                        <span className="text-[10px] font-normal text-emerald-400">{formatDA(product.pack_price)}/ح</span>
                      )}
                    </button>
                  </div>
                )}

                {/* توضيح الكرتونة + شارة التوفير */}
                {hasPack && mode === 'pack' && (
                  <div className="mb-3 space-y-1">
                    <p className="text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg font-medium">
                      📦 {packLabel} واحدة = {product.units_per_pack} {product.unit} × {formatDA(unitPrice)} = <strong className="text-emerald-400">{formatDA(packTotal)}</strong>
                    </p>
                    {savings > 0 && (
                      <p className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
                        🎉 توفّر {formatDA(savings)} لكل {packLabel} مقارنةً بالحبة!
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <div>
                    <p className="text-lg font-extrabold text-emerald-400">
                      {mode === 'pack' ? formatDA(packTotal) : formatDA(unitPrice)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {mode === 'pack' ? `لكل ${packLabel}` : `للـ${product.unit}`}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-zinc-500">الإجمالي</p>
                    <p className="text-sm font-semibold text-zinc-300">{formatDA(lineTotal)}</p>
                  </div>
                </div>

                {/* Quantity + add */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    <button
                      onClick={() => decrement(product.id)}
                      className="p-2 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-semibold text-white min-w-[2.5rem] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => increment(product.id)}
                      className="p-2 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
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
                    أضف للسلة
                  </button>
                </div>

                {product.market_unavailable ? (
                  <p className="text-xs text-red-400 font-medium mt-2">⛔ غير متوفر حالياً (منقطع من السوق)</p>
                ) : product.stock > 0 ? (
                  <p className="text-xs text-emerald-400 font-medium mt-2">
                    متوفر بالمستودع: {product.stock} {product.unit}
                  </p>
                ) : (
                  <p className="text-xs text-teal-400 font-medium mt-2">
                    ⚡ توريد عند الطلب (JIT متاح)
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
