import { useCallback, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';
import { parseErrorMessage } from '../utils/errors';
import { AuthContext } from './auth-context';

const TOKEN_KEY = 'ikonex_admin_token';
const USERNAME_KEY = 'ikonex_admin_username';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [adminUser, setAdminUser] = useState(localStorage.getItem(USERNAME_KEY) || '');

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      setAdminUser(data.username);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USERNAME_KEY, data.username);
      return { ok: true, username: data.username };
    }
    return { ok: false, error: parseErrorMessage(data, 'Invalid credentials') };
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setAdminUser('');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }, []);

  const value = useMemo(() => ({
    token,
    adminUser,
    isAuthenticated: Boolean(token),
    authFetch,
    login,
    logout,
  }), [token, adminUser, authFetch, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
