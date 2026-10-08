'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { ApiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string, account_id?: string) => Promise<void>;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check saved dark mode preference
    const savedTheme = localStorage.getItem('route53_dark_mode');
    if (savedTheme === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check active session
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('route53_token');
        if (token) {
          const currentUser = await ApiClient.getMe();
          setUser(currentUser);
        } else {
          // If no token, check if logged-in mock exists
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('route53_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('route53_dark_mode', 'false');
      }
      return next;
    });
  };

  const login = async (username: string, pass: string, account_id?: string) => {
    const res = await ApiClient.login(username, pass, account_id);
    localStorage.setItem('route53_token', res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('route53_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
