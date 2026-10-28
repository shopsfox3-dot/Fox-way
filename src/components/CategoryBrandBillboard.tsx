import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles } from 'lucide-react';

interface CategoryBrandBillboardProps {
  brandImages?: string[];
  categoryName: string;
}

export function CategoryBrandBillboard({
  brandImages,
  categoryName,
}: CategoryBrandBillboardProps) {
  const { language } = useLanguage();
  const [index, setIndex] = useState(0);
  const images = (brandImages || []).filter((img) => img && img.trim().length > 0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-zinc-900 dark:to-zinc-950 border border-slate-200/90 dark:border-zinc-800/80 flex flex-col items-center justify-center p-3 mb-2 overflow-hidden group-hover:border-emerald-500/40 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
          {language === 'ar' ? 'تشكيلة أصلية بالجملة' : language === 'fr' ? 'Sélection originale' : 'Original Selection'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 shadow-sm group mb-2">
      {/* Rotating Brand Image filling 100% of the aspect container */}
      <img
        key={images[index]}
        src={images[index]}
        alt={`${categoryName} Brand ${index + 1}`}
        className="w-full h-full object-cover transition-all duration-700 animate-fade-in group-hover:scale-105"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
        }}
      />
    </div>
  );
}

export default CategoryBrandBillboard;



