import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Landing = lazy(() => import('@/pages/Landing'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const SendMessage = lazy(() => import('@/pages/SendMessage'));
const Packages = lazy(() => import('@/pages/Packages'));
const History = lazy(() => import('@/pages/History'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));

import { SessionManager } from '@/components/auth/SessionManager';

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SessionManager />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-gray-50/50">
            <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Dashboard Layout */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<SendMessage />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Catch all - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
