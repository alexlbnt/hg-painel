import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type Role = 'PLAYER' | 'DM';

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

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from local storage
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedUser = localStorage.getItem('@hg_user');
        if (storedUser) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, pass: string) => {
    if (Platform.OS === 'web') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: pass }),
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('@hg_user', JSON.stringify(userData));
          }
          return true;
        }
      } catch (e) {
        console.error('Login error:', e);
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('@hg_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
