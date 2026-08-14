import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWilayas, fetchCommunes, fetchShopTypes, upsertProfile, touchProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Wilaya, Commune, ShopType } from '@/types';
import {
  MapPin, Phone, KeyRound, ChevronDown, Loader2, Store, User, Mail, Lock, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { GlassShell, DesignStyles } from '@/components/ui/DesignSystem';

export default function LoginPage() {
  const { refreshProfile } = useAuth();
  
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        // Just touch the profile to update last_login
        await touchProfile(userData.user.id, fullPhone(), firstName.trim());
      }
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Sign Up user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw new Error(signUpError.message || 'فشل إنشاء الحساب');
      
      // 2. Insert Profile data if user is created successfully
      if (data.user) {
        await upsertProfile(
          data.user.id,
          fullPhone(),
          selectedWilaya,
          parseInt(selectedCommune, 10),
          parseInt(selectedShopType, 10),
          firstName.trim(),
          lastName.trim()
        );
      }
      
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب');
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
      const elements = Array.from(form.elements) as HTMLElement[];
      const index = elements.indexOf(target);
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
    <GlassShell title="Fox Way" subtitle="المنصة الأذكى لتوزيع الجملة">
      <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
        {mode === 'signin' ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
          <p className="text-sm text-slate-300 mb-6">مرحباً بك مجدداً في متجر الجملة</p>

          <div className="space-y-5">
            <div>
              <label className={labelClasses}>البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClasses} pr-10`}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-10 pl-10`}
                  dir="ltr"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={!canSubmit() || loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-4 py-3 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            تسجيل الدخول
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            ليس لديك حساب بعد؟{' '}
            <button
              onClick={() => switchMode('signup')}
              className="font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              إنشاء حساب تاجر
            </button>
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
          <p className="text-sm text-slate-300 mb-6">انضم إلى شبكة توزيع Fox Way</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>الاسم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="الاسم"
                    className={`${inputClasses} pr-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>اللقب</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="اللقب"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClasses} pr-10`}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-10 pl-10`}
                  dir="ltr"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClasses}>تأكيد كلمة المرور</label>
              <div className="relative">
                {password !== '' && password === confirmPassword ? (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-scale-in" />
                ) : (
                  <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${confirmPassword !== '' && password !== confirmPassword ? 'text-red-400' : 'text-slate-400'} pointer-events-none transition-colors`} />
                )}
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-10 pl-10 transition-all duration-300 ${
                    password !== '' && password === confirmPassword 
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-500/5' 
                      : confirmPassword !== '' && password !== confirmPassword 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' 
                      : ''
                  }`}
                  dir="ltr"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClasses}>رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="06 12 34 56 78"
                  className={`${inputClasses} pr-10`}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>الولاية</label>
                <div className="relative">
                  <select
                    value={selectedWilaya}
                    onChange={(e) => setSelectedWilaya(e.target.value)}
                    className={`${inputClasses} appearance-none pr-10 pl-3`}
                  >
                    <option value="">اختر الولاية</option>
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClasses}>البلدية</label>
                <div className="relative">
                  <select
                    value={selectedCommune}
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    disabled={!selectedWilaya}
                    className={`${inputClasses} appearance-none pr-10 pl-3 disabled:opacity-50`}
                  >
                    <option value="">اختر البلدية</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>نوع النشاط (المحل)</label>
              <div className="relative">
                <Store className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedShopType}
                  onChange={(e) => setSelectedShopType(e.target.value)}
                  className={`${inputClasses} appearance-none pr-10 pl-10`}
                >
                  <option value="">اختر نشاطك التجاري</option>
                  {shopTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSignUp}
            disabled={!canSubmit() || loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-4 py-3 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            إنشاء حساب
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
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
