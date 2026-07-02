import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loginAPI, registerAPI, verifySession, logoutAPI, refreshUser, getSessions, revokeSessionAPI, revokeOtherSessionsAPI, type SessionInfo } from '../services/authService';

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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  sessions: SessionInfo[];
  loadSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeOtherSessions: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

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

  useEffect(() => {
    const handler = () => { setUser(null); setSessions([]); };
    window.addEventListener('auth:invalid-session', handler);
    return () => window.removeEventListener('auth:invalid-session', handler);
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

  const logout = useCallback(async () => {
    await logoutAPI();
    setUser(null);
    setSessions([]);
  }, []);

  const refreshUserCallback = useCallback(async () => {
    const u = await refreshUser();
    if (u) setUser(u);
  }, []);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getSessions();
      setSessions(list);
    } catch {
      setSessions([]);
    }
  }, [user]);

  const revokeSession = useCallback(async (sessionId: string) => {
    await revokeSessionAPI(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const revokeOtherSessions = useCallback(async () => {
    const count = await revokeOtherSessionsAPI();
    await loadSessions();
    return count;
  }, [loadSessions]);

  return (
    <AuthContext.Provider value={{ user, loading, online, login, register, logout, refreshUser: refreshUserCallback, isAuthenticated: !!user, sessions, loadSessions, revokeSession, revokeOtherSessions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
