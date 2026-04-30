import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useJournalDaily(date: string) {
  return useQuery({
    queryKey: ['journal', 'daily', date],
    queryFn: async () => {
      const { data } = await api.get('/journal/daily', { params: { date } });
      return data;
    },
    enabled: !!date,
  });
}

export function useJournalSummary(date: string) {
  return useQuery({
    queryKey: ['journal', 'summary', date],
    queryFn: async () => {
      const { data } = await api.get('/journal/daily', { params: { date } });
      return {
        calories: data.totalCalories || 0,
        protein: data.totalProtein || 0,
        carbs: data.totalCarbs || 0,
        fat: data.totalFat || 0,
        caloriesTarget: data.targetCalories,
        proteinTarget: data.targetProtein,
        carbsTarget: data.targetCarbs,
        fatTarget: data.targetFat,
        waterMl: data.waterMl || 0,
        meals: data.meals || {},
      };
    },
    enabled: !!date,
  });
}

export function useAddJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      foodId?: number;
      recipeId?: number;
      mealType: string;
      quantityGrams: number;
      logSource: string;
      date: string;
    }) => {
      const { data } = await api.post('/journal', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
