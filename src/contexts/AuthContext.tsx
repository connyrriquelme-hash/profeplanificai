import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loginAPI, registerAPI, verifySession, logoutAPI } from '../services/authService';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'docente' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  online: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    verifySession()
      .then((u) => {
        if (u) setUser(u);
        setOnline(true);
      })
      .catch(() => {
        setOnline(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAPI(email, password);
    setUser(result.user);
    setOnline(true);
  }, []);

  const register = useCallback(async (email: string, password: string, nombre: string) => {
    const result = await registerAPI(email, password, nombre);
    setUser(result.user);
    setOnline(true);
  }, []);

  const logout = useCallback(() => {
    logoutAPI();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, online, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
