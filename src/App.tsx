import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import CartPage from '@/pages/CartPage';
import Header from '@/components/Header';
import { Loader2, Clock, XCircle } from 'lucide-react';

type Page = 'home' | 'products' | 'cart';

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    null
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (profile && profile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">تم استلام طلبك بنجاح</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            حسابك حالياً في انتظار المراجعة. سيتم التواصل معك لتفعيل الحساب خلال 24-48 ساعة.
          </p>
          <button
            onClick={signOut}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (profile && profile.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">تم رفض الحساب</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            نعتذر منك، لقد تم رفض طلب تفعيل حسابك. يرجى التواصل مع الدعم الفني للمزيد من التفاصيل.
          </p>
          <button
            onClick={signOut}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const navigate = (target: 'home' | 'cart') => {
    setPage(target);
  };

  const selectCategory = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setPage('products');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onNavigate={navigate} currentPage={page} />
      <main>
        {page === 'home' && <HomePage onSelectCategory={selectCategory} />}
        {page === 'products' && selectedCategory && (
          <ProductsPage
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onBack={() => setPage('home')}
          />
        )}
        {page === 'cart' && <CartPage onBack={() => setPage('home')} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
