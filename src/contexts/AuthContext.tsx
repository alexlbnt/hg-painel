import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type Role = 'PLAYER' | 'MECHANIC' | 'DM';

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
}

interface AuthContextData {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (Platform.OS === 'web') {
    return '';
  }
  return 'http://localhost:8081';
};

let inMemoryUser: User | null = null;

export const authStorage = {
  get(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('@hg_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) return parsed;
          window.localStorage.removeItem('@hg_user');
        }
      } catch (e) {
        console.error('Erro ao ler @hg_user do storage:', e);
      }
    }
    return inMemoryUser;
  },
  set(u: User | null) {
    inMemoryUser = u;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (u) {
          window.localStorage.setItem('@hg_user', JSON.stringify(u));
        } else {
          window.localStorage.removeItem('@hg_user');
        }
      } catch (e) {
        console.error('Erro ao salvar @hg_user no storage:', e);
      }
    }
  },
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = authStorage.get();
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(stored);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        authStorage.set(userData);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    authStorage.set(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
