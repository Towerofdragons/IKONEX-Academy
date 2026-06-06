import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../ui/Toast';
import BackendStatusBanner from '../ui/BackendStatusBanner';
import LoadingIndicator from '../ui/LoadingIndicator';
import { useApp } from '../../hooks/useApp';

export default function AppLayout() {
  const { fetchBaselineData } = useApp();

  useEffect(() => {
    fetchBaselineData();
  }, [fetchBaselineData]);

  return (
    <div className="app-container">
      <Toast />
      <Sidebar />
      <main className="main-content">
        <BackendStatusBanner />
        <LoadingIndicator />
        <Outlet />
      </main>
    </div>
  );
}
