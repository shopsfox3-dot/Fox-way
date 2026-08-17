import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { supabase } from '@/lib/supabase';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// مفتاح التخزين المؤقت في localStorage (كاحتياطي offline)
const CART_STORAGE_KEY = 'foxway_cart_items';

function loadCartFromStorage(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved) as CartItem[];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch { /* تجاهل */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ————————————————————————————————
  // مراقبة حالة تسجيل الدخول
  // ————————————————————————————————
  useEffect(() => {
    // جلب الجلسة الحالية عند أول تشغيل
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    // مراقبة تغيرات الجلسة (دخول / خروج)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // ————————————————————————————————
  // عند تسجيل الدخول: تحميل السلة من Supabase
  // ————————————————————————————————
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const { data } = await supabase
          .from('cart_drafts')
          .select('items')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          // السلة موجودة في السيرفر — استخدمها
          setItems(data.items as CartItem[]);
          saveCartToStorage(data.items as CartItem[]);
        } else {
          // لا توجد سلة بالسيرفر — جرب localStorage (سلة قديمة من نفس الجهاز)
          const local = loadCartFromStorage();
          if (local.length > 0) {
            setItems(local);
            // ارفعها للسيرفر فوراً
            await supabase.from('cart_drafts').upsert(
              { user_id: userId, items: local, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            );
          }
        }
      } catch { /* تجاهل أخطاء الشبكة */ }
    })();
  }, [userId]);

  // ————————————————————————————————
  // حفظ السلة: localStorage فوري + Supabase بعد 800ms (debounce)
  // ————————————————————————————————
  useEffect(() => {
    saveCartToStorage(items);

    if (!userId) return;

    // إلغاء أي حفظ معلق
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // حفظ في Supabase بعد 800ms من آخر تغيير (تجنب الضغط على API)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await supabase.from('cart_drafts').upsert(
          { user_id: userId, items, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      } catch { /* تجاهل أخطاء الشبكة */ }
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [items, userId]);

  // ————————————————————————————————
  // عمليات السلة
  // ————————————————————————————————
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* تجاهل */ }

    // حذف السلة من Supabase عند إرسال الطلب النهائي
    if (userId) {
      supabase.from('cart_drafts').delete().eq('user_id', userId).then(() => {});
    }
  }, [userId]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
