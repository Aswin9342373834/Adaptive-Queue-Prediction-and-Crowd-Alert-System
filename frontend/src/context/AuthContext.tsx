import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, AuthUser, UserRole } from '../types/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

const AUTH_STORAGE_KEY = 'smart_bank_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const role: UserRole = user?.role ?? null;
  const isAuthenticated = user !== null;

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (selectedRole: 'manager' | 'staff' | 'receptionist', email: string, counter?: string) => {
    const isMgr = selectedRole === 'manager';
    const isRec = selectedRole === 'receptionist';
    const newUser: AuthUser = {
      id: isMgr ? 'MGR-7701' : isRec ? 'REC-1008' : 'STF-3042',
      name: isMgr
        ? 'Aswin (Branch Operations Manager)'
        : isRec
        ? 'Priya Nair (Front Desk Receptionist)'
        : 'Sarah Jenkins (Counter Officer)',
      email:
        email ||
        (isMgr
          ? 'manager@smartbank.com'
          : isRec
          ? 'receptionist@smartbank.com'
          : 'staff@smartbank.com'),
      role: selectedRole,
      counterNumber: isMgr ? undefined : isRec ? 'Reception Desk' : (counter || 'Counter 03'),
      branchName: 'Metro Central Flagship Branch',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout }}>
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
