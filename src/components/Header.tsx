import { useState, useEffect } from 'react';
import { ShoppingCart, Truck, LogOut, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  onNavigate: (page: 'home' | 'cart' | 'admin') => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const [wilayaName, setWilayaName] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (profile?.wilaya_code) {
      import('@/lib/algeria_data').then(({ ALL_WILAYAS }) => {
        const padded = profile.wilaya_code.padStart(2, '0');
        const local = ALL_WILAYAS.find(
          (w) => w.code === profile.wilaya_code || w.code === padded || String(w.id) === profile.wilaya_code
        );
        if (local) setWilayaName(local.name);
        else setWilayaName(profile.wilaya_code);
      });
    } else {
      setWilayaName(null);
    }
  }, [profile?.wilaya_code]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 hidden sm:block">متجر التوزيع</span>
        </button>

        {/* Location */}
        {wilayaName && (
          <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>{wilayaName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => onNavigate(currentPage === 'admin' ? 'home' : 'admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentPage === 'admin'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>لوحة الأدمن</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('cart')}
            className={`relative p-2.5 rounded-xl transition-colors ${
              currentPage === 'cart'
                ? 'bg-teal-50 text-teal-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="السلة"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -left-1 bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onNavigate('home');
              signOut();
            }}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
