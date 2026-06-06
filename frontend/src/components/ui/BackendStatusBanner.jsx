import { API_BASE } from '../../config/api';
import { useApp } from '../../hooks/useApp';

export default function BackendStatusBanner() {
  const { backendStatus } = useApp();
  if (backendStatus) return null;

  return (
    <div className="form-card" style={{ borderLeft: '4px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.05)' }}>
      <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>API Connection Offline</h3>
      <p style={{ color: 'var(--text-secondary)' }}>
        Could not communicate with the backend at <strong>{API_BASE}</strong>. Ensure the ASP.NET Core API server is running at the configured endpoint and CORS is fully enabled.
      </p>
    </div>
  );
}
