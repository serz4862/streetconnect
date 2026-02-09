import { create } from 'zustand';
import { User } from '@/types';
import { storage } from '@/services/storage';
import { apiService } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  phoneLogin: (data: { phone: string; country_code: string; otp: string; name?: string; pincode?: string }) => Promise<void>;
  login: (phone: string, firebaseToken: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      storage.setUser(user);
    }
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token });
    if (token) {
      storage.setToken(token);
    }
  },

  phoneLogin: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiService.phoneLogin(data);
      const { user, token } = response;
      await storage.setToken(token);
      await storage.setUser(user);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.error || 'Login failed', isLoading: false });
      throw error;
    }
  },

  login: async (phone, firebaseToken) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiService.login({ phone, firebase_token: firebaseToken });
      const { user, token } = response;
      
      await storage.setToken(token);
      await storage.setUser(user);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiService.signup(data);
      const { user, token } = response;
      
      await storage.setToken(token);
      await storage.setUser(user);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.error || 'Signup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.clear();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const [token, user] = await Promise.all([
        storage.getToken(),
        storage.getUser(),
      ]);

      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (user) => {
    set({ user });
    storage.setUser(user);
  },
}));
