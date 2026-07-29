import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type Role = 'PLAYER' | 'DM';

export interface User {
  username: string;
  role: Role;
  name: string;
}

interface AuthContextData {
  user: User | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const USERS = [
  { username: 'joao.c', pass: '7392', role: 'PLAYER' as Role, name: 'João' },
  { username: 'pastor.j', pass: '4815', role: 'PLAYER' as Role, name: 'Pastor' },
  { username: 'lobo.l', pass: '9024', role: 'PLAYER' as Role, name: 'Lobo' },
  { username: 'luis.k', pass: '1568', role: 'PLAYER' as Role, name: 'Luis' },
  { username: 'allan.m', pass: '6271', role: 'PLAYER' as Role, name: 'Allan' },
  { username: 'dantas.p', pass: '3840', role: 'PLAYER' as Role, name: 'Dantas' },
  { username: 'gabi.f', pass: '8193', role: 'PLAYER' as Role, name: 'Gabi' },
  { username: 'alex.g', pass: '2807', role: 'DM' as Role, name: 'Alex (Mestre)' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from local storage
    if (Platform.OS === 'web') {
      try {
        const storedUser = localStorage.getItem('@hg_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, pass: string) => {
    const foundUser = USERS.find(u => u.username === username.toLowerCase().trim() && u.pass === pass);
    if (foundUser) {
      const userData = { username: foundUser.username, role: foundUser.role, name: foundUser.name };
      setUser(userData);
      if (Platform.OS === 'web') {
        localStorage.setItem('@hg_user', JSON.stringify(userData));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    if (Platform.OS === 'web') {
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
