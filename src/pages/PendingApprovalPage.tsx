import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Clock, ShieldAlert, LogOut, User, Phone, MapPin, Mail, Store, ShieldCheck, Globe, ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { GlassShell } from '@/components/ui/DesignSystem';
import { fetchWilayas, fetchCommunes, fetchShopTypes } from '@/lib/api';
import { WILAYA_LATIN_NAMES, getShopTypeDisplayName, transliterateAlgerianName } from '@/lib/algeria_data';

interface PendingApprovalPageProps {
  onSignOut?: () => void;
}

export default function PendingApprovalPage({ onSignOut }: PendingApprovalPageProps) {
  const { profile, session, signOut } = useAuth();
  const { t, language, setLanguage, languages, dir } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [wilayaName, setWilayaName] = useState<string>('');
  const [communeName, setCommuneName] = useState<string>('');
  const [shopTypeName, setShopTypeName] = useState<string>('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const isRejected = profile?.status === 'rejected';
  const fullName = profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || t.auth.fullNameLabel;
  const phone = profile?.phone || t.common.none;
  const email = session?.user?.email || t.common.none;
  const wilayaCode = profile?.wilaya_code;

  // Load Wilaya Name
  useEffect(() => {
    if (wilayaCode) {
      const raw = wilayaCode.trim();
      const padded = raw.padStart(2, '0');
      fetchWilayas()
        .then((wilayas) => {
          const found = wilayas.find(
            (w) => w.code === raw || w.code === padded || w.name === raw
          );
          if (language !== 'ar') {
            const codeKey = found?.code || padded;
            if (WILAYA_LATIN_NAMES[codeKey]) {
              setWilayaName(`${codeKey} - ${WILAYA_LATIN_NAMES[codeKey]}`);
              return;
            }
          }
          if (found) {
            setWilayaName(`${found.code} - ${found.name}`);
          } else {
            setWilayaName(`Wilaya (${wilayaCode})`);
          }
        })
        .catch(() => {
          setWilayaName(`Wilaya (${wilayaCode})`);
        });
    }
  }, [wilayaCode, language]);

  // Load Commune Name
  useEffect(() => {
    if (wilayaCode && profile?.commune_id) {
      fetchCommunes(wilayaCode)
        .then((communes) => {
          const found = communes.find((c) => c.id === profile.commune_id);
          if (found) {
            setCommuneName(language !== 'ar' ? transliterateAlgerianName(found.name) : found.name);
          }
        })
        .catch(() => {});
    }
  }, [wilayaCode, profile?.commune_id, language]);

  // Load Shop Type Name
  useEffect(() => {
    if (profile?.shop_type_id) {
      fetchShopTypes()
        .then((types) => {
          const found = types.find((t) => t.id === profile.shop_type_id);
          if (found) {
            setShopTypeName(getShopTypeDisplayName(found, language));
          }
        })
        .catch(() => {});
    }
  }, [profile?.shop_type_id, language]);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await signOut();
    }
  };

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <div dir={dir} className="w-full flex justify-center">
      <GlassShell
        title={t.auth.pendingTitle}
        subtitle={t.auth.pendingSubtitle}
        maxWidth="max-w-[360px] sm:max-w-[430px]"
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

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Status Icon */}
          <div className="relative">
            {isRejected ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-500/20 to-rose-600/30 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10">
                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 dark:text-red-400" />
              </div>
            ) : (
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/10 to-teal-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 dark:text-amber-400" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white dark:border-[#121215]"></span>
                </span>
              </div>
            )}
          </div>

          {/* Title & Badge */}
          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border backdrop-blur-md ${
              isRejected
                ? 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
            }`}>
              {isRejected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span>
                  <span>{t.auth.pendingRejectedBadge}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                  <span>{t.auth.pendingBadge}</span>
                </>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isRejected ? t.auth.errorRejectedByAdmin : `${t.auth.pendingWelcome}، ${fullName} 👋`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {isRejected ? t.auth.pendingRejectedDesc : t.auth.pendingDesc}
            </p>
          </div>

          {/* Account Details Box */}
          <div className="w-full bg-slate-50 dark:bg-[#18181b]/80 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 shadow-sm dark:shadow-inner">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/80 dark:border-zinc-800/60">
              <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                {t.auth.fullNameLabel}
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{fullName}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/80 dark:border-zinc-800/60">
              <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                {t.auth.phoneLabel}
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono" dir="ltr">{phone}</span>
            </div>

            {shopTypeName && (
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  {t.auth.shopTypeLabel}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shopTypeName}</span>
              </div>
            )}

            {wilayaName && (
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  {t.auth.wilayaLabel}
                </span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{wilayaName}</span>
              </div>
            )}

            {communeName && (
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  {t.auth.communeLabel}
                </span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{communeName}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                {t.auth.emailLabel}
              </span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] truncate max-w-[180px]" dir="ltr">
                {email}
              </span>
            </div>
          </div>

          {/* Action Button: Sign Out Only */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full bg-[#1c1c22] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>{t.auth.signOutBtn}</span>
            </button>
          </div>

          {/* Security / Privacy Footer Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-1 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{t.auth.manualReviewNote}</span>
          </div>
        </div>
      </GlassShell>
    </div>
  );
}
