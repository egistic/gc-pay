import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Role } from '../types';
import { UserService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  hasRole: (roleCode: string) => boolean;
  hasAnyRole: (roleCodes: string[]) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      // Check for existing token in localStorage
      const savedToken = localStorage.getItem('auth_token');
        
      if (savedToken && isMounted) {
        setToken(savedToken);
        try {
          // Try to get current user with the saved token
          const currentUser = await UserService.getCurrentUser();
          if (isMounted) {
            setUser(currentUser);
          }
        } catch (err) {
          console.error('Failed to load current user:', err);
          // Token might be expired, clear it
          if (isMounted) {
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create form data for OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      setToken(data.access_token);
      localStorage.setItem('auth_token', data.access_token);
      
      // Get user data
      const userData = await UserService.getCurrentUser();
      setUser(userData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    setError(null);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const userData = await UserService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      // If refresh fails, user might need to log in again
      logout();
    }
  };

  // Role checking functions
  const hasRole = (roleCode: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.code === roleCode);
  };

  const hasAnyRole = (roleCodes: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => roleCodes.includes(role.code));
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    refreshUser,
    hasRole,
    hasAnyRole,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
