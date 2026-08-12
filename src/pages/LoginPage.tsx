import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWilayas, fetchCommunes, fetchShopTypes, upsertProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Wilaya, Commune, ShopType } from '@/types';
import {
  Truck,
  MapPin,
  Phone,
  KeyRound,
  ChevronDown,
  Loader2,
  Store,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react';

export default function LoginPage() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedShopType, setSelectedShopType] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');

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

  const canSendOtp = () => {
    if (mode === 'signin') return firstName.trim() !== '' && phone.length >= 9;
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      phone.length >= 9 &&
      !!selectedWilaya &&
      !!selectedCommune &&
      !!selectedShopType
    );
  };

  const handleSendOtp = useCallback(async () => {
    if (!canSendOtp()) return;
    setLoading(true);
    setError('');
    setInfo('');
    setDevCode('');
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phone-auth`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'send', phone: fullPhone() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الرمز');
      setStep('otp');
      setInfo('تم إرسال رمز التحقق إلى رقمك');
      if (data.code) setDevCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, firstName, lastName, phone, selectedWilaya, selectedCommune, selectedShopType]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp) return;
    setLoading(true);
    setError('');
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phone-auth`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'verify', phone: fullPhone(), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز غير صحيح');

      // Sign in with the email/password returned by the edge function
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw new Error('فشل تسجيل الدخول');

      // For sign-up, save the full profile
      if (mode === 'signup') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await upsertProfile(
            userData.user.id,
            fullPhone(),
            selectedWilaya,
            parseInt(selectedCommune, 10),
            parseInt(selectedShopType, 10),
            firstName.trim(),
            lastName.trim()
          );
        }
      } else {
        // For sign-in, just touch the phone
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await upsertProfile(
            userData.user.id,
            fullPhone(),
            '',
            0,
            undefined,
            firstName.trim(),
            undefined
          );
        }
      }

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    otp,
    phone,
    mode,
    firstName,
    lastName,
    selectedWilaya,
    selectedCommune,
    selectedShopType,
    refreshProfile,
  ]);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setStep('details');
    setError('');
    setInfo('');
    setOtp('');
    setDevCode('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setSelectedWilaya('');
    setSelectedCommune('');
    setSelectedShopType('');
  };

  // ============ OTP STEP ============
  if (step === 'otp') {
    return (
      <Shell>
        <div className="card p-6 animate-scale-in">
          <h2 className="text-lg font-bold mb-1">رمز التحقق</h2>
          <p className="text-sm text-slate-500 mb-6">
            أدخل الرمز المرسل إلى{' '}
            <span dir="ltr" className="font-semibold text-slate-700">
              {phone}
            </span>
          </p>

          {devCode && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                رمز التحقق التجريبي:{' '}
                <span dir="ltr" className="font-bold tracking-wider">{devCode}</span>
              </span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              رمز التحقق (OTP)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              className="input-field text-center text-2xl tracking-[0.5em] font-bold"
              dir="ltr"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
          </div>

          {info && !devCode && (
            <div className="mb-4 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-700">
              {info}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={!otp || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            تأكيد الرمز
          </button>

          <button
            onClick={() => {
              setStep('details');
              setOtp('');
              setError('');
              setInfo('');
              setDevCode('');
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
        </div>
      </Shell>
    );
  }

  // ============ DETAILS STEP ============
  return (
    <Shell>
      <div className="card p-6 animate-scale-in">
        {mode === 'signin' ? (
          <>
            <h2 className="text-lg font-bold mb-1">تسجيل الدخول</h2>
            <p className="text-sm text-slate-500 mb-6">أدخل اسمك ورقم هاتفك</p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="input-field pr-10"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="06 12 34 56 78"
                  className="input-field pr-10"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={!canSendOtp() || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              إرسال رمز التحقق
            </button>

            <p className="text-center text-sm text-slate-500 mt-4">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => switchMode('signup')}
                className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                إنشاء حساب
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-1">إنشاء حساب جديد</h2>
            <p className="text-sm text-slate-500 mb-6">سجل بيانات محلك للبدء بالطلب</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="الاسم"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">اللقب</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="اللقب"
                  className="input-field"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="06 12 34 56 78"
                  className="input-field pr-10"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">الولاية</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="input-field appearance-none pr-10"
                >
                  <option value="">اختر الولاية</option>
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">البلدية</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  disabled={!selectedWilaya}
                  className="input-field appearance-none pr-10 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">اختر البلدية</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Shop type — dropdown like wilaya/commune */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">نوع المحل</label>
              <div className="relative">
                <Store className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedShopType}
                  onChange={(e) => setSelectedShopType(e.target.value)}
                  className="input-field appearance-none pr-10"
                >
                  <option value="">اختر نوع المحل</option>
                  {shopTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={!canSendOtp() || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              إرسال رمز التحقق
            </button>

            <p className="text-center text-sm text-slate-500 mt-4">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => switchMode('signin')}
                className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                تسجيل الدخول
              </button>
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 text-sm">
        <Store className="w-4 h-4" />
        <span>منصة توزيع بالجملة</span>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">متجر التوزيع</h1>
          <p className="text-slate-400 text-sm mt-1">بيع بالجملة بين التاجر والعملاء</p>
        </div>
        {children}
      </div>
    </div>
  );
}
