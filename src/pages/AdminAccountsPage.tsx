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
  fetchAllProducts,
  fetchCategories,
  toggleProductMarketAvailability,
  updateProductPackInfo,
  fetchAdminCartDrafts,
} from '@/lib/api';
import type { Profile, ShopType, Wilaya, Commune, LoginAttempt, Product, Category, AbandonedCart } from '@/types';
import { formatDA } from '@/lib/format';
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
  Package,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

interface AdminAccountsPageProps {
  onBack: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'products' | 'abandoned_carts' | 'security_logs';

export default function AdminAccountsPage({ onBack }: AdminAccountsPageProps) {
  const { profile: currentAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [allCommunes, setAllCommunes] = useState<Commune[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  // تحرير معلومات الكرتونة لكل منتج
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [packForm, setPackForm] = useState<{ units: string; label: string; packPrice: string }>({ units: '', label: '', packPrice: '' });

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { ALL_COMMUNES } = await import('@/lib/algeria_data');
      setAllCommunes(ALL_COMMUNES);

      const [pData, stData, wData, laData, prodData, catData, draftData] = await Promise.all([
        fetchAdminProfiles('all'),
        fetchShopTypes(),
        fetchWilayas(),
        fetchLoginAttempts(),
        fetchAllProducts(),
        fetchCategories(),
        fetchAdminCartDrafts(),
      ]);

      setProfiles(pData);
      setShopTypes(stData);
      setWilayas(wData);
      setLoginAttempts(laData);
      setProducts(prodData);
      setCategories(catData);
      setAbandonedCarts(draftData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleToggleMarketAvailability = async (productId: string, currentUnavailable: boolean) => {
    setActionLoading(productId);
    try {
      const newUnavailable = !currentUnavailable;
      const success = await toggleProductMarketAvailability(productId, newUnavailable);
      if (success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, market_unavailable: newUnavailable } : p))
        );
        const msg = newUnavailable
          ? 'تم تعيين المنتج كـ "منقطع من السوق" وتجميد إضافته للسلة للعملاء'
          : 'تم إعادة إتاحة المنتج للطلب الفوري بنجاح';
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // فتح نموذج تحرير الكرتونة لمنتج معين
  const handleStartEditPack = (product: Product) => {
    setEditingPackId(product.id);
    setPackForm({
      units: product.units_per_pack ? String(product.units_per_pack) : '',
      label: product.pack_label || 'كرتونة',
      packPrice: product.pack_price ? String(product.pack_price) : '',
    });
  };

  // حفظ معلومات الكرتونة
  const handleSavePackInfo = async (productId: string) => {
    const units = parseInt(packForm.units);
    const unitsPerPack = !isNaN(units) && units > 1 ? units : null;
    const packLabel = packForm.label.trim() || 'كرتونة';
    const packPriceVal = parseFloat(packForm.packPrice);
    const packPrice = !isNaN(packPriceVal) && packPriceVal > 0 ? packPriceVal : null;

    setActionLoading(`pack-${productId}`);
    try {
      const success = await updateProductPackInfo(productId, unitsPerPack, unitsPerPack ? packLabel : null, unitsPerPack ? packPrice : null);
      if (success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, units_per_pack: unitsPerPack, pack_label: unitsPerPack ? packLabel : null, pack_price: unitsPerPack ? packPrice : null }
              : p
          )
        );
        setEditingPackId(null);
        setSuccessMessage(
          unitsPerPack
            ? `✅ تم ضبط "${packLabel}" = ${unitsPerPack} وحدة${packPrice ? ` بسعر حبة ${packPrice} دج` : ''}`
            : '✅ تم إلغاء خيار الكرتونة لهذا المنتج'
        );
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } finally {
      setActionLoading(null);
    }
  };


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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
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
          <p className="text-[11px] text-amber-600 mt-1">تنتظر المراجعة</p>
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
          <p className="text-[11px] text-emerald-600 mt-1">تتصفح وتطلب</p>
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
          <p className="text-[11px] text-red-600 mt-1">محظورة</p>
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'products'
              ? 'bg-teal-500/10 border-teal-500/40 shadow-md ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700">توفر المنتجات</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
          <p className="text-[11px] text-teal-600 mt-1">
            {products.filter((p) => p.market_unavailable).length > 0
              ? `${products.filter((p) => p.market_unavailable).length} منقطع من السوق`
              : 'متاح للطلب JIT'}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('abandoned_carts')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'abandoned_carts'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">سلات لم تكتمل</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{abandonedCarts.length}</p>
          <p className="text-[11px] text-amber-600 mt-1">زبائن انشغلوا</p>
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
          <p className="text-[11px] text-indigo-600 mt-1">محاولات مسجلة</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
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
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
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
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
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
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الكل</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'products'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>توفر المنتجات بالسوق</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'products'
                  ? 'bg-teal-700 text-white'
                  : products.filter((p) => p.market_unavailable).length > 0
                  ? 'bg-red-100 text-red-700 font-bold'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {products.filter((p) => p.market_unavailable).length > 0
                  ? `${products.filter((p) => p.market_unavailable).length} منقطع`
                  : products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('abandoned_carts')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'abandoned_carts'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>سلات لم تُرسل (متروكة)</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'abandoned_carts'
                  ? 'bg-amber-700 text-white'
                  : abandonedCarts.length > 0
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {abandonedCarts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security_logs')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'security_logs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>سجل الأمان</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'security_logs' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {loginAttempts.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'products'
                  ? 'بحث في المنتجات...'
                  : activeTab === 'security_logs'
                  ? 'بحث في سجل الدخول...'
                  : 'بحث بالاسم، الهاتف، الولاية...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-right"
            />
          </div>
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
      ) : activeTab === 'products' ? (
        /* Products Market Availability Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">مفتاح انقطاع وتوفر السلع في السوق (JIT & Market Outage)</h2>
              <p className="text-xs text-slate-500">
                يمكنك بنقرة واحدة إيقاف أي سلعة انقطعت من السوق لمنع طلبها، أو إتاحتها للتوريد الفوري عند الطلب
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold">
                إجمالي المنتجات: {products.length}
              </span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="font-bold text-slate-700">لا توجد منتجات مسجلة في قاعدة البيانات حالياً</p>
              <p className="text-xs text-slate-400 mt-1">عند إضافة منتجات ستظهر هنا للتحكم في توفرها بالسوق بنقرة زر</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products
                .filter((p) => {
                  if (!searchTerm.trim()) return true;
                  const t = searchTerm.toLowerCase();
                  return p.name.toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t);
                })
                .map((product) => {
                  const isActionBusy = actionLoading === product.id;
                  const cat = categories.find((c) => c.id === product.category_id);

                  return (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-right"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{product.name}</h3>
                          {cat && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {cat.name}
                            </span>
                          )}
                          <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                            {formatDA(product.price)} / {product.unit}
                          </span>
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs">
                          {product.market_unavailable ? (
                            <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>منقطع تماماً من السوق (الطلب معطل للعملاء)</span>
                            </span>
                          ) : product.stock > 0 ? (
                            <span className="text-xs text-emerald-600 font-medium">
                              متوفر بالمستودع: {product.stock} {product.unit}
                            </span>
                          ) : (
                            <span className="text-xs text-teal-600 font-medium">
                              رصيد المستودع (0) • توريد عند الطلب (JIT متاح)
                            </span>
                          )}
                        </div>

                        {/* معلومات الكرتونة */}
                        {editingPackId === product.id ? (
                          <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-xl flex flex-col gap-2">
                            <p className="text-xs font-bold text-teal-700">⚙️ ضبط معلومات الكرتونة</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500 block mb-0.5">عدد الحبات في الكرتونة</label>
                                <input
                                  type="number"
                                  min="2"
                                  value={packForm.units}
                                  onChange={e => setPackForm(f => ({ ...f, units: e.target.value }))}
                                  placeholder="مثال: 12"
                                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500 block mb-0.5">اسم الوحدة</label>
                                <input
                                  type="text"
                                  value={packForm.label}
                                  onChange={e => setPackForm(f => ({ ...f, label: e.target.value }))}
                                  placeholder="كرتونة / علبة / لوح"
                                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
                                />
                              </div>
                            </div>
                            {/* سعر الحبة عند الكرتونة */}
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">
                                سعر الحبة عند شراء الكرتونة — اتركه فارغاً إذا نفس سعر الحبة العادية
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={packForm.packPrice}
                                onChange={e => setPackForm(f => ({ ...f, packPrice: e.target.value }))}
                                placeholder={`مثال: لو سعر الحبة العادي ${product.price} دج، اكتب 95 هنا للتخفيض`}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
                              />
                              {packForm.packPrice && packForm.units && (
                                <p className="text-[10px] text-teal-600 mt-0.5">
                                  → الكرتونة = {(parseFloat(packForm.packPrice || '0') * parseInt(packForm.units || '0')).toFixed(0)} دج بدل {(product.price * parseInt(packForm.units || '0')).toFixed(0)} دج
                                  (توفير {((product.price - parseFloat(packForm.packPrice || '0')) * parseInt(packForm.units || '0')).toFixed(0)} دج)
                                </p>
                              )}
                            </div>
                            {/* أزرار الحفظ */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSavePackInfo(product.id)}
                                disabled={actionLoading === `pack-${product.id}`}
                                className="flex-1 bg-teal-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {actionLoading === `pack-${product.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                حفظ
                              </button>
                              <button
                                onClick={() => setPackForm(f => ({ ...f, units: '', packPrice: '' }))}
                                className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                                title="يمسح الكرتونة عند الحفظ"
                              >
                                إلغاء الكرتونة
                              </button>
                              <button
                                onClick={() => setEditingPackId(null)}
                                className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                              >
                                إغلاق
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {product.units_per_pack ? (
                              <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-lg font-medium">
                                📦 {product.pack_label || 'كرتونة'} = {product.units_per_pack} {product.unit}
                                {product.pack_price && product.pack_price < product.price ? (
                                  <span className="mr-1 text-emerald-600">
                                    • {product.pack_price} دج/ح → يوفّر {((product.price - product.pack_price) * product.units_per_pack).toFixed(0)} دج/كرتونة
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">لا يباع بالكرتونة (حبة فقط)</span>
                            )}
                            <button
                              onClick={() => handleStartEditPack(product)}
                              className="text-[11px] text-teal-600 hover:text-teal-800 underline"
                            >
                              تعديل
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Outage Toggle Button */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          disabled={isActionBusy}
                          onClick={() => handleToggleMarketAvailability(product.id, product.market_unavailable)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                            product.market_unavailable
                              ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-500/20'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                          }`}
                        >
                          {isActionBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : product.market_unavailable ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>
                            {product.market_unavailable
                              ? '⛔ منقطع (اضغط للإتاحة)'
                              : '✅ متاح بالسوق (اضغط للتعطيل)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : activeTab === 'abandoned_carts' ? (
        /* Abandoned Carts / Pending Drafts tab */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">سلات قيد الإعداد (زبائن بدأوا الطلب ولم يرسلوه)</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  هؤلاء تجار قاموا باختيار سلع وانشغلوا في محلاتهم — يمكنك الاتصال بهم أو مراسلتهم على واتساب لتذكيرهم وتأكيد طلبياتهم فوراً!
                </p>
              </div>
            </div>
            <button
              onClick={() => loadData(true)}
              className="btn-ghost p-2 rounded-xl text-slate-600 hover:text-teal-600 shrink-0"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {abandonedCarts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">لا توجد سلات متروكة حالياً</h3>
              <p className="text-xs text-slate-500">كل الزبائن إما أرسلوا طلباتهم أو سلاتهم فارغة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {abandonedCarts
                .filter((cart) => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  const p = cart.profile;
                  const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase() : '';
                  const phone = p?.phone || '';
                  return name.includes(term) || phone.includes(term);
                })
                .map((cart, idx) => {
                  const p = cart.profile;
                  const clientName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'تاجر بدون اسم' : 'حساب غير معروف';
                  const phone = p?.phone || '';
                  
                  // حساب إجمالي السلة
                  const cartTotal = cart.items.reduce((sum, it) => {
                    const isPack = it.purchase_mode === 'pack' && !!it.product.units_per_pack;
                    const pricePerUnit = isPack ? (it.product.pack_price ?? it.product.price) : it.product.price;
                    const unitsPerPack = it.product.units_per_pack ?? 1;
                    const linePrice = isPack ? pricePerUnit * unitsPerPack : pricePerUnit;
                    return sum + linePrice * it.quantity;
                  }, 0);

                  const totalItemsCount = cart.items.reduce((s, it) => s + it.quantity, 0);

                  // نص رسالة واتساب الجاهزة
                  const productsSummary = cart.items
                    .map(it => `• ${it.product.name} (${it.quantity} ${it.purchase_mode === 'pack' ? (it.product.pack_label || 'كرتونة') : it.product.unit})`)
                    .join('%0A');
                  const whatsappMessage = `السلام عليكم أخي ${clientName}، معك إدارة منصة Fox Way.%0A%0Aلاحظنا أنك بدأت تجهيز طلبية في التطبيق بقيمة *${cartTotal.toLocaleString()} دج* ولم تكمل إرسالها بعد:%0A${productsSummary}%0A%0Aهل تود تأكيدها وتحديد موعد التوصيل لمحلك؟ نحن في الخدمة! 🤝`;

                  return (
                    <div
                      key={cart.id}
                      className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div>
                        {/* Header: Name and Total */}
                        <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                              <span>{clientName}</span>
                              {p?.shop_type_id && (
                                <span className="text-[11px] font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {getShopTypeName(p.shop_type_id)}
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                {p ? `${getWilayaName(p.wilaya_code)} ${getCommuneName(p.commune_id)}` : 'غير محدد'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                آخر تحديث: {new Date(cart.updated_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-xs text-slate-400 block">قيمة السلة</span>
                            <span className="text-lg font-extrabold text-teal-600">{formatDA(cartTotal)}</span>
                          </div>
                        </div>

                        {/* Items in Cart */}
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <span>📦 السلع في السلة ({totalItemsCount}):</span>
                          </p>
                          <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                            {cart.items.map((it, i) => {
                              const isPack = it.purchase_mode === 'pack' && !!it.product.units_per_pack;
                              const label = isPack ? (it.product.pack_label || 'كرتونة') : it.product.unit;
                              return (
                                <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                                  <span className="truncate max-w-[65%] font-medium">
                                    • {it.product.name}
                                  </span>
                                  <span className="font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {it.quantity} {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Phone Call & WhatsApp */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        {phone ? (
                          <>
                            <a
                              href={`tel:${phone}`}
                              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>اتصال بالهاتف</span>
                            </a>

                            <a
                              href={`https://wa.me/213${phone.replace(/^0/, '')}?text=${whatsappMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                            >
                              <span>💬 تذكير بـ واتساب</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 text-center w-full">لا يوجد رقم هاتف مسجل</span>
                        )}
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
