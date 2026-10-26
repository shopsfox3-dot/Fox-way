import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginPage from '@/pages/LoginPage';
import PendingApprovalPage from '@/pages/PendingApprovalPage';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import CartPage from '@/pages/CartPage';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

import AdminAccountsPage from '@/pages/AdminAccountsPage';

type Page = 'home' | 'products' | 'cart' | 'admin';

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const { t, dir } = useLanguage();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] transition-colors duration-200">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Check if user has full access (approved merchant or admin)
  const isApproved = profile?.status === 'approved' || profile?.role === 'admin';
  const isPending = profile && !isApproved;
  const justRegistered =
    typeof window !== 'undefined' && sessionStorage.getItem('just_registered') === 'true';

  // If the user has a session but is pending or rejected:
  // Only show the PendingApprovalPage if they JUST signed up
  if (session && isPending) {
    if (justRegistered) {
      return (
        <PendingApprovalPage
          onSignOut={async () => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('just_registered');
            }
            await signOut();
          }}
        />
      );
    }

    // Otherwise they are attempting to log in with a pending/unapproved account:
    // Keep them strictly on LoginPage with the inline localized error!
    const pendingMsg =
      profile.status === 'rejected'
        ? t.auth.errorRejectedByAdmin
        : profile.is_activated
        ? t.auth.errorSuspendedByAdmin
        : t.auth.errorUnapprovedNew;

    return <LoginPage initialError={pendingMsg} />;
  }

  // Prevent flicker by keeping LoginPage mounted until fully authenticated & approved
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-zinc-100 transition-colors duration-200" dir={dir}>
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
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

