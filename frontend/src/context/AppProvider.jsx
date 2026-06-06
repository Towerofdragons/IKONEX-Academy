import { useCallback, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { AppContext } from './app-context';

export function AppProvider({ children }) {
  const { authFetch } = useAuth();

  const [streams, setStreams] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchBaselineData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes, subRes] = await Promise.all([
        authFetch(`${API_BASE}/streams`),
        authFetch(`${API_BASE}/students`),
        authFetch(`${API_BASE}/subjects`),
      ]);

      if (sRes.ok && stRes.ok && subRes.ok) {
        setStreams(await sRes.json());
        setStudents(await stRes.json());
        setSubjects(await subRes.json());
        setBackendStatus(true);
      } else {
        setBackendStatus(false);
      }
    } catch (err) {
      console.error('Failed to fetch from backend API', err);
      setBackendStatus(false);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const clearCatalog = useCallback(() => {
    setStreams([]);
    setStudents([]);
    setSubjects([]);
    setBackendStatus(true);
  }, []);

  const value = useMemo(() => ({
    streams,
    students,
    subjects,
    loading,
    setLoading,
    backendStatus,
    toast,
    showToast,
    fetchBaselineData,
    clearCatalog,
  }), [streams, students, subjects, loading, backendStatus, toast, showToast, fetchBaselineData, clearCatalog]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
