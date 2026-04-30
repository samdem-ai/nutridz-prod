import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useStreak() {
  return useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: async () => {
      const { data } = await api.get('/gamification/streak');
      return data as { currentStreak: number; longestStreak: number; lastLogDate: string | null };
    },
    refetchOnWindowFocus: false,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: async () => {
      const { data } = await api.get('/gamification/achievements');
      return data as {
        total: number;
        unlocked: number;
        achievements: Array<{
          id: string;
          title: string;
          description: string;
          icon: string;
          category: string;
          unlocked: boolean;
          unlockedAt: string | null;
        }>;
      };
    },
  });
}
