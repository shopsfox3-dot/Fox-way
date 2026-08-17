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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb / back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors mb-4"
      >
        <ArrowRight className="w-5 h-5" />
        <span>العودة للأقسام</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{activeCategoryName}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '...' : `${filteredProducts.length} من إجمالي ${products.length} منتج`}
          </p>
        </div>

        {/* Search in category */}
        {products.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              placeholder="تصفية المنتجات هنا..."
              className="w-full bg-white border border-slate-200 focus:border-teal-500 rounded-xl pr-10 pl-9 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all text-right shadow-sm"
            />
            {filterTerm && (
              <button
                onClick={() => setFilterTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
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
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>جميع المنتجات</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                selectedCatId === 'all'
                  ? 'bg-teal-700/80 text-teal-100'
                  : 'bg-slate-100 text-slate-500'
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
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-100' : 'text-teal-600'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-teal-700/80 text-teal-100'
                      : 'bg-slate-100 text-slate-500'
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
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <PackageX className="w-12 h-12 mb-3" />
          <p>لا توجد منتجات في هذا القسم حالياً</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center bg-white rounded-2xl border border-slate-200">
          <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            لا توجد منتجات تطابق "{filterTerm}"
          </h3>
          <p className="text-xs text-slate-500 mb-4">جرّب البحث بكلمة أخرى</p>
          <button onClick={() => setFilterTerm('')} className="btn-primary text-xs">
            مسح التصفية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => {
            const qty = getQty(product.id);
            const lineTotal = product.price * qty;
            return (
              <div
                key={product.id}
                className="card p-5 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                {/* Product image placeholder */}
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-slate-300">
                    {product.name.charAt(0)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <div>
                    <p className="text-lg font-bold text-teal-600">{formatDA(product.price)}</p>
                    <p className="text-xs text-slate-400">للوحدة: {product.unit}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400">الإجمالي</p>
                    <p className="text-sm font-semibold text-slate-700">{formatDA(lineTotal)}</p>
                  </div>
                </div>

                {/* Quantity + add */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => decrement(product.id)}
                      className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-semibold text-slate-900 min-w-[2.5rem] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => increment(product.id)}
                      className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
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
                  <p className="text-xs text-red-500 font-medium mt-2">⛔ غير متوفر حالياً (منقطع من السوق)</p>
                ) : product.stock > 0 ? (
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    متوفر بالمستودع: {product.stock} {product.unit}
                  </p>
                ) : (
                  <p className="text-xs text-teal-600 font-medium mt-2">
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
