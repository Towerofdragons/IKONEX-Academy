import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import StreamsPage from '../pages/StreamsPage';
import StudentsPage from '../pages/StudentsPage';
import SubjectsPage from '../pages/SubjectsPage';
import ScoresPage from '../pages/ScoresPage';
import AdminPage from '../pages/AdminPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<DashboardPage />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="scores" element={<ScoresPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
