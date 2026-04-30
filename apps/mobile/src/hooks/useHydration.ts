import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Java response: { date, totalMl, targetMl, glassCount, progressPercent }
// Today's hydration only — date param ignored (kept for API compat).
export function useHydrationDaily(_date: string) {
  return useQuery({
    queryKey: ['hydration', 'today'],
    queryFn: async () => {
      const { data } = await api.get('/goals/hydration');
      return {
        date: data.date,
        water_ml: data.totalMl ?? 0,
        target_ml: data.targetMl ?? 0,
        progress: data.progressPercent ?? 0,
        glass_count: data.glassCount ?? 0,
      };
    },
  });
}

// Java endpoint: POST /goals/hydration  body { mlToAdd }
export function useLogWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { ml: number }) => {
      const { data } = await api.post('/goals/hydration', { mlToAdd: body.ml });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hydration'] });
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
