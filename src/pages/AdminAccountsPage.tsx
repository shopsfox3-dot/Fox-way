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
  Menu,
  LayoutDashboard,
  Boxes,
  Camera,
  Zap,
  Radio,
  Wallet,
  Truck,
  Building2,
  BarChart3,
  PanelRightOpen,
  PanelLeftOpen,
  PanelRightClose,
  PanelLeftClose,
} from 'lucide-react';
import CategoryManager from '@/components/admin/CategoryManager';
import ProductManager from '@/components/admin/ProductManager';
import AdminSidebar, { AdminSection } from '@/components/admin/AdminSidebar';

interface AdminAccountsPageProps {
  onBack: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'categories' | 'products' | 'abandoned_carts' | 'security_logs';
type OrderTabType = 'all_orders' | 'new_orders' | 'preparing' | 'in_van' | 'delivered' | 'abandoned_carts';

export default function AdminAccountsPage({ onBack }: AdminAccountsPageProps) {
  const { profile: currentAdmin } = useAuth();
  const { t, language, setLanguage, languages, isRTL, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState<{
    clients: boolean;
    orders: boolean;
    securityLogs: boolean;
  }>({
    clients: false,
    orders: false,
    securityLogs: false,
  });

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
  const [orderTab, setOrderTab] = useState<OrderTabType>('abandoned_carts');
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
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Dark Modern Fixed CRM Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          setCurrentSection(sec);
          if (sec === 'clients') {
            setActiveTab('pending');
            setClearedNotifications((prev) => ({ ...prev, clients: true }));
          }
          if (sec === 'orders') {
            setOrderTab('abandoned_carts');
            setClearedNotifications((prev) => ({ ...prev, orders: true }));
          }
          if (sec === 'security_logs') {
            setActiveTab('security_logs');
            setClearedNotifications((prev) => ({ ...prev, securityLogs: true }));
          }
        }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isRTL={isRTL}
        language={language}
        onBackToStore={onBack}
        counts={{
          pendingClients: clearedNotifications.clients ? 0 : pendingCount,
          abandonedCarts: clearedNotifications.orders ? 0 : abandonedCarts.length,
          securityLogs: clearedNotifications.securityLogs ? 0 : loginAttempts.length,
        }}
      />

      {/* Main Content Area - Fluid space from sidebar */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? (isRTL ? 'lg:mr-20' : 'lg:ml-20') : (isRTL ? 'lg:mr-72' : 'lg:ml-72')
      }`}>
        {/* Sticky Executive Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle button - sleek matching rectangular icon! */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
              title="القائمة"
            >
              {isRTL ? <PanelRightOpen className="w-4 h-4 text-emerald-500" /> : <PanelLeftOpen className="w-4 h-4 text-emerald-500" />}
            </button>

            {/* Desktop sidebar toggle button - always in the exact same line! */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
              title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            >
              {isSidebarCollapsed ? (
                isRTL ? <PanelRightOpen className="w-4 h-4 text-emerald-500" /> : <PanelLeftOpen className="w-4 h-4 text-emerald-500" />
              ) : (
                isRTL ? <PanelRightClose className="w-4 h-4 text-emerald-500" /> : <PanelLeftClose className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Clean Section Name - No repetitive Fox-way CRM */}
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {currentSection === 'dashboard' && (
                    <>
                      <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'لوحة المراقبة العامة' : 'Tableau de bord'}</span>
                    </>
                  )}
                  {currentSection === 'inventory' && (
                    <>
                      <Boxes className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'المخزون والسلع' : 'Stock & Inventaire'}</span>
                    </>
                  )}
                  {currentSection === 'clients' && (
                    <>
                      <Users className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'العملاء والمحلات' : 'Clients & Magasins'}</span>
                    </>
                  )}
                  {currentSection === 'orders' && (
                    <>
                      <ShoppingBag className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'الطلبيات والسلات المعلقة' : 'Commandes'}</span>
                    </>
                  )}
                  {currentSection === 'security_logs' && (
                    <>
                      <ShieldAlert className="w-5 h-5 text-indigo-500" />
                      <span>{language === 'ar' ? 'سجلات الأمان والتسجيل' : 'Sécurité'}</span>
                    </>
                  )}
                  {currentSection === 'routes' && (
                    <>
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'مسارات التوزيع والبلديات' : 'Tournées'}</span>
                    </>
                  )}
                  {currentSection === 'delivery' && (
                    <>
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span>{language === 'ar' ? 'الشاحنة والتوصيل' : 'Livraison'}</span>
                    </>
                  )}
                  {currentSection === 'special_requests' && (
                    <>
                      <Camera className="w-5 h-5 text-purple-500" />
                      <span>{language === 'ar' ? 'سلعة ناقصة في السوق' : 'Demandes'}</span>
                    </>
                  )}
                  {currentSection === 'promotions' && (
                    <>
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span>{language === 'ar' ? 'عروض كراتين فورية' : 'Offres Flash'}</span>
                    </>
                  )}
                  {currentSection === 'radar' && (
                    <>
                      <Radio className="w-5 h-5 text-cyan-500" />
                      <span>{language === 'ar' ? 'رادار المحلات الراكدة' : 'Radar'}</span>
                    </>
                  )}
                  {currentSection === 'purchases' && (
                    <>
                      <ShoppingBag className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'مشتريات سوق الجملة (التبضع الصباحي)' : 'Achats Marché de Gros'}</span>
                    </>
                  )}
                  {currentSection === 'treasury' && (
                    <>
                      <Wallet className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'الخزينة والمصاريف اليومية' : 'Trésorerie & Dépenses'}</span>
                    </>
                  )}
                  {currentSection === 'reports' && (
                    <>
                      <BarChart3 className="w-5 h-5 text-teal-500" />
                      <span>{language === 'ar' ? 'التقارير والأرباح الصافية' : 'Rapports & Statistiques'}</span>
                    </>
                  )}
                  {currentSection === 'staff' && (
                    <>
                      <UserCheck className="w-5 h-5 text-blue-500" />
                      <span>{language === 'ar' ? 'فريق العمل والصلاحيات' : 'Équipe & Permissions'}</span>
                    </>
                  )}
                  {currentSection === 'suppliers' && (
                    <>
                      <Building2 className="w-5 h-5 text-amber-500" />
                      <span>{language === 'ar' ? 'الموردون والشركات وفواتير الشراء' : 'Fournisseurs & Factures'}</span>
                    </>
                  )}
                </h1>
              </div>
            </div>

          {/* Top Actions: Language, Theme, Refresh, Back to Store */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700/60">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    language === lang.code
                      ? 'bg-white dark:bg-emerald-500 text-slate-900 dark:text-zinc-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Theme switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 rounded-xl text-slate-700 dark:text-zinc-200 shadow-sm transition-all"
              title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 rounded-xl text-slate-700 dark:text-zinc-200 shadow-sm transition-all disabled:opacity-50"
              title={t.common.refresh}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Back to store */}
            <button
              onClick={onBack}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <BackArrow className="w-3.5 h-3.5" />
              <span>{t.admin.backToStore}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* Success banner */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-sm flex items-center gap-3 shadow-sm dark:shadow-neon-sm ring-1 ring-emerald-500/20 animate-fade-in-up">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Main Content Area */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5">
              <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">{t.admin.accountsTab.loadingAccounts}</p>
            </div>
          ) : currentSection === 'dashboard' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Welcome Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-emerald-100">
                    FOX-WAY LOGISTICS & WHOLESALE
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-3 mb-2">
                    {language === 'ar' ? 'لوحة المراقبة وإدارة التوزيع' : 'Distribution Dashboard'}
                  </h2>
                  <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                    {language === 'ar'
                      ? 'مرحباً بك في نظام التوزيع الذكي. يمكنك إدارة المخزون، مراجعة المحلات، ومتابعة الطلبات المسبقة لشاحنة التوزيع من مكان واحد.'
                      : 'Executive distribution and inventory management.'}
                  </p>
                </div>
                <div className="absolute top-0 left-0 sm:left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* 4 Primary KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => {
                    setCurrentSection('clients');
                    setActiveTab('pending');
                  }}
                  className="cursor-pointer bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {language === 'ar' ? 'المحلات المسجلة' : 'Magasins Inscrits'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{profiles.length}</p>
                  <p className="text-xs text-amber-500 font-bold mt-1">
                    {pendingCount} {language === 'ar' ? 'طلب مراجعة معلق' : 'en attente'}
                  </p>
                </div>

                <div
                  onClick={() => setCurrentSection('inventory')}
                  className="cursor-pointer bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {language === 'ar' ? 'أقسام السلع النشطة' : 'Catégories'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Boxes className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{categories.length}</p>
                  <p className="text-xs text-emerald-500 font-bold mt-1">
                    {products.length} {language === 'ar' ? 'منتج مفعل' : 'produits'}
                  </p>
                </div>

                <div
                  onClick={() => {
                    setCurrentSection('orders');
                    setActiveTab('abandoned_carts');
                  }}
                  className="cursor-pointer bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {language === 'ar' ? 'السلات قيد الانتظار' : 'Paniers brouillons'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{abandonedCarts.length}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                    {language === 'ar' ? 'جاهزة للمتابعة الفورية' : 'à relancer'}
                  </p>
                </div>

                <div
                  onClick={() => {
                    setCurrentSection('security_logs');
                    setActiveTab('security_logs');
                  }}
                  className="cursor-pointer bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {language === 'ar' ? 'سجلات الأمان' : 'Sécurité'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{loginAttempts.length}</p>
                  <p className="text-xs text-indigo-500 font-bold mt-1">
                    {language === 'ar' ? 'عمليات تسجيل مدققة' : 'tentatives tracées'}
                  </p>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="bg-white dark:bg-[#121215] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                  {language === 'ar' ? 'الوصول السريع لمهام اليوم' : 'Accès rapide'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setCurrentSection('inventory')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all text-start group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                          {language === 'ar' ? 'إدارة المخزون والأقسام' : 'Gestion Stock'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {language === 'ar' ? 'الأقسام والماركات والسلع' : 'Rayons & Produits'}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSection('clients');
                      setActiveTab('pending');
                    }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all text-start group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors">
                          {language === 'ar' ? 'مراجعة طلبات المحلات' : 'Validation Magasins'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {pendingCount} {language === 'ar' ? 'حساب بانتظار الموافقة' : 'en attente'}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSection('orders');
                      setActiveTab('abandoned_carts');
                    }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all text-start group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                          {language === 'ar' ? 'متابعة السلات المسودة' : 'Paniers brouillons'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {abandonedCarts.length} {language === 'ar' ? 'سلة جاهزة للتأكيد' : 'paniers prêts'}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : currentSection === 'inventory' ? (
            <CategoryManager
              categories={categories}
              products={products}
              onRefresh={loadData}
              isRTL={isRTL}
              language={language}
            />
          ) : currentSection === 'routes' || currentSection === 'delivery' || currentSection === 'special_requests' || currentSection === 'promotions' || currentSection === 'radar' || currentSection === 'treasury' || currentSection === 'purchases' || currentSection === 'reports' || currentSection === 'staff' || currentSection === 'suppliers' ? (
            <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                {currentSection === 'special_requests' ? (
                  <Camera className="w-8 h-8" />
                ) : currentSection === 'promotions' ? (
                  <Zap className="w-8 h-8" />
                ) : currentSection === 'treasury' ? (
                  <Wallet className="w-8 h-8" />
                ) : currentSection === 'routes' ? (
                  <MapPin className="w-8 h-8" />
                ) : currentSection === 'delivery' ? (
                  <Truck className="w-8 h-8" />
                ) : currentSection === 'purchases' ? (
                  <ShoppingBag className="w-8 h-8" />
                ) : currentSection === 'reports' ? (
                  <BarChart3 className="w-8 h-8" />
                ) : currentSection === 'staff' ? (
                  <UserCheck className="w-8 h-8" />
                ) : currentSection === 'suppliers' ? (
                  <Building2 className="w-8 h-8" />
                ) : (
                  <Radio className="w-8 h-8" />
                )}
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                {language === 'ar' ? 'قيد التطوير وفق خطة العمل' : 'Prochainement'}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-3 mb-2">
                {currentSection === 'purchases' && (language === 'ar' ? 'مشتريات سوق الجملة (ورقة الشراء وقائمة التبضع الصباحية)' : 'Approvisionnement Gros')}
                {currentSection === 'routes' && (language === 'ar' ? 'مسارات التوزيع والبلديات' : 'Tournées de Distribution')}
                {currentSection === 'delivery' && (language === 'ar' ? 'تسوية الشاحنة اليومية وحاسبة عمولة السائق' : 'Règlement Camion')}
                {currentSection === 'treasury' && (language === 'ar' ? 'الخزينة والمصاريف اليومية ومتابعة الديون' : 'Trésorerie & Dettes')}
                {currentSection === 'reports' && (language === 'ar' ? 'التقارير المالية والأرباح الصافية وحركة السلع' : 'Rapports & Statistiques')}
                {currentSection === 'staff' && (language === 'ar' ? 'إدارة فريق العمل (السائق، المندوب، حجب الأسعار والتكلفة)' : 'Équipe & Permissions')}
                {currentSection === 'suppliers' && (language === 'ar' ? 'سجل الموردين والشركات وفواتير الشراء' : 'Fournisseurs & Factures')}
                {currentSection === 'special_requests' && (language === 'ar' ? 'سلعة ناقصة في السوق (Wishlist مع التصوير)' : 'Demandes Spéciales')}
                {currentSection === 'promotions' && (language === 'ar' ? 'عروض كراتين فورية (Flash Deals للتصريف السريع)' : 'Offres Flash')}
                {currentSection === 'radar' && (language === 'ar' ? 'رادار المحلات الراكدة المنقطعة عن الطلب' : 'Radar Magasins Inactifs')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                {language === 'ar'
                  ? 'هذه الميزة مدرجة في خطة عمل Fox-way لمساعدة تجار الجملة والتوزيع. سيتم تفعيلها في الخطوات القادمة بعد اكتمال المخزون وتخصيص الأسعار.'
                  : 'Cette fonctionnalité fait partie intégrante de la feuille de route Fox-way pour les grossistes.'}
              </p>
              <button
                onClick={() => setCurrentSection('inventory')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-sm shadow-emerald-500/20"
              >
                {language === 'ar' ? 'الانتقال إلى إدارة المخزون' : 'Gérer le stock'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Specialized Top Filter Bar according to active section */}
              {currentSection === 'orders' ? (
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  {/* Orders Specific Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderTab('new_orders')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        orderTab === 'new_orders'
                          ? 'bg-emerald-500 text-zinc-950 font-extrabold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{language === 'ar' ? 'طلبيات واردة جديدة' : 'Nouvelles'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                        0
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderTab('preparing')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        orderTab === 'preparing'
                          ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>{language === 'ar' ? 'قيد التجهيز بالمستودع' : 'En préparation'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                        0
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderTab('in_van')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        orderTab === 'in_van'
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>{language === 'ar' ? 'في الشاحنة للتوصيل' : 'En livraison'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                        0
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderTab('delivered')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        orderTab === 'delivered'
                          ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-950 font-extrabold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تم التسليم' : 'Livrées'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                        0
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderTab('abandoned_carts')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        orderTab === 'abandoned_carts'
                          ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{language === 'ar' ? 'سلات لم تُرسل (متروكة)' : 'Paniers brouillons'}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        orderTab === 'abandoned_carts'
                          ? 'bg-zinc-950/40 text-zinc-950 font-black'
                          : abandonedCarts.length > 0
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-bold'
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                      }`}>
                        {abandonedCarts.length}
                      </span>
                    </button>
                  </div>

                  {/* Orders Search bar */}
                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none`} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={language === 'ar' ? 'بحث برقم الطلبية، اسم المحل، أو الهاتف...' : 'Recherche commande, client...'}
                      className={`w-full bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl ${
                        isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      } py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner`}
                    />
                  </div>
                </div>
              ) : currentSection === 'clients' ? (
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  {/* Clients Specific Tabs */}
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
                  </div>

                  {/* Clients Search bar */}
                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none`} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t.admin.searchPlaceholders.accounts}
                      className={`w-full bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl ${
                        isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      } py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner`}
                    />
                  </div>
                </div>
              ) : null}

        {/* Section Content */}
        {currentSection === 'security_logs' ? (

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
      ) : currentSection === 'orders' ? (
        orderTab === 'abandoned_carts' ? (
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
          /* Order Pipeline Stages: new_orders, preparing, in_van, delivered */
          <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 sm:p-12 text-center shadow-sm dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              {orderTab === 'new_orders' && <ShoppingBag className="w-8 h-8" />}
              {orderTab === 'preparing' && <Package className="w-8 h-8" />}
              {orderTab === 'in_van' && <Truck className="w-8 h-8" />}
              {orderTab === 'delivered' && <CheckCircle2 className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              {orderTab === 'new_orders' && (language === 'ar' ? 'طلبيات واردة جديدة من المتجر (0 طلبية)' : 'Nouvelles Commandes (0)')}
              {orderTab === 'preparing' && (language === 'ar' ? 'طلبيات قيد التجهيز بالمستودع (0)' : 'En préparation au stock (0)')}
              {orderTab === 'in_van' && (language === 'ar' ? 'طلبيات في الشاحنة للتوصيل (0)' : 'En camion de livraison (0)')}
              {orderTab === 'delivered' && (language === 'ar' ? 'سجل الفواتير والطلبيات المسلمة (0)' : 'Commandes livrées (0)')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
              {orderTab === 'new_orders' && (language === 'ar'
                ? 'تظهر هنا فورياً طلبيات التجار المؤكدة من المتجر، مع تنبيه صوتي وإشعار فوري للبدء بالتأكيد وتجهيز الفاتورة.'
                : 'Les commandes validées par les commerçants apparaissent ici en temps réel.')}
              {orderTab === 'preparing' && (language === 'ar'
                ? 'الطلبيات المؤكدة التي يقوم عمال المستودع بجمعها وتغليفها وطباعة الفاتورة وقائمة التجهيز.'
                : 'Commandes en cours de préparation au dépôt.')}
              {orderTab === 'in_van' && (language === 'ar'
                ? 'الطلبيات المحمّلة في الشاحنة والموزعة حسب مسارات البلديات بانتظار تسليمها وتأكيد الاستلام نقداً.'
                : 'Marchandises chargées dans les camions de tournée.')}
              {orderTab === 'delivered' && (language === 'ar'
                ? 'سجل الفواتير والطلبيات المسلمة لمحلات التجار مع إيصالات الاستلام المحاسبية.'
                : 'Historique des livraisons et encaissements terminés.')}
            </p>
            {abandonedCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setOrderTab('abandoned_carts')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {language === 'ar'
                    ? `عرض السلات المتروكة التي لم تُرسل بعد (${abandonedCarts.length}) للتواصل مع التجار`
                    : `Voir les paniers non validés (${abandonedCarts.length})`}
                </span>
              </button>
            )}
          </div>
        )
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
            </div>
          )}
        </main>
      </div>


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
