import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCommunityRecipes(page = 0, size = 20) {
  return useQuery({
    queryKey: ['recipes', 'feed', page],
    queryFn: async () => {
      const { data } = await api.get('/recipes/feed', { params: { page, size } });
      return data;
    },
  });
}

export function useMyRecipes() {
  return useQuery({
    queryKey: ['recipes', 'mine'],
    queryFn: async () => {
      const { data } = await api.get('/recipes/my');
      return data;
    },
  });
}

export function useRecipe(id: number | null) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data } = await api.get(`/recipes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      titleAr?: string;
      description?: string;
      imageUrl?: string;
      prepTimeMinutes?: number;
      servings?: number;
      category: string;
      isAlgerian?: boolean;
      isPublic?: boolean;
      ingredients?: Array<{ foodId: number; quantityGrams: number; label?: string }>;
      steps?: Array<{ stepNumber: number; description: string }>;
    }) => {
      const { data } = await api.post('/recipes', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useLikeRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/recipes/${id}/like`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useCommentRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const { data } = await api.post(`/recipes/${id}/comments`, { content });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useSaveRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/recipes/${id}/save`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useReportRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.post(`/recipes/${id}/report`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
