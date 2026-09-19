import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Account State (Personal vs Organization)
  const [activeAccount, setActiveAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('arcturus_active_account');
      return saved ? JSON.parse(saved) : { type: 'personal' };
    } catch {
      return { type: 'personal' };
    }
  });

  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  const refreshOrganizations = async (authToken = token) => {
    const t = authToken || localStorage.getItem('authToken');
    if (!t) {
      setUserOrganizations([]);
      return [];
    }
    try {
      setLoadingOrganizations(true);
      const res = await fetch(`${API_BASE_URL}/organizations/my`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        const orgs = data.organizations || [];
        setUserOrganizations(orgs);
        return orgs;
      }
    } catch (err) {
      console.error('Failed to fetch user organizations:', err);
    } finally {
      setLoadingOrganizations(false);
    }
    return [];
  };

  const switchAccount = (target) => {
    if (!target || target === 'personal' || target.type === 'personal') {
      const personalAcc = { type: 'personal' };
      setActiveAccount(personalAcc);
      localStorage.setItem('arcturus_active_account', JSON.stringify(personalAcc));
      return personalAcc;
    }

    const orgAcc = {
      type: 'organization',
      id: target._id || target.id || target.orgId,
      orgId: target._id || target.id || target.orgId,
      name: target.name || target.orgName || 'Organization',
      slug: target.slug || target.orgSlug || '',
      logo: target.logo?.url || target.logoUrl || target.orgLogo || target.logo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      role: target.role || target.orgRole || 'Admin',
      status: target.status || target.orgStatus || 'approved',
      industry: target.industry || '',
      tagline: target.tagline || '',
      location: target.location || '',
    };

    setActiveAccount(orgAcc);
    localStorage.setItem('arcturus_active_account', JSON.stringify(orgAcc));
    return orgAcc;
  };

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        refreshOrganizations(storedToken);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      refreshOrganizations(data.token);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      refreshOrganizations(data.token);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('arcturus_active_account');
    setActiveAccount({ type: 'personal' });
    setUserOrganizations([]);
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Failed to process forgot password');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetToken, newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Failed to reset password');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        activeAccount,
        switchAccount,
        userOrganizations,
        refreshOrganizations,
        loadingOrganizations,
        isOrgAccount: activeAccount?.type === 'organization',
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
