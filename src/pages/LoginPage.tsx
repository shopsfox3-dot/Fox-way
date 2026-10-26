import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWilayas, fetchCommunes, fetchShopTypes, upsertProfile, logFailedLogin } from '@/lib/api';
import { WILAYA_LATIN_NAMES, getShopTypeDisplayName, transliterateAlgerianName } from '@/lib/algeria_data';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Wilaya, Commune, ShopType } from '@/types';
import {
  MapPin, Phone, KeyRound, ChevronDown, Loader2, Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2, Check, Globe, Sun, Moon
} from 'lucide-react';
import { GlassShell, DesignStyles } from '@/components/ui/DesignSystem';

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  icon: Icon,
  inputClasses,
  searchPlaceholder,
  noResultsText,
  isRTL = true,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  disabled?: boolean;
  icon?: React.ElementType;
  inputClasses: string;
  searchPlaceholder: string;
  noResultsText: string;
  isRTL?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((o) => o.id === value);

  const filtered = search.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase().trim()))
    : options;

  return (
    <div className="relative" dir={isRTL ? 'rtl' : 'ltr'}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setSearch('');
          setOpen(!open);
        }}
        className={`${inputClasses} flex items-center justify-between ${
          isRTL ? 'text-right !pr-9 !pl-7' : 'text-left !pl-9 !pr-7'
        } appearance-none disabled:opacity-50 text-ellipsis overflow-hidden whitespace-nowrap`}
      >
        <span className={selectedOption ? "text-slate-900 dark:text-white font-medium truncate" : "text-slate-400 font-normal truncate"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        {Icon && (
          <Icon className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
        )}
        <ChevronDown className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`absolute z-50 right-0 left-0 bottom-full mb-1 max-h-52 flex flex-col bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/90 rounded-xl shadow-xl dark:shadow-2xl p-1.5 ${
              isRTL ? 'text-right' : 'text-left'
            } ring-1 ring-slate-950/5 dark:ring-white/5`}
          >
            {options.length > 5 && (
              <div className="p-1 mb-1 border-b border-slate-200 dark:border-zinc-800">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full bg-slate-100 dark:bg-zinc-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-xs rounded-lg px-2.5 py-1.5 outline-none border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                  autoFocus
                />
              </div>
            )}
            <div className="overflow-y-auto max-h-36 select-dropdown-scroll space-y-0.5">
              {filtered.length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-400 dark:text-zinc-500">{noResultsText}</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      value === opt.id ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {value === opt.id && <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage({ initialError }: { initialError?: string } = {}) {
  const { refreshProfile } = useAuth();
  const { t, language, setLanguage, languages, isRTL, dir } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  
  // App modes
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Forms Data
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState(''); // Used as contact info only, no OTP
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedShopType, setSelectedShopType] = useState('');
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    Promise.all([fetchWilayas(), fetchShopTypes()])
      .then(([w, st]) => {
        setWilayas(w);
        setShopTypes(st);
      })
      .catch(() => setError(t.common.error));
  }, [t.common.error]);

  useEffect(() => {
    if (selectedWilaya) {
      setSelectedCommune('');
      fetchCommunes(selectedWilaya).then(setCommunes).catch(() => setCommunes([]));
    } else {
      setCommunes([]);
    }
  }, [selectedWilaya]);

  const cleanPhone = () => {
    let p = phone.trim().replace(/[^0-9]/g, '');
    if (p.startsWith('213')) p = '0' + p.slice(3);
    if (!p.startsWith('0') && p.length === 9) p = '0' + p;
    return p;
  };

  const canSubmit = () => {
    if (mode === 'signin') return email.trim() !== '' && password.trim() !== '';
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      password.trim() !== '' &&
      password === confirmPassword &&
      phone.length === 10 &&
      !!selectedWilaya &&
      !!selectedCommune &&
      !!selectedShopType
    );
  };

  /**
   * ترجمة رسائل خطأ Supabase بحسب لغة الواجهة الحالية
   */
  const translateSupabaseError = (message: string): string => {
    const msg = message.toLowerCase();
    if (msg.includes('for security purposes') || (msg.includes('after') && msg.includes('second'))) {
      const match = message.match(/(\d+)\s*second/);
      const seconds = match ? match[1] : '30';
      if (language === 'fr') return `Pour des raisons de sécurité, veuillez patienter ${seconds} secondes`;
      if (language === 'en') return `For security reasons, please wait ${seconds} seconds before trying again`;
      return `لأسباب أمنية، يرجى الانتظار ${seconds} ثانية قبل المحاولة مجدداً`;
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return t.auth.errorInvalidCredentials;
    }
    if (msg.includes('email already registered') || msg.includes('user already registered')) {
      return t.auth.errorEmailRegistered;
    }
    if (msg.includes('password should be at least')) {
      return t.auth.errorPasswordLength;
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return t.auth.errorTooManyRequests;
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return t.auth.errorNetwork;
    }
    return message;
  };

  const handleSignIn = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('just_registered');
    }
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (signInError) {
        logFailedLogin(cleanEmail, signInError.message, 'invalid_credentials', password);
        setError(translateSupabaseError(signInError.message) || t.auth.errorInvalidCredentials);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role, is_activated')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && profile.status !== 'approved' && profile.role !== 'admin') {
          logFailedLogin(cleanEmail, 'حساب غير معتمد حاول الدخول', 'blocked_unapproved');
          await supabase.auth.signOut();
          if (profile.status === 'rejected') {
            setError(t.auth.errorRejectedByAdmin);
          } else if (profile.is_activated) {
            setError(t.auth.errorSuspendedByAdmin);
          } else {
            setError(t.auth.errorUnapprovedNew);
          }
          return;
        }

        await refreshProfile();
      }
    } catch (err) {
      logFailedLogin(email.toLowerCase().trim(), err instanceof Error ? err.message : 'Unknown signin error', 'system_error', password);
      setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            phone: cleanPhone(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            wilaya_code: selectedWilaya,
            commune_id: selectedCommune,
            shop_type_id: selectedShopType,
          },
        },
      });
      
      if (signUpError) {
        setError(translateSupabaseError(signUpError.message) || t.common.error);
        return;
      }
      
      if (data?.user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('just_registered', 'true');
        }
        await upsertProfile(
          data.user.id,
          cleanPhone(),
          selectedWilaya,
          parseInt(selectedCommune, 10),
          parseInt(selectedShopType, 10),
          firstName.trim(),
          lastName.trim()
        );
        if (data.session) {
          await refreshProfile();
        } else {
          setMode('signin');
          setError(t.auth.pendingDesc);
        }
      }
    } catch {
      setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPhone('');
    setSelectedWilaya('');
    setSelectedCommune('');
    setSelectedShopType('');
  };

  const inputClasses = DesignStyles.input;
  const labelClasses = DesignStyles.label;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') return;
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement | HTMLButtonElement)[];
      const index = elements.indexOf(target as HTMLInputElement);
      if (index > -1) {
        let nextIndex = index + 1;
        while (nextIndex < elements.length && (elements[nextIndex].disabled || elements[nextIndex].tabIndex === -1)) {
          nextIndex++;
        }
        if (elements[nextIndex]) elements[nextIndex].focus();
      }
    }
  };

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <div dir={dir} className="w-full flex justify-center">
      <GlassShell
        title={t.nav.brandName}
        subtitle={t.nav.brandSub}
        maxWidth={mode === 'signin' ? 'max-w-[340px] sm:max-w-[390px] md:max-w-[420px]' : 'max-w-[330px] sm:max-w-[380px] md:max-w-[420px]'}
      >
        {/* Card Controls: Theme Toggle & Language Switcher */}
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
            title={isDark ? t.nav.themeLight : t.nav.themeDark}
            aria-label={isDark ? t.nav.themeLight : t.nav.themeDark}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
            >
              <Globe className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>{currentLangObj.flag}</span>
              <span>{currentLangObj.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            </button>

            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute top-full end-0 mt-1 z-50 min-w-[130px] bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl dark:shadow-2xl p-1 space-y-0.5 ring-1 ring-slate-950/5 dark:ring-white/10">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        l.code === language
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {l.code === language && <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
          {mode === 'signin' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">{t.auth.loginTitle}</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">{t.auth.loginSubtitle}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">{t.auth.email}</label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-zinc-500 pointer-events-none`} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className={`${inputClasses} !py-2.5 sm:!py-3 ${isRTL ? '!pr-11 !pl-4 text-right' : '!pl-11 !pr-4 text-left'} text-xs sm:text-sm`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">{t.auth.password}</label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-zinc-500 pointer-events-none`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className={`${inputClasses} !py-2.5 sm:!py-3 ${isRTL ? '!pr-11 !pl-11 text-right' : '!pl-11 !pr-11 text-left'} text-xs sm:text-sm`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-1`}
                    title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs sm:text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={!canSubmit() || loading}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 font-extrabold rounded-xl px-4 py-3 sm:py-3.5 shadow-neon-sm hover:shadow-neon-emerald hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 mt-5 flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide"
            >
              {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <KeyRound className="w-4.5 h-4.5" />}
              {t.auth.signInBtn}
            </button>

            <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-5">
              {t.auth.noAccountPrompt}{' '}
              <button
                onClick={() => switchMode('signup')}
                className="font-bold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
              >
                {t.auth.createAccountLink}
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{t.auth.createAccountTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-4">{t.auth.createAccountSubtitle}</p>

            <div className="space-y-2.5">
              {/* Row 1: Name & Surname */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClasses}>{t.auth.firstName}</label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t.auth.firstName}
                      className={`${inputClasses} ${isRTL ? '!pr-9 !pl-3 text-right' : '!pl-9 !pr-3 text-left'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>{t.auth.lastName}</label>
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.auth.lastName}
                    className={`${inputClasses} ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClasses}>{t.auth.email}</label>
                  <div className="relative">
                    <Mail className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
                    <input
                      type="email"
                      name="signup-email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.auth.emailPlaceholder}
                      className={`${inputClasses} ${isRTL ? '!pr-9 !pl-3 text-right' : '!pl-9 !pr-3 text-left'}`}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>{t.auth.phone}</label>
                  <div className="relative">
                    <Phone className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder={t.auth.phonePlaceholder}
                      className={`${inputClasses} ${isRTL ? '!pr-9 !pl-3 text-right' : '!pl-9 !pr-3 text-left'}`}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClasses}>{t.auth.password}</label>
                  <div className="relative">
                    <Lock className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="signup-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className={`${inputClasses} ${isRTL ? '!pr-9 !pl-9 text-right' : '!pl-9 !pr-9 text-left'}`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>{t.auth.confirmPassword}</label>
                  <div className="relative">
                    {password !== '' && password === confirmPassword ? (
                      <CheckCircle2 className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-scale-in`} />
                    ) : (
                      <Lock className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 ${confirmPassword !== '' && password !== confirmPassword ? 'text-red-400' : 'text-slate-400'} pointer-events-none transition-colors`} />
                    )}
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      className={`${inputClasses} ${isRTL ? '!pr-9 !pl-9 text-right' : '!pl-9 !pr-9 text-left'} transition-all duration-300 ${
                        password !== '' && password === confirmPassword 
                          ? '!border-emerald-500/60 focus:!border-emerald-500 focus:!ring-2 focus:!ring-emerald-500/30 bg-emerald-500/10' 
                          : confirmPassword !== '' && password !== confirmPassword 
                          ? '!border-red-500/60 focus:!border-red-500 focus:!ring-2 focus:!ring-red-500/30 bg-red-500/10' 
                          : ''
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Wilaya & Commune */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClasses}>{t.auth.wilaya}</label>
                  <CustomSelect
                    value={selectedWilaya}
                    onChange={setSelectedWilaya}
                    options={wilayas.map((w) => {
                      const codePadded = w.code.padStart(2, '0');
                      const latin = WILAYA_LATIN_NAMES[codePadded] || w.name;
                      const displayName = language !== 'ar' ? `${codePadded} - ${latin}` : `${codePadded} - ${w.name}`;
                      return { id: w.code, name: displayName };
                    })}
                    placeholder={t.auth.selectWilaya}
                    icon={MapPin}
                    inputClasses={inputClasses}
                    searchPlaceholder={t.auth.searchPlaceholder}
                    noResultsText={t.auth.noResults}
                    isRTL={isRTL}
                  />
                </div>
                <div>
                  <label className={labelClasses}>{t.auth.commune}</label>
                  <CustomSelect
                    value={selectedCommune}
                    onChange={setSelectedCommune}
                    options={communes.map((c) => ({
                      id: String(c.id),
                      name: language !== 'ar' ? transliterateAlgerianName(c.name) : c.name
                    }))}
                    placeholder={t.auth.selectCommune}
                    disabled={!selectedWilaya}
                    icon={MapPin}
                    inputClasses={inputClasses}
                    searchPlaceholder={t.auth.searchPlaceholder}
                    noResultsText={t.auth.noResults}
                    isRTL={isRTL}
                  />
                </div>
              </div>

              {/* Row 5: Shop Type */}
              <div>
                <label className={labelClasses}>{t.auth.shopType}</label>
                <CustomSelect
                  value={selectedShopType}
                  onChange={setSelectedShopType}
                  options={shopTypes.map((st) => ({
                    id: String(st.id),
                    name: getShopTypeDisplayName(st, language)
                  }))}
                  placeholder={t.auth.selectShopType}
                  icon={Store}
                  inputClasses={inputClasses}
                  searchPlaceholder={t.auth.searchPlaceholder}
                  noResultsText={t.auth.noResults}
                  isRTL={isRTL}
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSignUp}
              disabled={!canSubmit() || loading}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 font-extrabold rounded-xl px-4 py-2.5 shadow-neon-sm hover:shadow-neon-emerald hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wide"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {t.auth.signUpBtn}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-zinc-400 mt-4">
              {t.auth.haveAccountPrompt}{' '}
              <button
                onClick={() => switchMode('signin')}
                className="font-bold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
              >
                {t.auth.signInLink}
              </button>
            </p>
          </>
        )}
        </form>
      </GlassShell>
    </div>
  );
}
