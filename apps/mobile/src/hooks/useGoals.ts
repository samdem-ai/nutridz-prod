import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Java response item: { id, weightKg, bmi, recordedOn, createdAt }
export function useWeightHistory() {
  return useQuery({
    queryKey: ['goals', 'weight'],
    queryFn: async () => {
      const { data } = await api.get('/goals/weight');
      return data;
    },
  });
}

// Java response: { currentWeight, startingWeight, currentBmi, weightChange, history: [...] }
export function useGoalsProgress() {
  return useQuery({
    queryKey: ['goals', 'progress'],
    queryFn: async () => {
      const { data } = await api.get('/goals/progress');
      return data;
    },
  });
}

// Java request: { weightKg, date }
export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { weightKg: number; date: string }) => {
      const { data } = await api.post('/goals/weight', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteWeightLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: number) => {
      await api.delete(`/goals/weight/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
