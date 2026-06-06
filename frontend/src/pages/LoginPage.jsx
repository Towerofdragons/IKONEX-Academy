import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import Toast from '../components/ui/Toast';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Login - IKONEX Academy';
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) return;

    setLoading(true);
    try {
      const result = await login(loginForm.username, loginForm.password);
      if (result.ok) {
        showToast(`Welcome back, ${result.username}!`);
        navigate('/');
      } else {
        showToast(result.error, 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <Toast />
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo" style={{ margin: '0 auto 1rem auto' }}>IKONEX ACADEMY</div>
          <h2 className="brand-name" style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>Student Management Admin</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>Sign in to access school administration</p>
        </div>
        <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter admin username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '46px', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
