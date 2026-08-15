import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWilayas, fetchCommunes, fetchShopTypes, upsertProfile, touchProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Wilaya, Commune, ShopType } from '@/types';
import {
  MapPin, Phone, KeyRound, ChevronDown, Loader2, Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2, Check
} from 'lucide-react';
import { GlassShell, DesignStyles } from '@/components/ui/DesignSystem';

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  icon: Icon,
  inputClasses
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  disabled?: boolean;
  icon?: React.ElementType;
  inputClasses: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`${inputClasses} flex items-center justify-between text-right cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className={`truncate ${selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full text-right px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  opt.id === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                }`}
              >
                <span>{opt.name}</span>
                {opt.id === value && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { refreshProfile, setDemoSession } = useAuth();
  
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
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchWilayas(), fetchShopTypes()])
      .then(([w, st]) => {
        setWilayas(w);
        setShopTypes(st);
      })
      .catch(() => setError('تعذر تحميل البيانات'));
  }, []);

  useEffect(() => {
    if (selectedWilaya) {
      setSelectedCommune('');
      fetchCommunes(selectedWilaya).then(setCommunes).catch(() => setCommunes([]));
    } else {
      setCommunes([]);
    }
  }, [selectedWilaya]);

  const fullPhone = () => (phone.startsWith('0') ? '+213' + phone.slice(1) : phone);

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

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // 1. Try real Supabase Authentication
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (!signInError) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await touchProfile(userData.user.id, fullPhone(), firstName.trim());
        }
        await refreshProfile();
        return;
      }
      
      // 2. Check registered accounts in persistent accounts registry
      const accountsJson = localStorage.getItem('foxway_registered_accounts');
      const registeredAccounts = accountsJson ? JSON.parse(accountsJson) : {};
      const userAcc = registeredAccounts[cleanEmail];

      if (userAcc && userAcc.password === password) {
        setDemoSession(userAcc.firstName || 'تاجر', userAcc.phone || fullPhone());
        return;
      }

      // If email is not registered or password doesn't match, strictly reject
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } catch {
      setError('تعذر تسجيل الدخول، يرجى التأكد من صحة بياناتك');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // 1. Register user in Supabase Auth & DB
      const { data } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });
      
      const userId = data?.user?.id || `user-${Date.now()}`;
      
      await upsertProfile(
        userId,
        fullPhone(),
        selectedWilaya,
        parseInt(selectedCommune, 10),
        parseInt(selectedShopType, 10),
        firstName.trim(),
        lastName.trim()
      );
      
      // 2. Register into persistent accounts registry
      const accountsJson = localStorage.getItem('foxway_registered_accounts');
      const registeredAccounts = accountsJson ? JSON.parse(accountsJson) : {};
      registeredAccounts[cleanEmail] = {
        email: cleanEmail,
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone()
      };
      localStorage.setItem('foxway_registered_accounts', JSON.stringify(registeredAccounts));
      
      // Log in as newly created merchant
      setDemoSession(firstName.trim() || 'تاجر', fullPhone());
    } catch {
      setDemoSession(firstName.trim() || 'تاجر', fullPhone());
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

  return (
    <GlassShell
      title="Fox Way"
      subtitle="المنصة الأذكى لتوزيع الجملة"
      maxWidth={mode === 'signin' ? "max-w-[360px] sm:max-w-[420px] md:max-w-[450px]" : "max-w-[340px] sm:max-w-[390px] md:max-w-[420px]"}
    >
      <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
        {mode === 'signin' ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-1.5">تسجيل الدخول</h2>
          <p className="text-sm text-slate-300 mb-5">مرحباً بك مجدداً في متجر الجملة</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClasses} !py-2.5 sm:!py-3 !px-3.5 sm:!px-4 !pr-10 text-xs sm:text-sm`}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} !py-2.5 sm:!py-3 !px-3.5 sm:!px-4 !pr-10 !pl-12 sm:!pl-14 text-xs sm:text-sm`}
                  dir="ltr"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs sm:text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={!canSubmit() || loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-4 py-3 sm:py-3.5 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 mt-5 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <KeyRound className="w-4.5 h-4.5" />}
            تسجيل الدخول
          </button>

          <p className="text-center text-xs sm:text-sm text-slate-400 mt-5">
            ليس لديك حساب بعد؟{' '}
            <button
              onClick={() => switchMode('signup')}
              className="font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              إنشاء حساب
            </button>
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">إنشاء حساب جديد</h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-4">انضم إلى شبكة توزيع Fox Way</p>

          <div className="space-y-2.5">
            {/* Row 1: Name & Surname */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelClasses}>الاسم</label>
                <div className="relative">
                  <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="الاسم"
                    className={`${inputClasses} !pr-8`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>اللقب</label>
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="اللقب"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelClasses}>البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    name="signup-email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputClasses} !pr-8`}
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="0612345678"
                    className={`${inputClasses} !pr-8`}
                    dir="ltr"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelClasses}>كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="signup-password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClasses} !pr-8 !pl-8`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>تأكيد كلمة المرور</label>
                <div className="relative">
                  {password !== '' && password === confirmPassword ? (
                    <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-scale-in" />
                  ) : (
                    <Lock className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${confirmPassword !== '' && password !== confirmPassword ? 'text-red-400' : 'text-slate-400'} pointer-events-none transition-colors`} />
                  )}
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClasses} !pr-8 !pl-8 transition-all duration-300 ${
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
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Wilaya & Commune */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelClasses}>الولاية</label>
                <CustomSelect
                  value={selectedWilaya}
                  onChange={setSelectedWilaya}
                  options={wilayas.map((w) => ({ id: w.code, name: `${w.code} - ${w.name}` }))}
                  placeholder="اختر الولاية"
                  icon={MapPin}
                  inputClasses={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>البلدية</label>
                <CustomSelect
                  value={selectedCommune}
                  onChange={setSelectedCommune}
                  options={communes.map((c) => ({ id: String(c.id), name: c.name }))}
                  placeholder="اختر البلدية"
                  disabled={!selectedWilaya}
                  icon={MapPin}
                  inputClasses={inputClasses}
                />
              </div>
            </div>

            {/* Row 5: Shop Type */}
            <div>
              <label className={labelClasses}>نوع النشاط (المحل)</label>
              <CustomSelect
                value={selectedShopType}
                onChange={setSelectedShopType}
                options={shopTypes.map((st) => ({ id: String(st.id), name: st.name }))}
                placeholder="اختر نشاطك التجاري"
                icon={Store}
                inputClasses={inputClasses}
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
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-4 py-2.5 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            إنشاء حساب
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            لديك حساب بالفعل؟{' '}
            <button
              onClick={() => switchMode('signin')}
              className="font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              تسجيل الدخول
            </button>
          </p>
        </>
      )}
      </form>
    </GlassShell>
  );
}
