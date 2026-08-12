import { useEffect, useState } from 'react';
import { fetchCategories, fetchProductCountByCategory } from '@/lib/api';
import { getCategoryIcon } from '@/components/CategoryIcon';
import type { Category } from '@/types';
import { ShoppingBasket, Loader2, ArrowLeft, TrendingUp, Truck, ShieldCheck } from 'lucide-react';

interface HomePageProps {
  onSelectCategory: (categoryId: string, categoryName: string) => void;
}

export default function HomePage({ onSelectCategory }: HomePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProductCountByCategory()])
      .then(([cats, cnt]) => {
        setCategories(cats);
        setCounts(cnt);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-teal-600 to-teal-500 p-8 md:p-12 mb-8 animate-fade-in-up">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            أهلاً بك في متجر التوزيع
          </h1>
          <p className="text-teal-50 text-sm md:text-base mb-6 max-w-md">
            اطلب منتجاتك بالجملة مباشرة من التاجر بأسعار منافسة وتوصيل سريع
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <Truck className="w-4 h-4" />
              <span>توصيل لكل الولايات</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>جودة مضمونة</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 text-white text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>أسعار الجملة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">أقسام المنتجات</h2>
        <span className="text-sm text-slate-500">{categories.length} أقسام</span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat, index) => {
            const Icon = getCategoryIcon(cat.icon);
            const count = counts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id, cat.name)}
                className="card p-5 text-right group hover:shadow-md hover:border-teal-200 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors duration-300">
                    <Icon className="w-7 h-7 text-teal-600" />
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:-translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <ShoppingBasket className="w-3.5 h-3.5" />
                  {count} منتج
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
