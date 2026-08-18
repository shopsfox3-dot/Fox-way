import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn && sentryDsn !== 'placeholder_sentry_dsn') {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^\//],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// eslint-disable-next-line react-refresh/only-export-components
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold">
        ⚠️
      </div>
      <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        تم تسجيل هذا الخطأ تلقائياً في نظام المراقبة Sentry وسنعمل على معالجته فوراً. يرجى إعادة تحميل الصفحة.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl transition-all text-sm shadow-lg shadow-teal-600/20"
      >
        إعادة تحميل الصفحة
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);

