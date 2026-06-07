import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/streams', label: 'Classes' },
  { to: '/students', label: 'Students' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/scores', label: 'Grades' },
  { to: '/admin', label: 'Administration' },
];

export default function Sidebar() {
  const { adminUser, logout } = useAuth();
  const { showToast, clearCatalog } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearCatalog();
    showToast('Logged out successfully.');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">IKONEX ACADEMY</div>
        <div className="brand-subtitle">Student Management System</div>
      </div>
      <div></div>
      <nav>
        <ul className="nav-links">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
          <li style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-item"
              style={{ color: 'var(--danger-color)', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              <span>Logout ({adminUser})</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
