import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Java response shape for GET /journal/daily?date= :
// {
//   date, totalCalories, totalProtein, totalCarbs, totalFat, waterMl,
//   targetCalories, targetProtein, targetCarbs, targetFat, targetWaterMl,
//   caloriesProgress, proteinProgress, carbsProgress, fatProgress, waterProgress,
//   meals: { BREAKFAST: [...], LUNCH: [...], DINNER: [...], SNACK: [...] }
// }

export function useJournalDaily(date: string) {
  return useQuery({
    queryKey: ['journal', 'daily', date],
    queryFn: async () => {
      const { data } = await api.get(`/journal/daily`, { params: { date } });
      return data;
    },
    enabled: !!date,
  });
}

export function useJournalSummary(date: string) {
  return useQuery({
    queryKey: ['journal', 'summary', date],
    queryFn: async () => {
      const { data } = await api.get(`/journal/daily`, { params: { date } });
      return {
        calories: data.totalCalories ?? 0,
        protein_g: data.totalProtein ?? 0,
        carbs_g: data.totalCarbs ?? 0,
        fat_g: data.totalFat ?? 0,
        water_ml: data.waterMl ?? 0,
        calories_target: data.targetCalories,
        protein_target: data.targetProtein,
        carbs_target: data.targetCarbs,
        fat_target: data.targetFat,
        water_target_ml: data.targetWaterMl,
      };
    },
    enabled: !!date,
  });
}

// mealType enum: BREAKFAST | LUNCH | DINNER | SNACK
// logSource enum: MANUAL_SEARCH | AI_PHOTO | BARCODE_SCAN | MEAL_PLAN
export function useAddJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      foodId?: number;
      recipeId?: number;
      quantityGrams: number;
      mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      date: string;
      logSource?: 'MANUAL_SEARCH' | 'AI_PHOTO' | 'BARCODE_SCAN' | 'MEAL_PLAN';
    }) => {
      const { data } = await api.post('/journal', {
        foodId: body.foodId,
        recipeId: body.recipeId,
        mealType: body.mealType,
        quantityGrams: body.quantityGrams,
        logSource: body.logSource ?? 'MANUAL_SEARCH',
        date: body.date,
      });
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
