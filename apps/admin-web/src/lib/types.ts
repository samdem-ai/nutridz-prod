export type FoodCategory = 'PACKAGED_PRODUCT' | 'INGREDIENT' | 'ALGERIAN_DISH' | 'HEALTHY_RECIPE';
export const CATEGORIES: FoodCategory[] = ['PACKAGED_PRODUCT', 'INGREDIENT', 'ALGERIAN_DISH', 'HEALTHY_RECIPE'];
export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ServingSize {
  label: string;
  grams: number;
}

export interface NutritionFields {
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  saltPer100g: number | null;
}

export interface ProductPayload extends NutritionFields {
  barcode: string | null;
  codeFormat: string | null;
  name: string;
  nameAr: string | null;
  brand: string | null;
  category: FoodCategory;
  nutritionalScore: NutriScore | null;
  servingSizes: ServingSize[];
  productImage?: string | null;
  labelImage?: string | null;
  ocrText?: string | null;
  targetFoodId?: number | null;
}

export interface Submission extends NutritionFields {
  id: number;
  barcode: string | null;
  codeFormat: string | null;
  name: string;
  nameAr: string | null;
  brand: string | null;
  category: FoodCategory;
  nutritionalScore: NutriScore | null;
  servingSizes: ServingSize[];
  productImage: string | null;
  labelImage: string | null;
  ocrText: string | null;
  status: SubmissionStatus;
  rejectReason: string | null;
  targetFoodId: number | null;
  foodId: number | null;
  submittedBy: number;
  submittedByName: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

export interface Food extends NutritionFields {
  id: number;
  name: string;
  nameAr: string | null;
  brand: string | null;
  category: FoodCategory;
  source: string;
  nutritionalScore: NutriScore | null;
  barcode: string | null;
  imageUrl: string | null;
  verified: boolean;
  servingSizes: ServingSize[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface BarcodeCheck {
  barcode: string;
  existingFood: Food | null;
  pendingSubmissionId: number | null;
}

export interface Stats {
  totalFoods: number;
  verifiedFoods: number;
  foodsWithBarcode: number;
  pending: number;
  approved: number;
  rejected: number;
  submittedToday: number;
  foodsByCategory: Record<string, number>;
  contributors: { userId: number; username: string; submitted: number; approved: number }[];
}

export interface Me {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
}

export const NUTRIENT_FIELDS: { key: keyof NutritionFields; unit: string; max: number }[] = [
  { key: 'caloriesPer100g', unit: 'kcal', max: 900 },
  { key: 'proteinPer100g', unit: 'g', max: 100 },
  { key: 'carbsPer100g', unit: 'g', max: 100 },
  { key: 'sugarPer100g', unit: 'g', max: 100 },
  { key: 'fatPer100g', unit: 'g', max: 100 },
  { key: 'fiberPer100g', unit: 'g', max: 100 },
  { key: 'saltPer100g', unit: 'g', max: 100 },
];

export interface LabelOcrResult {
  found: boolean;
  name?: string | null;
  nameAr?: string | null;
  brand?: string | null;
  isDrink?: boolean;
  basis?: '100g' | '100ml';
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  sugarPer100g?: number | null;
  fatPer100g?: number | null;
  fiberPer100g?: number | null;
  saltPer100g?: number | null;
  warnings?: string[];
}
