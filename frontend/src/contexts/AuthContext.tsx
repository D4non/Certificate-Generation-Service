import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, LoginCredentials } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  organizationId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const orgId = localStorage.getItem('organization');
    setIsAuthenticated(!!token);
    setOrganizationId(orgId);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('auth_token', response.access_token);
    if (response.organization) {
      localStorage.setItem('organization', response.organization);
      setOrganizationId(response.organization);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem('organization');
    setIsAuthenticated(false);
    setOrganizationId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, organizationId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

