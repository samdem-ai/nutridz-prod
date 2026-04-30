import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useHydrationDaily(date: string) {
  return useQuery({
    queryKey: ['hydration', 'daily', date],
    queryFn: async () => {
      const { data } = await api.get('/goals/hydration');
      return data;
    },
    enabled: !!date,
  });
}

export function useLogWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { mlToAdd: number }) => {
      const { data } = await api.post('/goals/hydration', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hydration'] });
    },
  });
}
