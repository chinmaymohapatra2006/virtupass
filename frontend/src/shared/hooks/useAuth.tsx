import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { SafeUser } from '../types';

interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<SafeUser>;
  registerStudent: (data: any) => Promise<SafeUser>;
  registerOrganizer: (data: any) => Promise<SafeUser>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    try {
      if (apiClient.getAccessToken()) {
        const currentUser = await apiClient.getMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.login(email, pass);
      setUser(result.user);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await apiClient.registerStudent(data);
      setUser(result.user);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerOrganizer = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await apiClient.registerOrganizer(data);
      setUser(result.user);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        registerStudent,
        registerOrganizer,
        logout,
        refetchUser
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
