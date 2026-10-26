import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDA } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
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
  const { t, language, isRTL, dir } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Total savings calculation
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
        `${t.cart.outOfStockWarning}: ${unavailableItems
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
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div dir={dir} className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-8 text-center bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl animate-scale-in ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm dark:shadow-neon-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.cart.orderSuccessTitle}</h2>
          <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">
            {t.cart.orderSuccessDesc}
          </p>
          <button onClick={onBack} className="btn-primary">
            {t.cart.backHomeBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group text-sm font-semibold"
      >
        <BackArrow className={`w-5 h-5 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
        <span>{t.cart.backToShopping}</span>
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t.cart.title}</h1>
          {totalItems > 0 && (
            <span className="bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full px-3 py-1">
              {totalItems} {t.home.productsCount}
            </span>
          )}
        </div>

        {totalSavings > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm dark:shadow-neon-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>{t.cart.savingsBadge} {formatDA(totalSavings, t.common.daCurrency)}!</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-zinc-600">
            <PackageX className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t.cart.emptyTitle}</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">{t.cart.emptyDesc}</p>
          <button onClick={onBack} className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            {t.cart.browseCatalog}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, index) => {
              const { product, quantity, purchase_mode } = item;
              const hasPack = !!(product.units_per_pack && product.units_per_pack > 1);
              const packLabel = product.pack_label || t.common.cartonUnit;
              const isPack = purchase_mode === 'pack' && hasPack;

              const pricePerUnit = isPack ? (product.pack_price ?? product.price) : product.price;
              const unitsPerPack = product.units_per_pack ?? 1;
              const unitLinePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;
              const lineTotal = unitLinePrice * quantity;
              const totalPieces = isPack ? quantity * unitsPerPack : quantity;

              return (
                <div
                  key={product.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl shadow-sm animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms`, opacity: 0 }}
                >
                  {/* Image placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-slate-400 dark:text-zinc-700">
                      {product.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{product.name}</h3>
                      {hasPack && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                          isPack ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                        }`}>
                          {isPack ? <Box className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          {isPack ? packLabel : t.cart.itemUnit}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {isPack ? (
                        <>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatDA(unitLinePrice, t.common.daCurrency)}
                          </span> / {packLabel}
                          {product.pack_price && product.pack_price < product.price && (
                            <span className="mx-1.5 text-[11px] text-emerald-600 dark:text-emerald-400/90 font-medium">
                              ({formatDA(product.pack_price, t.common.daCurrency)} / {product.unit})
                            </span>
                          )}
                        </>
                      ) : (
                        <>{formatDA(product.price, t.common.daCurrency)} / {product.unit}</>
                      )}
                    </p>

                    {/* Unit converter */}
                    {hasPack && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {isPack ? (
                          <span className="text-[11px] bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-lg font-medium">
                            🔄 {quantity} {packLabel} = <strong className="text-emerald-600 dark:text-emerald-400">{totalPieces} {product.unit}</strong>
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-lg font-medium">
                            🔄 {quantity} {product.unit} {(quantity >= unitsPerPack) ? `(${t.cart.savingsBadge} ${(quantity / unitsPerPack).toFixed(1)} ${packLabel})` : ''}
                          </span>
                        )}

                        {/* Fast toggle mode */}
                        <button
                          onClick={() => updateMode(product.id, isPack ? 'unit' : 'pack')}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline"
                        >
                          {isPack ? t.catalog.buyUnit : packLabel}
                        </button>
                      </div>
                    )}

                    {product.market_unavailable ? (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 rounded-md font-semibold inline-block mt-1">
                        ⛔ {t.catalog.outOfStock}
                      </span>
                    ) : product.stock <= 0 ? (
                      <span className="text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/30 px-2 py-0.5 rounded-md font-medium inline-block mt-1">
                        ⚡ JIT ({t.catalog.availableNow})
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mt-1">
                        {t.catalog.availableNow}: {product.stock} {product.unit}
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-zinc-800/80">
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-semibold text-slate-900 dark:text-white min-w-[2.5rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className={`${isRTL ? 'text-left' : 'text-right'} shrink-0 min-w-[80px]`}>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">{t.cart.summaryTitle}</p>
                      <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                        {formatDA(lineTotal, t.common.daCurrency)}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                      title={t.cart.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={clearCart}
              className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5 pt-2 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {t.cart.clearCart}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-20 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/90 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{t.cart.summaryTitle}</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const hasPack = !!(item.product.units_per_pack && item.product.units_per_pack > 1);
                  const isPack = item.purchase_mode === 'pack' && hasPack;
                  const pricePerUnit = isPack ? (item.product.pack_price ?? item.product.price) : item.product.price;
                  const unitsPerPack = item.product.units_per_pack ?? 1;
                  const unitLinePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;
                  const itemTotal = unitLinePrice * item.quantity;
                  const label = isPack ? (item.product.pack_label || t.common.cartonUnit) : item.product.unit;

                  return (
                    <div key={item.product.id} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-600 dark:text-zinc-400 truncate max-w-[60%]">
                        {item.product.name} ({item.quantity} {label})
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">
                        {formatDA(itemTotal, t.common.daCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-zinc-400">{t.cart.itemsSubtotal}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{totalItems}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>{t.cart.totalSavings}</span>
                    <span>-{formatDA(totalSavings, t.common.daCurrency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900 dark:text-white">{t.cart.totalToPay}</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatDA(subtotal, t.common.daCurrency)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
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
                {t.cart.placeOrderBtn}
              </button>

              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-3">
                {t.cart.orderSuccessDesc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
