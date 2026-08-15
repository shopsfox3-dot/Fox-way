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
  <div className="relative h-screen h-[100dvh] w-full bg-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden font-sans" dir="rtl">
    {/* Animated Background Blobs Container */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 -left-10 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
      <div className="absolute top-0 -right-10 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
    </div>

    <div className={`relative w-full ${maxWidth} z-10 my-auto transition-all duration-300`}>
      {title && (
        <div className="text-center mb-2.5 sm:mb-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-teal-400 to-emerald-600 rounded-2xl mb-1.5 shadow-lg shadow-teal-500/30">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5 font-medium">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Glass Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-scale-in">
        {children}
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-2.5 sm:mt-4 text-slate-400/80 text-[11px] sm:text-xs animate-fade-in-up">
        <span>حقوق النشر محفوظة © Fox Way</span>
      </div>
    </div>
  </div>
);

/**
 * تنسيقات مشتركة للحقول والنصوص لتسهيل إعادة الاستخدام
 */
// eslint-disable-next-line react-refresh/only-export-components
export const DesignStyles = {
  input: "w-full bg-slate-900/50 border border-white/15 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all",
  inputError: "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
  label: "block text-[10px] sm:text-[11px] font-semibold text-slate-200 mb-0.5",
  buttonPrimary: "w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-bold rounded-xl px-3.5 py-2 sm:py-2.5 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 flex items-center justify-center gap-2 mt-3"
};
