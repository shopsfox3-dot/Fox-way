import React from 'react';
import { Store } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const GlassShell = ({
  children,
  title,
  subtitle,
  maxWidth = "max-w-[330px] sm:max-w-[380px] md:max-w-[410px]"
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
}) => {
  const { dir, language } = useLanguage();

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full bg-slate-100 dark:bg-[#09090b] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans py-4 sm:py-8 transition-colors duration-300" dir={dir}>
      {/* Ambient Glow Gradient Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-100">
        <div className="absolute -top-24 -left-20 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full filter blur-[140px] animate-blob"></div>
        <div className="absolute top-1/4 -right-24 w-80 sm:w-[450px] h-80 sm:h-[450px] bg-teal-500/15 dark:bg-indigo-600/15 rounded-full filter blur-[140px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-80 sm:w-[420px] h-80 sm:h-[420px] bg-emerald-400/15 dark:bg-teal-500/15 rounded-full filter blur-[140px] animate-blob animation-delay-4000"></div>
      </div>

      <div className={`relative w-full ${maxWidth} z-10 my-auto transition-all duration-300`}>
        {title && (
          <div className="text-center mb-3 sm:mb-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl mb-2 shadow-neon-sm ring-1 ring-white/20">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950 font-bold" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs mt-0.5 font-medium">{subtitle}</p>}
          </div>
        )}
        
        {/* Main Glass Card */}
        <div className="backdrop-blur-2xl bg-white/95 dark:bg-[#121215]/90 border border-slate-200/90 dark:border-zinc-800/90 shadow-xl dark:shadow-2xl dark:shadow-black/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 ring-1 ring-slate-950/5 dark:ring-white/5 animate-scale-in transition-colors duration-200">
          {children}
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-slate-400 dark:text-zinc-500 text-[11px] sm:text-xs animate-fade-in-up">
          <span>
            {language === 'ar'
              ? 'حقوق النشر محفوظة © Fox Way'
              : language === 'fr'
              ? 'Tous droits réservés © Fox Way'
              : 'All rights reserved © Fox Way'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * تنسيقات مشتركة للحقول والنصوص بنمط متكيف مع الوضعين النهاري والليلي
 */
// eslint-disable-next-line react-refresh/only-export-components
export const DesignStyles = {
  input: "w-full bg-slate-50 dark:bg-[#18181b]/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all",
  inputError: "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
  label: "block text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-0.5",
  buttonPrimary: "w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 text-xs font-bold rounded-xl px-3.5 py-2 sm:py-2.5 shadow-neon-sm hover:shadow-neon-emerald hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 flex items-center justify-center gap-2 mt-3"
};
