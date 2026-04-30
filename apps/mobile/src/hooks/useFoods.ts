import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: async () => {
      const { data } = await api.get(`/foods/search`, { params: { q: query } });
      return data;
    },
    enabled: query.length >= 2,
  });
}

// Java backend has no GET /foods (list-all). Browse-by-category instead.
// Pass a FoodCategory enum value:
//   ALGERIAN_DISH | DAIRY | MEAT | VEGETABLE | FRUIT | GRAIN | LEGUME | BEVERAGE | SNACK | OTHER
export function useFoodsByCategory(category: string) {
  return useQuery({
    queryKey: ['foods', 'category', category],
    queryFn: async () => {
      const { data } = await api.get(`/foods/category/${category}`);
      return data;
    },
    enabled: !!category,
  });
}

export function useFoodDetail(id: number | null) {
  return useQuery({
    queryKey: ['foods', id],
    queryFn: async () => {
      const { data } = await api.get(`/foods/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useFoodByBarcode(barcode: string | null) {
  return useQuery({
    queryKey: ['foods', 'barcode', barcode],
    queryFn: async () => {
      const { data } = await api.get(`/foods/barcode/${barcode}`);
      return data;
    },
    enabled: !!barcode,
  });
}
