import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatDA } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  PackageX,
  ShoppingBag,
  Package,
  Box,
  Sparkles,
} from 'lucide-react';

interface CartPageProps {
  onBack: () => void;
}

export default function CartPage({ onBack }: CartPageProps) {
  const { items, updateQuantity, updateMode, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // حساب إجمالي التوفير في السلة عند الشراء بالكرتونة
  const totalSavings = items.reduce((acc, item) => {
    if (item.purchase_mode === 'pack' && item.product.units_per_pack && item.product.pack_price) {
      const savingsPerUnit = item.product.price - item.product.pack_price;
      if (savingsPerUnit > 0) {
        return acc + savingsPerUnit * item.product.units_per_pack * item.quantity;
      }
    }
    return acc;
  }, 0);

  const handlePlaceOrder = async () => {
    if (!session?.user || items.length === 0) return;

    // Only block if a product is marked as completely unavailable in the market
    const unavailableItems = items.filter((item) => item.product.market_unavailable);
    if (unavailableItems.length > 0) {
      setError(
        `المنتجات التالية منقطعة تماماً من السوق ولا يمكن إتمام الطلب: ${unavailableItems
          .map((i) => i.product.name)
          .join('، ')}`
      );
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: session.user.id,
          total: subtotal,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => {
        const isPack = item.purchase_mode === 'pack' && !!item.product.units_per_pack;
        const unitsPerPack = item.product.units_per_pack ?? 1;
        const pricePerUnit = isPack ? (item.product.pack_price ?? item.product.price) : item.product.price;
        const linePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;

        return {
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: linePrice,
          purchase_mode: item.purchase_mode,
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">تم إرسال طلبك بنجاح!</h2>
          <p className="text-slate-500 mb-6">
            سيتم التواصل معك لتأكيد الطلب وتحديد موعد التوصيل
          </p>
          <button onClick={onBack} className="btn-primary">
            متابعة التسوق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors mb-4"
      >
        <ArrowRight className="w-5 h-5" />
        <span>متابعة التسوق</span>
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-slate-900">سلة المشتريات</h1>
          {totalItems > 0 && (
            <span className="bg-teal-100 text-teal-700 text-sm font-semibold rounded-full px-3 py-1">
              {totalItems} عناصر
            </span>
          )}
        </div>

        {totalSavings > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>وفّرت {formatDA(totalSavings)} بفضل شراء الكراتين!</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageX className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">سلتك فارغة</h3>
          <p className="text-sm text-slate-500 mb-6">ابدأ بإضافة منتجات من الأقسام</p>
          <button onClick={onBack} className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            تصفح المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, index) => {
              const { product, quantity, purchase_mode } = item;
              const hasPack = !!(product.units_per_pack && product.units_per_pack > 1);
              const packLabel = product.pack_label || 'كرتونة';
              const isPack = purchase_mode === 'pack' && hasPack;

              // حساب سعر القطعة الواحدة حسب الوضع
              const pricePerUnit = isPack ? (product.pack_price ?? product.price) : product.price;
              const unitsPerPack = product.units_per_pack ?? 1;
              const unitLinePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;
              const lineTotal = unitLinePrice * quantity;
              const totalPieces = isPack ? quantity * unitsPerPack : quantity;

              return (
                <div
                  key={product.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms`, opacity: 0 }}
                >
                  {/* Image placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-slate-300">
                      {product.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{product.name}</h3>
                      {hasPack && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                          isPack ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isPack ? <Box className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          {isPack ? `بال${packLabel}` : 'بالحبة'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {isPack ? (
                        <>
                          <span className="font-semibold text-teal-700">{formatDA(unitLinePrice)}</span> لكل {packLabel}
                          {product.pack_price && product.pack_price < product.price && (
                            <span className="mr-1.5 text-[11px] text-emerald-600">({formatDA(product.pack_price)} / {product.unit})</span>
                          )}
                        </>
                      ) : (
                        <>{formatDA(product.price)} / {product.unit}</>
                      )}
                    </p>

                    {/* محول الوحدات التلقائي (Converter) */}
                    {hasPack && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {isPack ? (
                          <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                            🔄 المحول: {quantity} {packLabel} = <strong>{totalPieces} {product.unit}</strong>
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
                            🔄 المحول: {quantity} {product.unit} {(quantity >= unitsPerPack) ? `(يعادل ${(quantity / unitsPerPack).toFixed(1)} ${packLabel})` : ''}
                          </span>
                        )}

                        {/* زر التبديل السريع من السلة */}
                        <button
                          onClick={() => updateMode(product.id, isPack ? 'unit' : 'pack')}
                          className="text-[11px] text-teal-600 hover:text-teal-800 font-bold underline"
                        >
                          تحويل إلى {isPack ? 'حبات' : packLabel}
                        </button>
                      </div>
                    )}

                    {product.market_unavailable ? (
                      <span className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-semibold inline-block mt-1">
                        ⛔ منقطع من السوق حالياً
                      </span>
                    ) : product.stock <= 0 ? (
                      <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-medium inline-block mt-1">
                        ⚡ توريد عند الطلب (JIT)
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                        متوفر بالمستودع: {product.stock} {product.unit}
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-semibold text-slate-900 min-w-[2.5rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-left shrink-0 min-w-[80px]">
                      <p className="text-[10px] text-slate-400">المجموع</p>
                      <p className="font-bold text-teal-600 text-sm sm:text-base">{formatDA(lineTotal)}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 pt-2"
            >
              <Trash2 className="w-4 h-4" />
              إفراغ السلة
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-20">
              <h2 className="font-bold text-slate-900 mb-4">ملخص الطلب</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const hasPack = !!(item.product.units_per_pack && item.product.units_per_pack > 1);
                  const isPack = item.purchase_mode === 'pack' && hasPack;
                  const pricePerUnit = isPack ? (item.product.pack_price ?? item.product.price) : item.product.price;
                  const unitsPerPack = item.product.units_per_pack ?? 1;
                  const unitLinePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;
                  const itemTotal = unitLinePrice * item.quantity;
                  const label = isPack ? (item.product.pack_label || 'كرتونة') : item.product.unit;

                  return (
                    <div key={item.product.id} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-600 truncate max-w-[60%]">
                        {item.product.name} ({item.quantity} {label})
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatDA(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">عدد المنتجات</span>
                  <span className="font-medium">{totalItems}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>مجموع التوفير</span>
                    <span>-{formatDA(totalSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900">المجموع الكلي</span>
                  <span className="text-2xl font-bold text-teal-600">{formatDA(subtotal)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || items.length === 0}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                إرسال الطلب
              </button>

              <p className="text-xs text-slate-400 text-center mt-3">
                سيتم تأكيد الطلب عند التواصل معك
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
