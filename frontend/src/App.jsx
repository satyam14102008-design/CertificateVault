import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CertificateCardSkeleton, Skeleton } from './components/ui/Skeleton';
import { ToastContainer } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import { CertificateProvider } from './context/CertificateContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyCertificates = lazy(() => import('./pages/MyCertificates'));
const CertificateDetail = lazy(() => import('./pages/CertificateDetail'));
const Categories = lazy(() => import('./pages/Categories'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteLoadingFallback() {
  return (
    <div className="space-y-5" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <CertificateCardSkeleton />
        <CertificateCardSkeleton />
        <CertificateCardSkeleton />
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CertificateProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route
                path="/login"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Login />
                  </Suspense>
                }
              />

              <Route element={<ProtectedLayout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="certificates"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <MyCertificates />
                    </Suspense>
                  }
                />
                <Route
                  path="certificates/:id"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <CertificateDetail />
                    </Suspense>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <Categories />
                    </Suspense>
                  }
                />
                <Route
                  path="favorites"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <Favorites />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <Settings />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <NotFound />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </CertificateProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
