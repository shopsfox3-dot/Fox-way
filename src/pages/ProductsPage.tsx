import { useEffect, useState, useCallback } from 'react';
import { fetchProductsByCategory } from '@/lib/api';
import { formatDA } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import { ArrowRight, Loader2, Plus, Minus, ShoppingCart, PackageX } from 'lucide-react';

interface ProductsPageProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

export default function ProductsPage({ categoryId, categoryName, onBack }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addToCart } = useCart();
  const { profile } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetchProductsByCategory(categoryId, profile?.shop_type_id)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [categoryId, profile?.shop_type_id]);

  const getQty = (productId: string) => quantities[productId] || 1;

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
      addToCart(product, getQty(product.id));
      setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    },
    [addToCart, getQty]
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{categoryName}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? '...' : `${products.length} منتج متوفر`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <PackageX className="w-12 h-12 mb-3" />
          <p>لا توجد منتجات في هذا القسم حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => {
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
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    أضف للسلة
                  </button>
                </div>

                {product.stock > 0 ? (
                  <p className="text-xs text-green-600 mt-2">متوفر في المخزون: {product.stock}</p>
                ) : (
                  <p className="text-xs text-red-500 mt-2">غير متوفر حالياً</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
