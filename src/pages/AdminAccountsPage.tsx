import { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminProfiles,
  updateProfileStatus,
  fetchShopTypes,
  fetchWilayas,
  fetchLoginAttempts,
} from '@/lib/api';
import type { Profile, ShopType, Wilaya, LoginAttempt } from '@/types';
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
} from 'lucide-react';

interface AdminAccountsPageProps {
  onBack: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'security_logs';

export default function AdminAccountsPage({ onBack }: AdminAccountsPageProps) {
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

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
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

  // Helper mappings
  const getShopTypeName = (id: number | null) => {
    if (!id) return 'غير محدد';
    const found = shopTypes.find((s) => s.id === id);
    return found ? found.name : `نشاط #${id}`;
  };

  const getWilayaName = (code: string | null) => {
    if (!code) return 'غير محدد';
    const found = wilayas.find((w) => w.code === code);
    return found ? `${found.code} - ${found.name}` : code;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'غير معروف';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-DZ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
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
            <h2 className="font-bold text-slate-900 text-base">سجل محاولات تسجيل الدخول الفاشلة</h2>
            <span className="text-xs text-slate-500">آخر 50 محاولة</span>
          </div>

          {loginAttempts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p>لا توجد أي محاولات دخول فاشلة مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {loginAttempts.map((att) => (
                <div key={att.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{att.email}</p>
                    <p className="text-xs text-red-500 mt-0.5">{att.error_message || 'محاولة غير مصرح بها'}</p>
                    {att.user_agent && (
                      <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5" dir="ltr">{att.user_agent}</p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-500">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                      {att.status}
                    </span>
                    <span className="mt-1">{formatDate(att.attempted_at)}</span>
                  </div>
                </div>
              ))}
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

                const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.full_name || 'بدون اسم';

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
                      isPending
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

                          {p.role === 'admin' && (
                            <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                              مسؤول (Admin)
                            </span>
                          )}
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
                            href={`tel:${p.phone}`}
                            className="font-medium text-slate-800 hover:text-teal-600 transition-colors"
                            dir="ltr"
                          >
                            {p.phone || 'بدون هاتف'}
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
                          <span>{getWilayaName(p.wilaya_code)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isPending ? (
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
