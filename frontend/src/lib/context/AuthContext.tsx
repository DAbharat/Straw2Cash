import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types/auth';
import { INITIAL_USERS } from '../mockData';
import { goBackendApi } from '../api/goService';
import { javaRulesApi } from '../api/javaService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, passwordOrRole?: string, role?: UserRole) => Promise<void>;
  register: (data: Partial<UserProfile>, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 's2c_auth_session';
const TOKEN_STORAGE_KEY = 's2c_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default to the first farmer user
    return INITIAL_USERS[0];
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || (user ? `go_jwt_${user.id}` : null);
    } catch {
      return user ? `go_jwt_${user.id}` : null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [user, token]);

  const login = async (emailOrPhone: string, passwordOrRole?: string, role?: UserRole) => {
    const isBaler = role === 'baler' || passwordOrRole === 'baler';
    if (isBaler) {
      const res = await goBackendApi.login(emailOrPhone, passwordOrRole === 'baler' ? 'baler123' : passwordOrRole);
      setUser(res.user);
      setToken(res.token);
    } else {
      const res = await javaRulesApi.login(emailOrPhone, passwordOrRole);
      setUser(res.user);
      setToken(res.token);
    }
  };

  const register = async (data: Partial<UserProfile>, password?: string) => {
    if (data.role === 'baler') {
      const res = await goBackendApi.register(data, password);
      setUser(res.user);
      setToken(res.token);
    } else {
      const res = await javaRulesApi.register(data, password);
      setUser(res.user);
      setToken(res.token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const switchRole = (newRole: UserRole) => {
    const matching = INITIAL_USERS.find((u) => u.role === newRole);
    if (matching) {
      setUser(matching);
      setToken(`go_jwt_${matching.id}`);
    } else if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await goBackendApi.updateProfile(user.id, updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'farmer',
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
