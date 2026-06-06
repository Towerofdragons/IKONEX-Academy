import { useState } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { parseErrorMessage } from '../utils/errors';

export default function AdminPage() {
  const { authFetch } = useAuth();
  const { loading, setLoading, showToast } = useApp();
  const [inviteForm, setInviteForm] = useState({ username: '', password: '' });

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!inviteForm.username.trim() || !inviteForm.password) return;

    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Admin account "${data.username}" successfully registered!`);
        setInviteForm({ username: '', password: '' });
      } else {
        showToast(parseErrorMessage(data, 'Failed to register admin'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Admin Management Deck</h2>
      </div>

      <div className="card-grid">
        <div className="form-card">
          <h3>Invite / Register New Admin</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
            Register a new administrative account. Only authorized administrators can perform this action.
          </p>
          <form onSubmit={handleInviteAdmin}>
            <div className="form-group">
              <label className="form-label">New Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={inviteForm.username}
                onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register Admin'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
