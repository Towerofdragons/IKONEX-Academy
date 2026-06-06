import { AuthProvider } from './context/AuthProvider';
import { AppProvider } from './context/AppProvider';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
