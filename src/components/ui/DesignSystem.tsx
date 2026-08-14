import React from 'react';
import { Store } from 'lucide-react';

export const GlassShell = ({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) => (
  <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden font-sans" dir="rtl">
    {/* Animated Background Blobs */}
    <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
    <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

    <div className="relative w-full max-w-md z-10 my-8">
      {title && (
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-teal-400 to-emerald-600 rounded-2xl mb-4 shadow-xl shadow-teal-500/30">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-300 text-sm mt-2 font-medium">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Glass Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 animate-scale-in">
        {children}
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-8 text-slate-400/80 text-sm animate-fade-in-up">
        <span>حقوق النشر محفوظة © Fox Way</span>
      </div>
    </div>
  </div>
);

/**
 * تنسيقات مشتركة للحقول والنصوص لتسهيل إعادة الاستخدام
 */
export const DesignStyles = {
  input: "w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all",
  inputError: "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
  label: "block text-sm font-medium text-slate-300 mb-2",
  buttonPrimary: "w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-4 py-3 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 flex items-center justify-center gap-2 mt-6"
};
