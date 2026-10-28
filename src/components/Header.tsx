import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, LogOut, MapPin, ShieldCheck, Globe, Check, Sun, Moon } from 'lucide-react';
import FoxLogo from '@/components/FoxLogo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

import { ALL_WILAYAS, WILAYA_LATIN_NAMES } from '@/lib/algeria_data';

interface HeaderProps {
  onNavigate: (page: 'home' | 'cart' | 'admin') => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const { language, setLanguage, languages, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [wilayaName, setWilayaName] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';

  // Close language menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (profile?.wilaya_code) {
      const raw = profile.wilaya_code.trim();
      const padded = raw.padStart(2, '0');
      const found = ALL_WILAYAS.find(
        (w) => w.code === raw || w.code === padded || String(w.id) === raw || w.name === raw
      );

      if (language !== 'ar') {
        const codeKey = found?.code || padded;
        if (WILAYA_LATIN_NAMES[codeKey]) {
          setWilayaName(WILAYA_LATIN_NAMES[codeKey]);
          return;
        }
      }

      setWilayaName(found ? found.name : raw);
    } else {
      setWilayaName(null);
    }
  }, [profile?.wilaya_code, language]);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-xl border-b border-slate-200/90 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 shrink-0 group text-start focus:outline-none"
        >
          <FoxLogo size="sm" />
        </button>

        {/* Location */}
        {wilayaName && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{wilayaName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
            title={isDark ? t.nav.themeLight : t.nav.themeDark}
            aria-label={isDark ? t.nav.themeLight : t.nav.themeDark}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
              title={t.nav.language}
              aria-label={t.nav.language}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs">{currentLangObj.flag}</span>
              <span className="hidden sm:inline text-xs">{currentLangObj.label}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute top-full mt-1.5 z-50 end-0 min-w-[150px] bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/90 rounded-2xl shadow-xl dark:shadow-2xl p-1.5 space-y-0.5 ring-1 ring-slate-950/5 dark:ring-white/10 animate-fade-in-up">
                {languages.map((l) => {
                  const isActive = l.code === language;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.flag}</span>
                        <span>{l.label}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => onNavigate(currentPage === 'admin' ? 'home' : 'admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentPage === 'admin'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-neon-sm'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{t.nav.adminDashboard}</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('cart')}
            className={`relative p-2.5 rounded-xl transition-all ${
              currentPage === 'cart'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-neon-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent'
            }`}
            aria-label={t.nav.cart}
            title={t.nav.cart}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -start-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-neon-sm">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onNavigate('home');
              signOut();
            }}
            className="p-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all"
            aria-label={t.common.logout}
            title={t.common.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

