import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminProfiles,
  updateProfileStatus,
  fetchShopTypes,
  fetchWilayas,
  fetchLoginAttempts,
  deleteLoginAttempt,
  clearAllLoginAttempts,
} from '@/lib/api';
import type { Profile, ShopType, Wilaya, Commune, LoginAttempt } from '@/types';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  MapPin,
  Store,
  Calendar,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface AdminAccountsPageProps {
  onBack: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'security_logs';

export default function AdminAccountsPage({ onBack }: AdminAccountsPageProps) {
  const { profile: currentAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { ALL_COMMUNES } = await import('@/lib/algeria_data');
      setAllCommunes(ALL_COMMUNES);

      const [pData, stData, wData, laData] = await Promise.all([
        fetchAdminProfiles('all'),
        fetchShopTypes(),
        fetchWilayas(),
        fetchLoginAttempts(),
      ]);

      setProfiles(pData);
      setShopTypes(stData);
      setWilayas(wData);
      setLoginAttempts(laData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (profileId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    if (profileId === currentAdmin?.id) {
      setSuccessMessage('حماية الأمان: لا يمكنك تعديل أو حظر حسابك الحالي المسجل به');
      setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }

    setActionLoading(profileId);
    try {
      const success = await updateProfileStatus(profileId, newStatus);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: newStatus } : p))
        );
        const statusArabic = newStatus === 'approved' ? 'تفعيل وقبول' : newStatus === 'rejected' ? 'رفض' : 'تعليق';
        setSuccessMessage(`تم ${statusArabic} الحساب بنجاح`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    const ok = await deleteLoginAttempt(attemptId);
    if (ok) {
      setLoginAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    }
  };

  const handleClearAllAttempts = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في مسح جميع سجلات محاولات الدخول؟')) return;
    const ok = await clearAllLoginAttempts();
    if (ok) {
      setLoginAttempts([]);
      setSuccessMessage('تم مسح سجل محاولات الدخول بالكامل');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  // Helper mappings
  const getShopTypeName = (id: number | null) => {
    if (!id) return 'غير محدد';
    const found = shopTypes.find((s) => s.id === id);
    return found ? found.name : `نشاط #${id}`;
  };

  const formatPhone = (phone?: string | null) => {
    if (!phone) return 'بدون هاتف';
    let p = phone.trim().replace(/[^0-9]/g, '');
    if (p.startsWith('213')) p = '0' + p.slice(3);
    if (!p.startsWith('0') && p.length === 9) p = '0' + p;
    return p;
  };

  const [allCommunes, setAllCommunes] = useState<Commune[]>([]);

  const getWilayaName = (code: string | null) => {
    if (!code) return 'غير محدد';
    const found = wilayas.find((w) => w.code === code);
    return found ? `${found.code} - ${found.name}` : code;
  };

  const getCommuneName = (communeId?: number | null) => {
    if (!communeId) return '';
    const found = allCommunes.find((c) => c.id === communeId);
    return found ? ` / ${found.name}` : '';
  };

  const parseDeviceInfo = (ua?: string) => {
    if (!ua) return { text: 'جهاز غير معروف', icon: '💻' };
    
    let os = 'جهاز غير معروف';
    let icon = '💻';
    if (ua.includes('Windows')) { os = 'حاسوب ويندوز (Windows)'; icon = '💻'; }
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) { os = 'حاسوب ماك (Mac)'; icon = '💻'; }
    else if (ua.includes('Android')) { os = 'هاتف أندرويد (Android)'; icon = '📱'; }
    else if (ua.includes('iPhone')) { os = 'هاتف آيفون (iPhone)'; icon = '📱'; }
    else if (ua.includes('iPad')) { os = 'جهاز لوحي (iPad)'; icon = '📱'; }
    else if (ua.includes('Linux')) { os = 'حاسوب لينكس (Linux)'; icon = '💻'; }

    let browser = 'المتصفح';
    if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Chrome';
    else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    return { text: `${os} • متصفح ${browser}`, icon };
  };

  const formatDate24h = (dateStr?: string) => {
    if (!dateStr) return { full: 'غير معروف', relative: '' };
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - d.getTime());
      const diffMins = Math.floor(diffMs / (1000 * 60));
      let relative = '';
      if (diffMins < 1) relative = 'الآن';
      else if (diffMins < 60) relative = `منذ ${diffMins} دقيقة`;
      else if (diffMins < 1440) relative = `منذ ${Math.floor(diffMins / 60)} ساعة`;
      else relative = `منذ ${Math.floor(diffMins / 1440)} يوم`;

      return {
        full: `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`,
        relative,
      };
    } catch {
      return { full: dateStr, relative: '' };
    }
  };

  const formatDate = (dateStr?: string) => {
    return formatDate24h(dateStr).full;
  };

  // Counts
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;
  const approvedCount = profiles.filter((p) => p.status === 'approved').length;
  const rejectedCount = profiles.filter((p) => p.status === 'rejected').length;

  // Filtered list
  const filteredProfiles = profiles.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    if (!matchesTab) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.full_name || ''}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const wilaya = getWilayaName(p.wilaya_code).toLowerCase();
    const shop = getShopTypeName(p.shop_type_id).toLowerCase();

    return fullName.includes(term) || phone.includes(term) || wilaya.includes(term) || shop.includes(term);
  });

  if (currentAdmin && currentAdmin.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center shadow-lg animate-scale-in">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">غير مصرح لك بالدخول</h2>
        <p className="text-xs text-slate-500 mb-5">هذه اللوحة مخصصة لإدارة النظام فقط.</p>
        <button onClick={onBack} className="btn-primary w-full text-xs sm:text-sm">
          العودة للمتجر
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">لوحة تحكم الإدارة</h1>
              <p className="text-xs sm:text-sm text-slate-500">إدارة طلبات تسجيل العملاء والموافقة على الحسابات</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-slate-700 text-sm font-medium shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">طلبات معلقة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-amber-600 mt-1">تنتظر المراجعة والتفعيل</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">حسابات مفعلة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{approvedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-1">تتصفح الكتالوج وتطلب</p>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'rejected'
              ? 'bg-red-500/10 border-red-500/40 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-700">حسابات مرفوضة</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{rejectedCount}</p>
          <p className="text-[11px] text-red-600 mt-1">محظورة من الشراء</p>
        </div>

        <div
          onClick={() => setActiveTab('security_logs')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'security_logs'
              ? 'bg-indigo-500/10 border-indigo-500/40 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-700">سجل الأمان</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{loginAttempts.length}</p>
          <p className="text-[11px] text-indigo-600 mt-1">محاولات دخول مسجلة</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>المعلقة</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>المقبولة</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'approved' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>المرفوضة</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'rejected' ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الكل</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security_logs')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security_logs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>سجل الأمان</span>
            </button>
          </div>

          {/* Search bar */}
          {activeTab !== 'security_logs' && (
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، الهاتف، الولاية..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-right"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">جاري تحميل بيانات العملاء...</p>
        </div>
      ) : activeTab === 'security_logs' ? (
        /* Security logs tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">سجل محاولات تسجيل الدخول الفاشلة</h2>
              <span className="text-xs text-slate-500">إجمالي السجلات: {loginAttempts.length}</span>
            </div>

            {loginAttempts.length > 0 && (
              <button
                onClick={handleClearAllAttempts}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل بالكامل</span>
              </button>
            )}
          </div>

          {loginAttempts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p>لا توجد أي محاولات دخول فاشلة مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {loginAttempts.map((att) => {
                const device = parseDeviceInfo(att.user_agent);
                const timeData = formatDate24h(att.attempted_at);
                const statusLabel =
                  att.status === 'invalid_credentials'
                    ? 'بيانات خاطئة'
                    : att.status === 'blocked_unapproved'
                    ? 'حساب معلق'
                    : 'محاولة فاشلة';

                return (
                  <div
                    key={att.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{att.email}</span>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                          {statusLabel}
                        </span>
                      </div>

                      <p className="text-xs text-red-600 font-medium">
                        {att.error_message || 'تعذر تسجيل الدخول'}
                      </p>

                      {/* Attempted Password */}
                      {att.attempted_password ? (
                        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg w-fit text-amber-900">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-medium text-amber-700">كلمة السر المدخلة:</span>
                          <span className="font-mono font-bold text-xs" dir="ltr">
                            {revealedPasswords[att.id] ? att.attempted_password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(att.id)}
                            className="text-amber-700 hover:text-amber-900 transition-colors p-0.5"
                            title={revealedPasswords[att.id] ? 'إخفاء' : 'إظهار كلمة السر'}
                          >
                            {revealedPasswords[att.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : null}

                      {/* Device name */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg w-fit">
                        <span>{device.icon}</span>
                        <span className="font-medium">{device.text}</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="font-mono font-bold text-slate-700 text-xs sm:text-sm block" dir="ltr">
                          {timeData.full}
                        </span>
                        {timeData.relative && (
                          <span className="text-[11px] text-teal-600 font-semibold mt-0.5 inline-block">
                            {timeData.relative}
                          </span>
                        )}
                      </div>

                      {/* Delete item button */}
                      <button
                        onClick={() => handleDeleteAttempt(att.id)}
                        title="حذف هذا السجل"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Accounts list */
        <div>
          {filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">لا توجد حسابات تطابق الفلتر</h3>
              <p className="text-xs text-slate-500">
                {searchTerm ? 'جرّب البحث بكلمة أخرى' : 'لا يوجد عملاء مسجلين بهذه الفئة حالياً'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((p) => {
                const isPending = p.status === 'pending';
                const isApproved = p.status === 'approved';
                const isRejected = p.status === 'rejected';
                const isLoadingAction = actionLoading === p.id;
                const isSelf = !!currentAdmin?.id && p.id === currentAdmin.id;

                const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.full_name || 'بدون اسم';

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
                      isSelf
                        ? 'border-teal-400 bg-gradient-to-b from-teal-50/20 to-white shadow-md ring-2 ring-teal-500/20'
                        : isPending
                        ? 'border-amber-200 hover:border-amber-400 hover:shadow-md'
                        : isApproved
                        ? 'border-slate-200 hover:border-emerald-300'
                        : 'border-slate-200 hover:border-red-300 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top status & Role */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isPending && <Clock className="w-3.5 h-3.5" />}
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5" />}
                            {isPending ? 'طلب معلق' : isApproved ? 'حساب مفعّل' : 'حساب مرفوض'}
                          </span>

                          {isSelf ? (
                            <span className="bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-teal-300">
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              <span>حسابك الحالي (أنت) 👑</span>
                            </span>
                          ) : p.role === 'admin' ? (
                            <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                              مسؤول (Admin)
                            </span>
                          ) : null}
                        </div>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.created_at)}
                        </span>
                      </div>

                      {/* Client Name */}
                      <h3 className="font-bold text-slate-900 text-lg mb-2">{displayName}</h3>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl">
                        {/* Phone */}
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <a
                            href={`tel:${formatPhone(p.phone)}`}
                            className="font-medium text-slate-800 hover:text-teal-600 transition-colors"
                            dir="ltr"
                          >
                            {formatPhone(p.phone)}
                          </a>
                        </div>

                        {/* Business Type */}
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{getShopTypeName(p.shop_type_id)}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{getWilayaName(p.wilaya_code)}{getCommuneName(p.commune_id)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isSelf ? (
                        <div className="flex-1 py-2.5 px-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>حسابك الحالي النشط (محمي من الحظر والتعليق)</span>
                        </div>
                      ) : isPending ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(p.id, 'approved')}
                            disabled={isLoadingAction}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                          >
                            {isLoadingAction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            <span>قبول وتفعيل</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(p.id, 'rejected')}
                            disabled={isLoadingAction}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-red-200 transition-all disabled:opacity-50"
                          >
                            {isLoadingAction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                            <span>رفض</span>
                          </button>
                        </>
                      ) : isApproved ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(p.id, 'rejected')}
                            disabled={isLoadingAction}
                            className="flex-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>حظر الحساب</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(p.id, 'pending')}
                            disabled={isLoadingAction}
                            className="bg-slate-100 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 text-slate-600 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <span>تعليق مؤقت</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(p.id, 'approved')}
                          disabled={isLoadingAction}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>إعادة التفعيل والموافقة</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
