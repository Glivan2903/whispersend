import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import DashboardLayout from '@/components/layout/DashboardLayout';
// Placeholder components for now
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import SendMessage from '@/pages/SendMessage';
import Packages from '@/pages/Packages';
import History from '@/pages/History';
import Profile from '@/pages/Profile';

function App() {
  const { initialize, loading } = useAuthStore();


  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
