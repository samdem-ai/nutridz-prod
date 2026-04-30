import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useWeightHistory() {
  return useQuery({
    queryKey: ['goals', 'weight'],
    queryFn: async () => {
      const { data } = await api.get('/goals/weight');
      return data;
    },
  });
}

export function useGoalsProgress() {
  return useQuery({
    queryKey: ['goals', 'progress'],
    queryFn: async () => {
      const { data } = await api.get('/goals/progress');
      return data;
    },
  });
}

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
