import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  MapPin,
  Truck,
  Camera,
  Zap,
  Radio,
  Wallet,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  X,
  Store,
  Clock,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Building2,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import FoxLogo from '@/components/FoxLogo';

export type AdminSection =
  | 'dashboard'
  | 'inventory'
  | 'clients'
  | 'orders'
  | 'purchases'
  | 'routes'
  | 'delivery'
  | 'special_requests'
  | 'promotions'
  | 'radar'
  | 'treasury'
  | 'staff'
  | 'suppliers'
  | 'reports'
  | 'security_logs';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isRTL: boolean;
  language: string;
  onBackToStore: () => void;
  counts?: {
    pendingClients?: number;
    categories?: number;
    abandonedCarts?: number;
    securityLogs?: number;
  };
}

export default function AdminSidebar({
  currentSection,
  onSelectSection,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  isRTL,
  language,
  onBackToStore,
  counts = {},
}: AdminSidebarProps) {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';

  const navItems = [
    {
      id: 'dashboard' as AdminSection,
      label: isArabic ? 'لوحة التحكم' : isFrench ? 'Tableau de bord' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      isNotification: false,
      isReady: true,
    },
    {
      id: 'inventory' as AdminSection,
      label: isArabic ? 'المخزون والسلع' : isFrench ? 'Stock & Inventaire' : 'Stock & Catalog',
      icon: Boxes,
      badge: null,
      isNotification: false,
      isReady: true,
    },
    {
      id: 'orders' as AdminSection,
      label: isArabic ? 'الطلبيات والمبيعات' : isFrench ? 'Commandes & Ventes' : 'Orders & Sales',
      icon: ShoppingCart,
      badge: counts.abandonedCarts && counts.abandonedCarts > 0 ? `${counts.abandonedCarts}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      isNotification: Boolean(counts.abandonedCarts && counts.abandonedCarts > 0),
      isReady: true,
    },
    {
      id: 'purchases' as AdminSection,
      label: isArabic ? 'مشتريات سوق الجملة' : isFrench ? 'Achats & Appro' : 'Morning Sourcing',
      icon: ShoppingBag,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'clients' as AdminSection,
      label: isArabic ? 'العملاء والمحلات' : isFrench ? 'Clients & Magasins' : 'Clients & Shops',
      icon: Users,
      badge: counts.pendingClients && counts.pendingClients > 0 ? `${counts.pendingClients}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      isNotification: Boolean(counts.pendingClients && counts.pendingClients > 0),
      isReady: true,
    },
    {
      id: 'routes' as AdminSection,
      label: isArabic ? 'مسارات التوزيع' : isFrench ? 'Tournées & Zones' : 'Delivery Routes',
      icon: MapPin,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'delivery' as AdminSection,
      label: isArabic ? 'الشاحنة والتوصيل' : isFrench ? 'Camion & Livraison' : 'Van & Delivery',
      icon: Truck,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'treasury' as AdminSection,
      label: isArabic ? 'الخزينة والمصاريف' : isFrench ? 'Trésorerie & Dépenses' : 'Treasury & Expenses',
      icon: Wallet,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'reports' as AdminSection,
      label: isArabic ? 'التقارير والأرباح' : isFrench ? 'Rapports & Gains' : 'Reports & Profits',
      icon: BarChart3,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'staff' as AdminSection,
      label: isArabic ? 'فريق العمل والصلاحيات' : isFrench ? 'Équipe & Accès' : 'Staff & Roles',
      icon: UserCheck,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'suppliers' as AdminSection,
      label: isArabic ? 'الموردون والشركات' : isFrench ? 'Fournisseurs' : 'Suppliers',
      icon: Building2,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'special_requests' as AdminSection,
      label: isArabic ? 'طلبات السلع الناقصة' : isFrench ? 'Demandes Spéciales' : 'Item Wishlist',
      icon: Camera,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'promotions' as AdminSection,
      label: isArabic ? 'عروض الكراتين والفرص' : isFrench ? 'Promotions & Flash' : 'Flash Deals',
      icon: Zap,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'radar' as AdminSection,
      label: isArabic ? 'رادار المحلات الراكدة' : isFrench ? 'Relance Clients' : 'Client Radar',
      icon: Radio,
      badge: isArabic ? 'قريباً' : isFrench ? 'Bientôt' : 'Soon',
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      isNotification: false,
      isReady: false,
    },
    {
      id: 'security_logs' as AdminSection,
      label: isArabic ? 'سجل الأمان' : isFrench ? 'Sécurité & Logs' : 'Security Logs',
      icon: ShieldAlert,
      badge: counts.securityLogs && counts.securityLogs > 0 ? `${counts.securityLogs}` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      isNotification: Boolean(counts.securityLogs && counts.securityLogs > 0),
      isReady: true,
    },
  ];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-0 ${
          isRTL ? 'right-0' : 'left-0'
        } z-40 h-full ${
          isCollapsed ? 'w-72 lg:w-20' : 'w-72'
        } bg-[#0c1322] text-slate-300 border-r border-slate-800/80 flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Brand Header - Single Logo Source of Truth */}
        <div className={`h-16 ${isCollapsed ? 'px-3 lg:px-0 justify-between lg:justify-center' : 'px-4 justify-between'} border-b border-slate-800/80 bg-[#090e1a] flex items-center`}>
          <div className={`flex items-center ${isCollapsed ? 'gap-2.5 lg:justify-center lg:w-full' : 'gap-2.5 flex-1 min-w-0'}`}>
            <FoxLogo size="sm" iconOnly />
            <div className={isCollapsed ? 'block lg:hidden min-w-0 flex-1' : 'block min-w-0 flex-1'}>
              <span className="font-serif font-black tracking-[0.18em] text-sm sm:text-base text-white uppercase truncate block leading-none">
                FOX-WAY
              </span>
              <span className="text-[10px] tracking-[0.2em] font-bold text-slate-400 uppercase block mt-1 pr-0.5 leading-none">
                ADMIN PORTAL
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-3 lg:px-2 py-4' : 'px-3 py-4'} space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800`}>
          <div className={`px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 ${isCollapsed ? 'block lg:hidden' : 'block'}`}>
            {isArabic ? 'القائمة الرئيسية' : isFrench ? 'Menu Principal' : 'Main Menu'}
          </div>

          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
                    onClose();
                  }
                }}
                title={item.label}
                className={`w-full group relative flex items-center ${
                  isCollapsed ? 'justify-between lg:justify-center px-3.5 lg:px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span
                    className={`absolute ${
                      isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                    } top-1/2 -translate-y-1/2 w-1.5 ${isCollapsed ? 'h-6 lg:h-5' : 'h-6'} bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]`}
                  />
                )}

                <div className={`flex items-center ${isCollapsed ? 'gap-3 lg:gap-0' : 'gap-3'}`}>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/60 text-slate-400 group-hover:text-emerald-300 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`truncate ${isCollapsed ? 'block lg:hidden' : 'block'}`}>{item.label}</span>
                </div>

                {/* Badge for full state & mobile */}
                {item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isCollapsed ? 'block lg:hidden' : 'block'
                    } ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-emerald-400 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Small indicator dot on desktop ONLY when collapsed and real notification exists */}
                {item.badge && isCollapsed && item.isNotification && (
                  <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0c1322] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-slate-800/90 space-y-2 bg-[#090e1a] ${isCollapsed ? 'text-start lg:text-center' : ''}`}>
          <button
            onClick={onBackToStore}
            title={isArabic ? 'معاينة متجر التاجر' : 'Voir la boutique'}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-between lg:justify-center px-3.5 lg:px-2 py-2' : 'justify-between px-3.5 py-2'
            } rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/60 group`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span className={isCollapsed ? 'block lg:hidden' : 'block'}>{isArabic ? 'معاينة متجر التاجر' : 'Voir la boutique'}</span>
            </div>
            <ArrowIcon className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 ${isCollapsed ? 'block lg:hidden' : 'block'}`} />
          </button>

          <div className={`flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 ${isCollapsed ? 'flex lg:hidden' : 'flex'}`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isArabic ? 'النظام متصل سحابياً' : 'Système connecté'}</span>
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>v1.0</span>
            </span>
          </div>
          {isCollapsed && (
            <div className="hidden lg:flex justify-center pt-1" title={isArabic ? 'النظام متصل سحابياً v1.0' : 'Connecté v1.0'}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
