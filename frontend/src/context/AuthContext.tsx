import { createContext, useContext } from 'react';
import { User, LoginInput, RegisterInput } from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  login: (credentials: LoginInput) => Promise<void>;
  loginGuest: () => Promise<void>;
  register: (userDetails: RegisterInput) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
