import React from 'react';
import { Store } from 'lucide-react';

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
}) => (
  <div className="relative min-h-screen min-h-[100dvh] w-full bg-[#09090b] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans py-4 sm:py-8" dir="rtl">
    {/* Ambient Glow Gradient Mesh (Higgsfield Style) */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -left-20 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-emerald-500/20 rounded-full filter blur-[140px] animate-blob"></div>
      <div className="absolute top-1/4 -right-24 w-80 sm:w-[450px] h-80 sm:h-[450px] bg-indigo-600/15 rounded-full filter blur-[140px] animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/3 w-80 sm:w-[420px] h-80 sm:h-[420px] bg-teal-500/15 rounded-full filter blur-[140px] animate-blob animation-delay-4000"></div>
    </div>

    <div className={`relative w-full ${maxWidth} z-10 my-auto transition-all duration-300`}>
      {title && (
        <div className="text-center mb-3 sm:mb-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl mb-2 shadow-neon-sm ring-1 ring-white/20">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950 font-bold" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-zinc-400 text-[11px] sm:text-xs mt-0.5 font-medium">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Glass Card with 1px border and deep surface */}
      <div className="backdrop-blur-2xl bg-[#121215]/90 border border-zinc-800/90 shadow-2xl shadow-black/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 ring-1 ring-white/5 animate-scale-in">
        {children}
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-zinc-500 text-[11px] sm:text-xs animate-fade-in-up">
        <span>حقوق النشر محفوظة © Fox Way</span>
      </div>
    </div>
  </div>
);

/**
 * تنسيقات مشتركة للحقول والنصوص بنمط Higgsfield الفاخر
 */
// eslint-disable-next-line react-refresh/only-export-components
export const DesignStyles = {
  input: "w-full bg-[#18181b]/80 border border-zinc-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all",
  inputError: "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
  label: "block text-[10px] sm:text-[11px] font-semibold text-zinc-300 mb-0.5",
  buttonPrimary: "w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 text-xs font-bold rounded-xl px-3.5 py-2 sm:py-2.5 shadow-neon-sm hover:shadow-neon-emerald hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 flex items-center justify-center gap-2 mt-3"
};
