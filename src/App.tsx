import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import CartPage from '@/pages/CartPage';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

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

  // If they somehow have a session but are not approved, sign them out silently
  const isApproved = profile?.status === 'approved' || profile?.role === 'admin';
  if (session && profile && !isApproved) {
    setTimeout(() => {
      signOut();
    }, 100);
  }

  // Prevent flicker by always keeping LoginPage mounted until fully approved
  if (!session || !profile || !isApproved) {
    return <LoginPage />;
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
