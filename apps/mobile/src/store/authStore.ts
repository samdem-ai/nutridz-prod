import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

// Matches Java backend UserResponse / RegisterRequest contracts
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  gender: string | null;
  birthDate: string | null;        // ISO date "YYYY-MM-DD"
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;    // SEDENTARY | LIGHT | MODERATE | VERY_ACTIVE | EXTRA_ACTIVE
  workType: string | null;         // DESK | STANDING | PHYSICAL
  workoutType: string | null;      // CARDIO | STRENGTH | MIXED | NONE
  diabetesType: string | null;     // NONE | TYPE_1 | TYPE_2 | GESTATIONAL | PREDIABETES
  allergies: string | null;
  nutritionGoal: string | null;    // WEIGHT_LOSS | MUSCLE_GAIN | MAINTENANCE | BALANCED | SPECIFIC_DIET
  dailyCalorieTarget: number | null;
  dailyProteinTarget: number | null;
  dailyCarbTarget: number | null;
  dailyFatTarget: number | null;
  dailyWaterTargetMl: number | null;
  createdAt: string | null;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  workType?: string;
  workoutType?: string;
  diabetesType?: string;
  allergies?: string;
  nutritionGoal?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    // Java AuthResponse: { token, tokenType, userId, username, email, expiresIn }
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('access_token', data.token);

    const { data: user } = await api.get<User>('/auth/me');
    set({ user, isAuthenticated: true });
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    await SecureStore.setItemAsync('access_token', data.token);

    const { data: user } = await api.get<User>('/auth/me');
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
      const { data: user } = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    // Java exposes profile update on /auth/me, not /users/profile
    const { data: updated } = await api.put<User>('/auth/me', data);
    set({ user: updated });
  },
}));
