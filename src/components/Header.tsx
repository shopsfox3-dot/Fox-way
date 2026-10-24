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
    <header className="sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-neon-sm ring-1 ring-white/10 group-hover:brightness-110 transition-all">
            <Truck className="w-5 h-5 text-zinc-950 font-black" />
          </div>
          <span className="font-extrabold text-white text-base tracking-tight hidden sm:block">
            Fox <span className="text-emerald-400">Way</span>
          </span>
        </button>

        {/* Location */}
        {wilayaName && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
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
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-neon-sm'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>لوحة الأدمن</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('cart')}
            className={`relative p-2.5 rounded-xl transition-all ${
              currentPage === 'cart'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
            aria-label="السلة"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -left-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-neon-sm">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onNavigate('home');
              signOut();
            }}
            className="p-2.5 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
