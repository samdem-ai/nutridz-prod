import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Java exposes recipes under /recipes (not /community/recipes).
// Feed accepts pagination params: page, size.
export function useCommunityRecipes(filter?: string) {
  return useQuery({
    queryKey: ['community', 'recipes', filter],
    queryFn: async () => {
      const params: any = {};
      // No server-side filter by goal in Java feed; client-side filter post-fetch if needed.
      const { data } = await api.get('/recipes/feed', { params });
      return data;
    },
  });
}

export function useLikeRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/recipes/${id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

// Java DTO: { content: string }  (not { contenu })
export function useCommentRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const { data } = await api.post(`/recipes/${id}/comments`, { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

// Java exposes save (not favorite) — semantically equivalent.
export function useFavoriteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/recipes/${id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
}
