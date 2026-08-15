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
} from 'lucide-react';

interface CartPageProps {
  onBack: () => void;
}

export default function CartPage({ onBack }: CartPageProps) {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (!session?.user || items.length === 0) return;

    // Check stock before placing order
    const outOfStock = items.filter((item) => item.product.stock === 0);
    if (outOfStock.length > 0) {
      setError(`المنتجات التالية غير متوفرة في المخزون: ${outOfStock.map((i) => i.product.name).join('، ')}`);
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

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

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

      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-slate-900">سلة المشتريات</h1>
        {totalItems > 0 && (
          <span className="bg-teal-100 text-teal-700 text-sm font-semibold rounded-full px-3 py-1">
            {totalItems} منتج
          </span>
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
            {items.map((item, index) => (
              <div
                key={item.product.id}
                className="card p-4 flex items-center gap-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms`, opacity: 0 }}
              >
                {/* Image placeholder */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-slate-300">
                    {item.product.name.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{item.product.name}</h3>
                  <p className="text-sm text-slate-500">
                    {formatDA(item.product.price)} / {item.product.unit}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-semibold text-slate-900 min-w-[2.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-2 hover:bg-slate-50 transition-colors text-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Line total */}
                <div className="text-left shrink-0 w-24">
                  <p className="text-xs text-slate-400">المجموع</p>
                  <p className="font-bold text-teal-600">{formatDA(item.product.price * item.quantity)}</p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              إفراغ السلة
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-20">
              <h2 className="font-bold text-slate-900 mb-4">ملخص الطلب</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate max-w-[60%]">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatDA(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">عدد المنتجات</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
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
