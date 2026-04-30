import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  gender: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  workType: string | null;
  workoutType: string | null;
  diabetesType: string | null;
  allergies: string | null;
  nutritionGoal: string | null;
  dailyCalorieTarget: number | null;
  dailyProteinTarget: number | null;
  dailyCarbTarget: number | null;
  dailyFatTarget: number | null;
  dailyWaterTargetMl: number | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('access_token', data.token);

    const { data: user } = await api.get('/auth/me');
    set({ user, isAuthenticated: true });
  },

  register: async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    await SecureStore.setItemAsync('access_token', data.token);

    const { data: user } = await api.get('/auth/me');
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data: user } = await api.get('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const { data: updated } = await api.put('/auth/me', data);
    set({ user: updated });
  },
}));
