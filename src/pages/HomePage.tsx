import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchCategories, fetchProductCountByCategory, searchAllProducts } from '@/lib/api';
import { getCategoryIcon } from '@/components/CategoryIcon';
import { useCart } from '@/context/CartContext';
import { formatDA } from '@/lib/format';
import type { Category, Product } from '@/types';
import {
  ShoppingBasket,
  Loader2,
  ArrowLeft,
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-teal-600 to-teal-500 p-8 md:p-12 mb-8 animate-fade-in-up">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            أهلاً بك في متجر التوزيع
          </h1>
          <p className="text-teal-50 text-sm md:text-base mb-6 max-w-md">
            اطلب منتجاتك بالجملة مباشرة من التاجر بأسعار منافسة وتوصيل سريع
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <Truck className="w-4 h-4" />
              <span>توصيل لكل الولايات</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>جودة مضمونة</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>أسعار الجملة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="relative mb-8">
        <div className="relative flex items-center shadow-sm">
          <Search className="absolute right-4 w-5 h-5 text-teal-600 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن أي منتج أو قسم (مثال: زيت، سكر، منظفات، قهوة...)"
            className="w-full bg-white border-2 border-slate-200 focus:border-teal-500 rounded-2xl pr-12 pl-12 py-3.5 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all text-right shadow-sm"
          />
          {searching ? (
            <Loader2 className="absolute left-4 w-5 h-5 text-teal-600 animate-spin" />
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="مسح البحث"
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
              <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
                <span>الأقسام المطابقة ({filteredCategories.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id, cat.name)}
                      className="p-3 bg-white rounded-xl border border-teal-100 hover:border-teal-400 hover:shadow-sm transition-all flex items-center gap-2.5 text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
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
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                نتائج البحث عن "{searchTerm}"
              </h2>
              <span className="text-xs sm:text-sm text-slate-500">
                {searchResults.length} منتج
              </span>
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : searchResults.length === 0 && filteredCategories.length === 0 ? (
              <div className="card p-12 text-center bg-white rounded-2xl border border-slate-200">
                <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  لم يتم العثور على أي منتج يطابق "{searchTerm}"
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  تأكد من كتابة الاسم بشكل صحيح أو جرب البحث بكلمة عامة أكثر
                </p>
                <button onClick={() => setSearchTerm('')} className="btn-primary text-xs">
                  مسح البحث والعودة للأقسام
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
                      className="card p-5 flex flex-col bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all duration-300"
                    >
                      {/* Product image placeholder */}
                      <div className="w-full h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-slate-300">
                          {product.name.charAt(0)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-slate-500 mb-3 line-clamp-2">
                          {product.description}
                        </p>
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
                          <span className="px-3 font-semibold text-slate-900 min-w-[2.5rem] text-center text-xs sm:text-sm">
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
                          disabled={product.stock === 0}
                          className="flex-1 btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          أضف للسلة
                        </button>
                      </div>

                      {product.stock > 0 ? (
                        <p className="text-xs text-emerald-600 font-medium mt-2">
                          متوفر في المخزون: {product.stock}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 font-medium mt-2">غير متوفر حالياً</p>
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
            <h2 className="text-xl font-bold text-slate-900">أقسام المنتجات</h2>
            <span className="text-sm text-slate-500">{categories.length} أقسام</span>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {categories.map((cat, index) => {
                const Icon = getCategoryIcon(cat.icon);
                const count = counts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id, cat.name)}
                    className="card p-5 text-right group hover:shadow-md hover:border-teal-200 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors duration-300">
                        <Icon className="w-7 h-7 text-teal-600" />
                      </div>
                      <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:-translate-x-1 transition-all duration-300" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{cat.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <ShoppingBasket className="w-3.5 h-3.5" />
                      {count} منتج
                    </p>
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
