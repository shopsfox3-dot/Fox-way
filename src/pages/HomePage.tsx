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
      {/* Hero banner - Higgsfield Luxury Dark */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-[#121215] to-[#141418] border border-zinc-800/90 shadow-2xl p-8 md:p-12 mb-8 animate-fade-in-up ring-1 ring-white/5">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full filter blur-[90px] -translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-teal-500/10 rounded-full filter blur-[80px] translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3 shadow-neon-sm">
            <span>منصة الجملة الذكية</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
            أهلاً بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Fox Way</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mb-6 max-w-md">
            اطلب منتجاتك بالجملة مباشرة من التاجر بأسعار منافسة وتوصيل فوري خلال 48 ساعة
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 rounded-xl px-4 py-2 text-zinc-200 text-xs sm:text-sm">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>توصيل لكل الولايات</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 rounded-xl px-4 py-2 text-zinc-200 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>جودة مضمونة</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 rounded-xl px-4 py-2 text-zinc-200 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>سعر الجملة المباشر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="relative mb-8">
        <div className="relative flex items-center">
          <Search className="absolute right-4 w-5 h-5 text-emerald-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن أي منتج أو قسم (مثال: زيت، سكر، منظفات، قهوة...)"
            className="w-full bg-[#121215] border border-zinc-800 focus:border-emerald-500 rounded-2xl pr-12 pl-12 py-3.5 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-right shadow-lg ring-1 ring-white/5"
          />
          {searching ? (
            <Loader2 className="absolute left-4 w-5 h-5 text-emerald-400 animate-spin" />
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-4 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
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
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                <span>الأقسام المطابقة ({filteredCategories.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id, cat.name)}
                      className="p-3 bg-[#121215] rounded-xl border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/40 transition-all flex items-center gap-2.5 text-right ring-1 ring-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-zinc-200 text-xs sm:text-sm truncate">
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
              <h2 className="text-lg sm:text-xl font-bold text-white">
                نتائج البحث عن "{searchTerm}"
              </h2>
              <span className="text-xs sm:text-sm text-zinc-400">
                {searchResults.length} منتج
              </span>
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-16 bg-[#121215] rounded-2xl border border-zinc-800">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : searchResults.length === 0 && filteredCategories.length === 0 ? (
              <div className="card p-12 text-center bg-[#121215] rounded-2xl border border-zinc-800">
                <PackageX className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base mb-1">
                  لم يتم العثور على أي منتج يطابق "{searchTerm}"
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
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
                      className="card p-5 flex flex-col bg-[#121215] rounded-2xl border border-zinc-800/80 hover:border-zinc-700 hover:shadow-2xl transition-all duration-300 ring-1 ring-white/5"
                    >
                      {/* Product image placeholder */}
                      <div className="w-full h-32 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center mb-4">
                        <span className="text-4xl font-extrabold text-zinc-700">
                          {product.name.charAt(0)}
                        </span>
                      </div>

                      <h3 className="font-bold text-white mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-zinc-400 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4 mt-auto">
                        <div>
                          <p className="text-lg font-extrabold text-emerald-400">{formatDA(product.price)}</p>
                          <p className="text-xs text-zinc-500">للوحدة: {product.unit}</p>
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
                          <span className="px-3 font-semibold text-white min-w-[2.5rem] text-center text-xs sm:text-sm">
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
                          className="flex-1 btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      ) : (
        /* Normal Categories Grid */
        <div>
          {/* Section title */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">أقسام المنتجات</h2>
              <span className="text-xs sm:text-sm text-zinc-400">{categories.length} أقسام متوفرة</span>
            </div>

            <button
              onClick={() => onSelectCategory('all', 'جميع المنتجات')}
              className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>تصفح كل المنتجات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
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
                    className="card p-5 text-right group hover:border-emerald-500/50 hover:shadow-neon-sm bg-[#121215] border border-zinc-800/80 transition-all duration-300 animate-fade-in-up ring-1 ring-white/5"
                    style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all duration-300">
                        <Icon className="w-7 h-7 text-emerald-400" />
                      </div>
                      <ArrowLeft className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all duration-300" />
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">{cat.name}</h3>
                    <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                      <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400/70" />
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
