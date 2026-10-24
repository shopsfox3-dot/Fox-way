import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import CartPage from '@/pages/CartPage';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

import AdminAccountsPage from '@/pages/AdminAccountsPage';

type Page = 'home' | 'products' | 'cart' | 'admin';

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    null
  );

  // Whenever the authenticated user changes, reset back to home
  useEffect(() => {
    setPage('home');
    setSelectedCategory(null);
  }, [session?.user?.id]);

  // If a regular client somehow has page === 'admin', force return to home
  useEffect(() => {
    if (profile && profile.role !== 'admin' && page === 'admin') {
      setPage('home');
    }
  }, [profile, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
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

  const navigate = (target: 'home' | 'cart' | 'admin') => {
    setPage(target);
  };

  const selectCategory = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setPage('products');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
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
        {page === 'admin' && <AdminAccountsPage onBack={() => setPage('home')} />}
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
