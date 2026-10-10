import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types/auth';
import { INITIAL_USERS } from '../mockData';
import { goBackendApi } from '../api/goService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, role?: UserRole) => Promise<void>;
  register: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 's2c_auth_session';

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
    return user ? `go_jwt_${user.id}` : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (emailOrPhone: string, targetRole?: UserRole) => {
    const res = await goBackendApi.login(emailOrPhone, targetRole);
    setUser(res.user);
    setToken(res.token);
  };

  const register = async (data: Partial<UserProfile>) => {
    const res = await goBackendApi.register(data);
    setUser(res.user);
    setToken(res.token);
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
