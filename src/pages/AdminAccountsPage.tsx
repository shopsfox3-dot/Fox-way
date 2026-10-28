import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import {
  fetchAdminProfiles,
  updateProfileStatus,
  deleteUserAccount,
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
import { WILAYA_LATIN_NAMES, getShopTypeDisplayName, transliterateAlgerianName } from '@/lib/algeria_data';
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
  ArrowLeft,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Package,
  AlertTriangle,
  ShoppingBag,
  MoreVertical,
  Mail,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import CategoryManager from '@/components/admin/CategoryManager';

interface AdminAccountsPageProps {
  onBack: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'categories' | 'products' | 'abandoned_carts' | 'security_logs';

export default function AdminAccountsPage({ onBack }: AdminAccountsPageProps) {
  const { profile: currentAdmin } = useAuth();
  const { t, language, isRTL, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

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

  // نافذة تأكيد مسح السجلات
  const [clearLogsModalOpen, setClearLogsModalOpen] = useState(false);

  // نافذة تأكيد حذف الحساب نهائياً بنمط GitHub
  const [deleteModalProfile, setDeleteModalProfile] = useState<Profile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeMenuProfileId, setActiveMenuProfileId] = useState<string | null>(null);

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

  const handleDeleteAccountConfirm = async () => {
    if (!deleteModalProfile) return;
    setIsDeletingAccount(true);
    try {
      const res = await deleteUserAccount(deleteModalProfile.id);
      if (res.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== deleteModalProfile.id));
        setSuccessMessage(`تم حذف حساب (${deleteModalProfile.email || deleteModalProfile.full_name || 'المستخدم'}) نهائياً بنجاح`);
        setDeleteModalProfile(null);
        setDeleteConfirmText('');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        alert(res.error || 'تعذر حذف الحساب');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    const ok = await deleteLoginAttempt(attemptId);
    if (ok) {
      setLoginAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    }
  };

  const handleClearAllAttempts = () => {
    setClearLogsModalOpen(true);
  };

  const confirmClearLogs = async () => {
    setClearLogsModalOpen(false);
    const ok = await clearAllLoginAttempts();
    if (ok) {
      setLoginAttempts([]);
      setSuccessMessage('تم مسح سجل محاولات الدخول بالكامل');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };


  // Helper mappings
  const getShopTypeName = (id: number | null) => {
    if (!id) return t.common.none;
    const found = shopTypes.find((s) => s.id === id);
    if (!found) return `#${id}`;
    return getShopTypeDisplayName(found, language);
  };

  const formatPhone = (phone?: string | null) => {
    if (!phone) return t.common.none;
    let p = phone.trim().replace(/[^0-9]/g, '');
    if (p.startsWith('213')) p = '0' + p.slice(3);
    if (!p.startsWith('0') && p.length === 9) p = '0' + p;
    return p;
  };

  const getWilayaName = (code: string | null) => {
    if (!code) return t.common.none;
    const raw = code.trim();
    const padded = raw.padStart(2, '0');
    if (language !== 'ar') {
      if (WILAYA_LATIN_NAMES[padded]) return `${padded} - ${WILAYA_LATIN_NAMES[padded]}`;
      const foundWilaya = wilayas.find(w => w.name === raw || w.code === raw || w.code === padded);
      if (foundWilaya && WILAYA_LATIN_NAMES[foundWilaya.code]) {
        return `${foundWilaya.code} - ${WILAYA_LATIN_NAMES[foundWilaya.code]}`;
      }
    }
    const found = wilayas.find((w) => w.code === raw || w.code === padded || w.name === raw);
    return found ? `${found.code} - ${found.name}` : raw;
  };

  const getCommuneName = (communeId?: number | null) => {
    if (!communeId) return '';
    const found = allCommunes.find((c) => c.id === communeId);
    if (!found) return '';
    const name = language !== 'ar' ? transliterateAlgerianName(found.name) : found.name;
    return ` / ${name}`;
  };

  const parseDeviceInfo = (ua?: string) => {
    if (!ua) return { text: language === 'ar' ? 'جهاز غير معروف' : language === 'fr' ? 'Appareil inconnu' : 'Unknown Device', icon: '💻' };
    
    let os = language === 'ar' ? 'جهاز' : 'Device';
    let icon = '💻';
    if (ua.includes('Windows')) { os = 'Windows PC'; icon = '💻'; }
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) { os = 'Mac'; icon = '💻'; }
    else if (ua.includes('Android')) { os = 'Android Phone'; icon = '📱'; }
    else if (ua.includes('iPhone')) { os = 'iPhone'; icon = '📱'; }
    else if (ua.includes('iPad')) { os = 'iPad'; icon = '📱'; }
    else if (ua.includes('Linux')) { os = 'Linux PC'; icon = '💻'; }

    let browser = language === 'ar' ? 'المتصفح' : 'Browser';
    if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Chrome';
    else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    return { text: `${os} • ${browser}`, icon };
  };

  const formatDate24h = (dateStr?: string) => {
    if (!dateStr) return { full: t.common.none, relative: '' };
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
      if (diffMins < 1) {
        relative = t.admin.securityLogsTab.timeAgoJustNow;
      } else if (diffMins < 60) {
        relative = language === 'ar' ? `منذ ${diffMins} دقيقة` : language === 'fr' ? `il y a ${diffMins} min` : `${diffMins}m ago`;
      } else if (diffMins < 1440) {
        const hrs = Math.floor(diffMins / 60);
        relative = language === 'ar' ? `منذ ${hrs} ساعة` : language === 'fr' ? `il y a ${hrs}h` : `${hrs}h ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        relative = language === 'ar' ? `منذ ${days} يوم` : language === 'fr' ? `il y a ${days}j` : `${days}d ago`;
      }

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

    const email = (p.email || '').toLowerCase();

    return (
      fullName.includes(term) ||
      phone.includes(term) ||
      wilaya.includes(term) ||
      shop.includes(term) ||
      email.includes(term)
    );
  });

  if (currentAdmin && currentAdmin.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#121215] rounded-3xl border border-red-500/30 text-center shadow-2xl ring-1 ring-white/5 animate-scale-in">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          {language === 'ar' ? 'غير مصرح لك بالدخول' : language === 'fr' ? 'Accès non autorisé' : 'Access Unauthorized'}
        </h2>
        <p className="text-xs text-zinc-400 mb-5">
          {language === 'ar' ? 'هذه اللوحة مخصصة لإدارة النظام فقط.' : language === 'fr' ? 'Ce tableau de bord est réservé aux administrateurs.' : 'This dashboard is reserved for administrators only.'}
        </p>
        <button onClick={onBack} className="btn-primary w-full text-xs sm:text-sm">
          {t.admin.backToStore}
        </button>
      </div>
    );
  }

  return (
    <div dir={dir} className="max-w-6xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2 text-sm font-semibold group"
          >
            <BackArrow className={`w-4 h-4 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
            <span>{t.admin.backToStore}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm dark:shadow-neon-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t.admin.dashboardTitle}</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">{t.admin.tabs.all}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 rounded-xl text-slate-700 dark:text-zinc-200 text-sm font-medium shadow-sm transition-all ring-1 ring-slate-900/5 dark:ring-white/5"
            title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span className="text-xs font-bold hidden sm:inline">
              {theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
            </span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 rounded-xl text-slate-700 dark:text-zinc-200 text-sm font-medium shadow-sm transition-all disabled:opacity-50 ring-1 ring-slate-900/5 dark:ring-white/5"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-sm flex items-center gap-3 shadow-sm dark:shadow-neon-sm ring-1 ring-emerald-500/20 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Stats Cards - Higgsfield Carbon & Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        <div
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'pending'
              ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-amber-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t.admin.stats.pendingTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{pendingCount}</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1">{t.admin.stats.pendingSub}</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t.admin.stats.approvedTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{approvedCount}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-1">{t.admin.stats.approvedSub}</p>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'rejected'
              ? 'bg-rose-50 dark:bg-red-500/15 border-rose-300 dark:border-red-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-red-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-red-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700 dark:text-red-400">{t.admin.stats.rejectedTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-red-500/15 border border-rose-300 dark:border-red-500/30 flex items-center justify-center text-rose-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{rejectedCount}</p>
          <p className="text-[11px] text-rose-600 dark:text-red-400/80 mt-1">{t.admin.stats.rejectedSub}</p>
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'products'
              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t.admin.stats.productsTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{products.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-1">
            {products.filter((p) => p.market_unavailable).length > 0
              ? `${products.filter((p) => p.market_unavailable).length} ${t.admin.stats.productsOutageSub}`
              : t.admin.stats.productsJitSub}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('abandoned_carts')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'abandoned_carts'
              ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-amber-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t.admin.stats.cartsTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{abandonedCarts.length}</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1">{t.admin.stats.cartsSub}</p>
        </div>

        <div
          onClick={() => setActiveTab('security_logs')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${
            activeTab === 'security_logs'
              ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/50 shadow-sm dark:shadow-neon-sm ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 hover:border-indigo-500/40 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{t.admin.stats.securityTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{loginAttempts.length}</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400/80 mt-1">{t.admin.stats.securitySub}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/90 p-4 mb-6 shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t.admin.tabs.pending}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-zinc-950/40 text-zinc-950 font-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'approved'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.admin.tabs.approved}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'approved' ? 'bg-white/30 text-white font-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'}`}>
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>{t.admin.tabs.rejected}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'rejected' ? 'bg-white/30 text-white font-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'}`}>
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-950 font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.admin.tabs.all}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-white/30 dark:bg-zinc-300 text-white dark:text-zinc-950 font-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'}`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.admin.tabs.categories}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'categories'
                  ? 'bg-white/30 text-white font-black'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
              }`}>
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.admin.tabs.products}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'products'
                  ? 'bg-white/30 text-white font-black'
                  : products.filter((p) => p.market_unavailable).length > 0
                  ? 'bg-rose-100 dark:bg-red-500/20 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-500/30 font-bold'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
              }`}>
                {products.filter((p) => p.market_unavailable).length > 0
                  ? `${products.filter((p) => p.market_unavailable).length} ${t.admin.stats.productsOutageSub}`
                  : products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('abandoned_carts')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'abandoned_carts'
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.admin.tabs.abandonedCarts}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'abandoned_carts'
                  ? 'bg-zinc-950/40 text-zinc-950 font-black'
                  : abandonedCarts.length > 0
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-bold'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
              }`}>
                {abandonedCarts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security_logs')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'security_logs'
                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.admin.tabs.securityLogs}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'security_logs' ? 'bg-white/30 text-white font-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'}`}>
                {loginAttempts.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'products'
                  ? t.admin.searchPlaceholders.products
                  : activeTab === 'categories'
                  ? t.admin.searchPlaceholders.categories
                  : activeTab === 'security_logs'
                  ? t.admin.searchPlaceholders.securityLogs
                  : t.admin.searchPlaceholders.accounts
              }
              className={`w-full bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl ${
                isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              } py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner`}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5">
          <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">{t.admin.accountsTab.loadingAccounts}</p>
        </div>
      ) : activeTab === 'categories' ? (
        <CategoryManager
          categories={categories.filter((c) =>
            searchTerm.trim()
              ? c.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                (c.name_fr && c.name_fr.toLowerCase().includes(searchTerm.toLowerCase().trim()))
              : true
          )}
          products={products}
          onRefresh={loadData}
          isRTL={isRTL}
          language={language}
        />
      ) : activeTab === 'security_logs' ? (

        /* Security logs tab */
        <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{t.admin.securityLogsTab.title}</h2>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{t.admin.securityLogsTab.total}: {loginAttempts.length}</span>
            </div>

            {loginAttempts.length > 0 && (
              <button
                onClick={handleClearAllAttempts}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-600 dark:text-red-400 border border-rose-200 dark:border-red-500/30 rounded-xl text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.admin.securityLogsTab.clearAllBtn}</span>
              </button>
            )}
          </div>

          {loginAttempts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p>{t.admin.securityLogsTab.emptyTitle}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {loginAttempts.map((att) => {
                const device = parseDeviceInfo(att.user_agent);
                const timeData = formatDate24h(att.attempted_at);
                const statusLabel =
                  att.status === 'invalid_credentials'
                    ? t.admin.securityLogsTab.statusInvalidCreds
                    : att.status === 'blocked_unapproved'
                    ? t.admin.securityLogsTab.statusBlockedUnapproved
                    : t.admin.securityLogsTab.statusFailed;

                return (
                  <div
                    key={att.id}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isRTL ? 'text-right' : 'text-left'
                    } group`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{att.email}</span>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-red-500/15 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-500/30">
                          {statusLabel}
                        </span>
                      </div>

                      <p className="text-xs text-rose-600 dark:text-red-400/90 font-medium">
                        {att.error_message || (language === 'ar' ? 'تعذر تسجيل الدخول' : language === 'fr' ? 'Échec de connexion' : 'Login failed')}
                      </p>

                      {/* Attempted Password (auto-cleared after 7 days) */}
                      {att.attempted_password ? (
                        <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-zinc-900/90 border border-amber-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg w-fit text-amber-900 dark:text-amber-300">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">{t.admin.securityLogsTab.enteredPassword}</span>
                          <span className="font-mono font-bold text-xs" dir="ltr">
                            {revealedPasswords[att.id] ? att.attempted_password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(att.id)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors p-0.5"
                            title={revealedPasswords[att.id] ? t.admin.securityLogsTab.revealedHide : t.admin.securityLogsTab.revealedShow}
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
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 px-2.5 py-1 rounded-lg w-fit">
                        <span>{device.icon}</span>
                        <span className="font-medium">{device.text}</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                      <div className={isRTL ? 'text-left sm:text-right' : 'text-right sm:text-left'}>
                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-xs sm:text-sm block" dir="ltr">
                          {timeData.full}
                        </span>
                        {timeData.relative && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 inline-block">
                            {timeData.relative}
                          </span>
                        )}
                      </div>

                      {/* Delete item button */}
                      <button
                        onClick={() => handleDeleteAttempt(att.id)}
                        title={t.admin.securityLogsTab.deleteRecord}
                        className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
        <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{t.admin.productsTab.title}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t.admin.productsTab.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-xl font-bold">
                {t.admin.productsTab.totalProducts}: {products.length}
              </span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-400 dark:text-zinc-500" />
              <p className="font-bold text-slate-700 dark:text-zinc-300">{t.admin.productsTab.emptyTitle}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{t.admin.productsTab.emptyDesc}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {products
                .filter((p) => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  return p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
                })
                .map((product) => {
                  const isActionBusy = actionLoading === product.id;
                  const cat = categories.find((c) => c.id === product.category_id);

                  return (
                    <div
                      key={product.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{product.name}</h3>
                          {cat && (
                            <span className="text-[11px] bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-md font-medium">
                              {cat.name}
                            </span>
                          )}
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                            {formatDA(product.price)} / {product.unit}
                          </span>
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">{product.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs">
                          {product.market_unavailable ? (
                            <span className="text-xs text-rose-600 dark:text-red-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{t.admin.productsTab.outageNotice}</span>
                            </span>
                          ) : product.stock > 0 ? (
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                              {t.admin.productsTab.inStockWarehouse}: {product.stock} {product.unit}
                            </span>
                          ) : (
                            <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                              {t.admin.productsTab.jitWarehouse}
                            </span>
                          )}
                        </div>

                        {/* معلومات الكرتونة */}
                        {editingPackId === product.id ? (
                          <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col gap-2.5 ring-1 ring-slate-900/5 dark:ring-white/5">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{t.admin.productsTab.packConfigTitle}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500 dark:text-zinc-400 block mb-0.5">{t.admin.productsTab.unitsPerPack}</label>
                                <input
                                  type="number"
                                  min="2"
                                  value={packForm.units}
                                  onChange={e => setPackForm(f => ({ ...f, units: e.target.value }))}
                                  placeholder="12"
                                  className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500 dark:text-zinc-400 block mb-0.5">{t.admin.productsTab.packLabel}</label>
                                <input
                                  type="text"
                                  value={packForm.label}
                                  onChange={e => setPackForm(f => ({ ...f, label: e.target.value }))}
                                  placeholder={language === 'ar' ? 'كرتونة / علبة' : language === 'fr' ? 'Carton / Boîte' : 'Carton / Box'}
                                  className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                            {/* سعر الحبة عند الكرتونة */}
                            <div>
                              <label className="text-[10px] text-slate-500 dark:text-zinc-400 block mb-0.5">
                                {t.admin.productsTab.packPrice}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={packForm.packPrice}
                                onChange={e => setPackForm(f => ({ ...f, packPrice: e.target.value }))}
                                placeholder={product.price ? String(product.price) : '0'}
                                className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                              />
                              {packForm.packPrice && packForm.units && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                                  → {(parseFloat(packForm.packPrice || '0') * parseInt(packForm.units || '0')).toFixed(0)} {t.common.currency}
                                  {product.price > parseFloat(packForm.packPrice || '0') && (
                                    <span> ({language === 'ar' ? 'توفير' : language === 'fr' ? 'Économie' : 'Savings'}: {((product.price - parseFloat(packForm.packPrice || '0')) * parseInt(packForm.units || '0')).toFixed(0)} {t.common.currency})</span>
                                  )}
                                </p>
                              )}
                            </div>
                            {/* أزرار الحفظ */}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSavePackInfo(product.id)}
                                disabled={actionLoading === `pack-${product.id}`}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs py-1.5 rounded-lg shadow-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {actionLoading === `pack-${product.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {t.admin.productsTab.savePack}
                              </button>
                              <button
                                onClick={() => setPackForm(f => ({ ...f, units: '', packPrice: '' }))}
                                className="text-xs text-rose-600 dark:text-red-400 border border-rose-200 dark:border-red-500/30 bg-rose-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-red-500/20"
                              >
                                {t.admin.productsTab.clearPack}
                              </button>
                              <button
                                onClick={() => setEditingPackId(null)}
                                className="text-xs text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                {t.admin.productsTab.closePack}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {product.units_per_pack ? (
                              <span className="text-[11px] bg-slate-100 dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-lg font-medium">
                                📦 {product.pack_label || (language === 'ar' ? 'كرتونة' : language === 'fr' ? 'Carton' : 'Carton')} = {product.units_per_pack} {product.unit}
                                {product.pack_price && product.pack_price < product.price ? (
                                  <span className="mx-1 text-emerald-600 dark:text-emerald-300 font-bold">
                                    • {product.pack_price} {t.common.currency}/{product.unit} → {((product.price - product.pack_price) * product.units_per_pack).toFixed(0)} {t.common.currency}
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500">{t.admin.productsTab.noPackPieceOnly}</span>
                            )}
                            <button
                              onClick={() => handleStartEditPack(product)}
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline font-semibold"
                            >
                              {t.admin.productsTab.editPack}
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
                              ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/20'
                              : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/40 shadow-sm dark:shadow-neon-sm'
                          }`}
                        >
                          {isActionBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : product.market_unavailable ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>
                            {product.market_unavailable
                              ? t.admin.productsTab.btnUnavailableToggle
                              : t.admin.productsTab.btnAvailableToggle}
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
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm dark:shadow-neon-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">{t.admin.abandonedCartsTab.title}</h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  {t.admin.abandonedCartsTab.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => loadData(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title={language === 'ar' ? 'تحديث القائمة' : language === 'fr' ? 'Actualiser' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {abandonedCarts.length === 0 ? (
            <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 p-16 text-center shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">{t.admin.abandonedCartsTab.emptyTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t.admin.abandonedCartsTab.emptyDesc}</p>
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
                  const fallbackMerchant = language === 'ar' ? 'تاجر بدون اسم' : language === 'fr' ? 'Commerçant' : 'Merchant';
                  const fallbackAccount = language === 'ar' ? 'حساب غير معروف' : language === 'fr' ? 'Compte inconnu' : 'Unknown account';
                  const clientName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || fallbackMerchant : fallbackAccount;
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
                  const packFallback = language === 'ar' ? 'كرتونة' : language === 'fr' ? 'Carton' : 'Carton';
                  const productsSummary = cart.items
                    .map(it => `• ${it.product.name} (${it.quantity} ${it.purchase_mode === 'pack' ? (it.product.pack_label || packFallback) : it.product.unit})`)
                    .join('%0A');

                  const whatsappMessage = language === 'ar'
                    ? `السلام عليكم أخي ${clientName}، معك إدارة منصة Fox Way.%0A%0Aلاحظنا أنك بدأت تجهيز طلبية في التطبيق بقيمة *${cartTotal.toLocaleString()} دج* ولم تكمل إرسالها بعد:%0A${productsSummary}%0A%0Aهل تود تأكيدها وتحديد موعد التوصيل لمحلك؟ نحن في الخدمة! 🤝`
                    : language === 'fr'
                    ? `Bonjour ${clientName}, ici l'équipe Fox Way.%0A%0ANous avons remarqué que vous avez préparé une commande d'un montant de *${cartTotal.toLocaleString()} DA* :%0A${productsSummary}%0A%0ASouhaitez-vous la confirmer pour la livraison à votre magasin ? Nous sommes à votre service ! 🤝`
                    : `Hello ${clientName}, this is Fox Way management.%0A%0AWe noticed you started an order worth *${cartTotal.toLocaleString()} DA* :%0A${productsSummary}%0A%0AWould you like to confirm it for delivery to your shop? We are at your service! 🤝`;

                  return (
                    <div
                      key={cart.id}
                      className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-amber-500/40 p-5 shadow-sm dark:shadow-2xl transition-all flex flex-col justify-between ring-1 ring-slate-900/5 dark:ring-white/5 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div>
                        {/* Header: Name and Total */}
                        <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                              <span>{clientName}</span>
                              {p?.shop_type_id && (
                                <span className="text-[11px] font-normal bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-md">
                                  {getShopTypeName(p.shop_type_id)}
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                {p ? `${getWilayaName(p.wilaya_code)}${getCommuneName(p.commune_id)}` : (language === 'ar' ? 'غير محدد' : language === 'fr' ? 'Non spécifié' : 'Unspecified')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                {t.admin.abandonedCartsTab.lastUpdated}: {new Date(cart.updated_at).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className={isRTL ? 'text-left shrink-0' : 'text-right shrink-0'}>
                            <span className="text-xs text-slate-400 dark:text-zinc-400 block">{t.admin.abandonedCartsTab.cartValue}</span>
                            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{formatDA(cartTotal)}</span>
                          </div>
                        </div>

                        {/* Items in Cart */}
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                            <span>📦 {t.admin.abandonedCartsTab.cartItemsTitle} ({totalItemsCount}):</span>
                          </p>
                          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                            {cart.items.map((it, i) => {
                              const isPack = it.purchase_mode === 'pack' && !!it.product.units_per_pack;
                              const label = isPack ? (it.product.pack_label || packFallback) : it.product.unit;
                              return (
                                <div key={i} className="flex items-center justify-between text-xs text-zinc-200">
                                  <span className="truncate max-w-[65%] font-medium">
                                    • {it.product.name}
                                  </span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                                    {it.quantity} {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Phone Call & WhatsApp */}
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                        {phone ? (
                          <>
                            <a
                              href={`tel:${phone}`}
                              className="flex-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{t.admin.abandonedCartsTab.callBtn}</span>
                            </a>

                            <a
                              href={`https://wa.me/213${phone.replace(/^0/, '')}?text=${whatsappMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm dark:shadow-neon-sm transition-all"
                            >
                              <span>{t.admin.abandonedCartsTab.whatsappBtn}</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500 text-center w-full">{t.admin.abandonedCartsTab.noPhone}</span>
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
            <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 p-16 text-center shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-zinc-600">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">{t.admin.accountsTab.emptyTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {searchTerm
                  ? (language === 'ar' ? 'جرّب البحث بكلمة أخرى' : language === 'fr' ? 'Essayez un autre mot-clé' : 'Try searching with another keyword')
                  : t.admin.accountsTab.emptyDesc}
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

                const fallbackNoName = language === 'ar' ? 'بدون اسم' : language === 'fr' ? 'Sans nom' : 'No name';
                const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.full_name || fallbackNoName;

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-[#121215] rounded-2xl border p-5 shadow-sm dark:shadow-2xl transition-all duration-200 flex flex-col justify-between ring-1 ring-slate-900/5 dark:ring-white/5 ${
                      isSelf
                        ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-gradient-to-b dark:from-emerald-950/20 dark:to-[#121215] shadow-sm dark:shadow-neon-sm ring-2 ring-emerald-500/20'
                        : isPending
                        ? 'border-amber-300 dark:border-amber-500/40 hover:border-amber-500 hover:shadow-md dark:hover:shadow-neon-sm'
                        : isApproved
                        ? 'border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-rose-500/40 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top status & Role */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isPending
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                : isApproved
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/15 border border-red-500/30 text-red-400'
                            }`}
                          >
                            {isPending && <Clock className="w-3.5 h-3.5" />}
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5" />}
                            {isPending ? t.admin.accountsTab.badgePending : isApproved ? t.admin.accountsTab.badgeApproved : t.admin.accountsTab.badgeRejected}
                          </span>

                          {isSelf ? (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/40">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{t.admin.accountActions.selfAccountBadge}</span>
                            </span>
                          ) : p.role === 'admin' ? (
                            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                              {t.admin.accountActions.adminRoleBadge}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            {formatDate(p.created_at)}
                          </span>

                          {/* 3 dots menu: only for rejected accounts and not self */}
                          {isRejected && !isSelf && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveMenuProfileId(activeMenuProfileId === p.id ? null : p.id)}
                                className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                title={t.admin.accountActions.moreOptions}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuProfileId === p.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setActiveMenuProfileId(null)} />
                                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-48 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-red-500/30 rounded-xl shadow-2xl p-1 z-40 animate-scale-in`}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuProfileId(null);
                                        setDeleteModalProfile(p);
                                        setDeleteConfirmText('');
                                      }}
                                      className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-between transition-colors`}
                                    >
                                      <span>{t.admin.accountActions.deletePermanent}</span>
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Client Name */}
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mb-2 tracking-tight">{displayName}</h3>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-zinc-300 mb-4 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-xl">
                        {/* Phone */}
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <a
                            href={`tel:${formatPhone(p.phone)}`}
                            className="font-medium text-slate-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            dir="ltr"
                          >
                            {formatPhone(p.phone)}
                          </a>
                        </div>

                        {/* Business Type */}
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{getShopTypeName(p.shop_type_id)}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{getWilayaName(p.wilaya_code)}{getCommuneName(p.commune_id)}</span>
                        </div>

                        {/* Email */}
                        {p.email && (
                          <div className="flex items-center gap-2 sm:col-span-2 border-t border-slate-200 dark:border-zinc-800/60 pt-2 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono text-slate-700 dark:text-zinc-300 text-xs truncate max-w-full" dir="ltr">
                              {p.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                      {isSelf ? (
                        <div className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm dark:shadow-neon-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{t.admin.accountActions.selfProtected}</span>
                        </div>
                      ) : isPending ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(p.id, 'approved')}
                            disabled={isLoadingAction}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm dark:shadow-neon-sm hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isLoadingAction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            <span>{t.admin.accountActions.approve}</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(p.id, 'rejected')}
                            disabled={isLoadingAction}
                            className="bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-600 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-rose-200 dark:border-red-500/30 hover:border-rose-300 dark:hover:border-red-500/50 transition-all disabled:opacity-50 shadow-sm"
                          >
                            {isLoadingAction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                            <span>{t.admin.accountActions.reject}</span>
                          </button>
                        </>
                      ) : isApproved ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(p.id, 'rejected')}
                            disabled={isLoadingAction}
                            className="flex-1 bg-slate-100 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-red-500/15 text-slate-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-red-400 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-red-500/40 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>{t.admin.accountActions.block}</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(p.id, 'pending')}
                            disabled={isLoadingAction}
                            className="bg-slate-100 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-500/40 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <span>{t.admin.accountActions.suspend}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(p.id, 'approved')}
                          disabled={isLoadingAction}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm dark:shadow-neon-sm hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{t.admin.accountActions.reactivate}</span>
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


      {/* Custom Confirmation Modal: Clear Security Logs */}
      {clearLogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#121215] border border-amber-300 dark:border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 text-center animate-scale-in">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400 shadow-sm dark:shadow-neon-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t.admin.securityLogsTab.modalTitle}</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-300 mb-6">
              {t.admin.securityLogsTab.modalDesc}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={confirmClearLogs}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-extrabold py-3 px-4 rounded-xl text-sm shadow-sm dark:shadow-neon-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.admin.securityLogsTab.modalConfirm}</span>
              </button>
              <button
                onClick={() => setClearLogsModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl text-sm border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
              >
                {t.admin.securityLogsTab.modalCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub-style Danger Zone Modal for Permanent Account Deletion */}
      {deleteModalProfile && (() => {
        const fn = (deleteModalProfile.first_name || '').trim();
        const ln = (deleteModalProfile.last_name || '').trim();
        const rawSlug = fn && ln
          ? `${fn}-${ln}`
          : deleteModalProfile.full_name?.trim()
          ? deleteModalProfile.full_name.trim().replace(/\s+/g, '-')
          : deleteModalProfile.email
          ? deleteModalProfile.email.split('@')[0]
          : deleteModalProfile.phone;
        const expectedSlug = rawSlug.toLowerCase().replace(/\s+/g, '-');
        const isMatch = deleteConfirmText.trim().toLowerCase() === expectedSlug;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir={dir}>
            <div className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-rose-300 dark:border-red-500/40 rounded-3xl p-6 shadow-2xl ring-1 ring-rose-500/20 animate-scale-in">
              {/* Warning Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-red-500/15 border border-rose-300 dark:border-red-500/30 flex items-center justify-center text-rose-600 dark:text-red-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t.admin.accountActions.deleteModalTitle}</h3>
                  <p className="text-xs text-rose-600 dark:text-red-400 font-medium">{t.admin.accountActions.deleteModalSubtitle}</p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-4 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl">
                {t.admin.accountActions.deleteModalExplanation}
                <br />
                <strong className="text-slate-900 dark:text-white mt-1 inline-block">
                  {deleteModalProfile.first_name || ''} {deleteModalProfile.last_name || ''} ({deleteModalProfile.email || deleteModalProfile.phone})
                </strong>
              </p>

              {/* Confirmation instruction: exact GitHub style */}
              <div className={`space-y-2 mb-5 ${isRTL ? 'text-right' : 'text-left'}`}>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 leading-normal">
                  {t.admin.accountActions.deleteModalInstruction}{' '}
                  <span className="text-rose-600 dark:text-red-400 font-mono px-2 py-0.5 bg-rose-50 dark:bg-red-500/15 border border-rose-200 dark:border-red-500/30 rounded font-black select-all" dir="ltr">{expectedSlug}</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={expectedSlug}
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center font-bold tracking-wider font-mono"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteModalProfile(null)}
                  disabled={isDeletingAccount}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold transition-all"
                >
                  {t.admin.accountActions.deleteModalCancel}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccountConfirm}
                  disabled={isDeletingAccount || !isMatch}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  {isDeletingAccount ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{t.admin.accountActions.deleteModalConfirm}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
