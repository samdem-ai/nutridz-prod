import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Goal = 'LOSE' | 'MAINTAIN' | 'GAIN';
export type Sex = 'MALE' | 'FEMALE' | 'UNSPECIFIED';
export type Activity = 'NOT_ACTIVE' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'HIGHLY_ACTIVE';

export interface ReminderSlot {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface OnboardingState {
  goal: Goal | null;
  sex: Sex | null;
  birthYear: number;
  heightCm: number;
  heightUnit: 'cm' | 'ft';
  currentWeightKg: number;
  weightUnit: 'kg' | 'lb';
  targetWeightKg: number;
  activity: Activity | null;
  paceKgPerWeek: number;
  /** Type 2 diabetes flag → triggers diabetes-adapted macro split + low-GI suggestions */
  diabetic: boolean | null;
  reminders: {
    breakfast: ReminderSlot;
    lunch: ReminderSlot;
    dinner: ReminderSlot;
  };
  completed: boolean;
  /** 'create' = fresh signup flow, 'edit' = re-entering from settings */
  mode: 'create' | 'edit';

  setGoal: (goal: Goal) => void;
  setSex: (sex: Sex) => void;
  setBirthYear: (year: number) => void;
  setHeight: (cm: number) => void;
  setHeightUnit: (unit: 'cm' | 'ft') => void;
  setCurrentWeight: (kg: number) => void;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
  setTargetWeight: (kg: number) => void;
  setActivity: (a: Activity) => void;
  setPace: (kg: number) => void;
  setDiabetic: (v: boolean) => void;
  setReminder: (key: 'breakfast' | 'lunch' | 'dinner', slot: Partial<ReminderSlot>) => void;
  markCompleted: () => void;
  setMode: (m: 'create' | 'edit') => void;
  reset: () => void;
}

const DEFAULTS = {
  goal: null,
  sex: null,
  birthYear: 1998,
  heightCm: 178,
  heightUnit: 'cm' as const,
  currentWeightKg: 73,
  weightUnit: 'kg' as const,
  targetWeightKg: 66,
  activity: null,
  paceKgPerWeek: -0.4,
  diabetic: null,
  reminders: {
    breakfast: { enabled: false, hour: 9, minute: 0 },
    lunch: { enabled: false, hour: 12, minute: 0 },
    dinner: { enabled: false, hour: 18, minute: 30 },
  },
  completed: false,
  mode: 'create' as const,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setGoal: (goal) => set({ goal }),
      setSex: (sex) => set({ sex }),
      setBirthYear: (birthYear) => set({ birthYear }),
      setHeight: (heightCm) => set({ heightCm }),
      setHeightUnit: (heightUnit) => set({ heightUnit }),
      setCurrentWeight: (currentWeightKg) => set({ currentWeightKg }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setTargetWeight: (targetWeightKg) => set({ targetWeightKg }),
      setActivity: (activity) => set({ activity }),
      setPace: (paceKgPerWeek) => set({ paceKgPerWeek }),
      setDiabetic: (diabetic) => set({ diabetic }),
      setReminder: (key, slot) =>
        set((state) => ({
          reminders: { ...state.reminders, [key]: { ...state.reminders[key], ...slot } },
        })),
      markCompleted: () => set({ completed: true }),
      setMode: (mode) => set({ mode }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'nutridz-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist everything so we can reuse for in-app calculations
      partialize: (state) => ({
        goal: state.goal,
        sex: state.sex,
        birthYear: state.birthYear,
        heightCm: state.heightCm,
        heightUnit: state.heightUnit,
        currentWeightKg: state.currentWeightKg,
        weightUnit: state.weightUnit,
        targetWeightKg: state.targetWeightKg,
        activity: state.activity,
        paceKgPerWeek: state.paceKgPerWeek,
        diabetic: state.diabetic,
        reminders: state.reminders,
        completed: state.completed,
      }),
    }
  )
);

/** Map onboarding store -> backend profile patch. */
export const buildProfilePatch = () => {
  const s = useOnboardingStore.getState();
  const goalMap: Record<Goal, string> = {
    LOSE: 'WEIGHT_LOSS',
    MAINTAIN: 'MAINTENANCE',
    GAIN: 'MUSCLE_GAIN',
  };
  const activityMap: Record<Activity, string> = {
    NOT_ACTIVE: 'SEDENTARY',
    LIGHTLY_ACTIVE: 'LIGHT',
    MODERATELY_ACTIVE: 'MODERATE',
    HIGHLY_ACTIVE: 'VERY_ACTIVE',
  };
  // Compute derived targets so dashboard/goals/targets read real values
  // (instead of 2000 kcal / 150p / 250c / 65f fallback defaults).
  const age = new Date().getFullYear() - s.birthYear;
  const dailyKcal = computeDailyCalories(
    s.sex,
    age,
    s.heightCm,
    s.currentWeightKg,
    s.activity,
    s.paceKgPerWeek
  );
  const macros = computeMacros(
    dailyKcal,
    s.goal,
    s.diabetic,
    s.activity,
    s.currentWeightKg
  );
  // Water: 35 ml/kg body weight (EFSA / ANSES baseline), bumped for active
  const waterMl =
    Math.round(s.currentWeightKg * 35 + (s.activity === 'HIGHLY_ACTIVE' ? 500 : 0));

  return {
    gender: s.sex && s.sex !== 'UNSPECIFIED' ? s.sex : undefined,
    birthDate: `${s.birthYear}-01-01`,
    heightCm: s.heightCm,
    weightKg: s.currentWeightKg,
    activityLevel: s.activity ? activityMap[s.activity] : undefined,
    nutritionGoal: s.goal ? goalMap[s.goal] : undefined,
    diabetesType: s.diabetic === true ? 'TYPE_2' : s.diabetic === false ? 'NONE' : undefined,
    // Computed targets (Mifflin-St Jeor BMR × FAP × goal pace, macros per OMS/ANSES)
    dailyCalorieTarget: dailyKcal,
    dailyProteinTarget: macros.proteinG,
    dailyCarbTarget: macros.carbsG,
    dailyFatTarget: macros.fatG,
    dailyWaterTargetMl: waterMl,
  };
};

export const getEnabledReminders = () => {
  const r = useOnboardingStore.getState().reminders;
  const out: Array<{ key: string; hour: number; minute: number; title: string; body: string }> = [];
  if (r.breakfast.enabled) {
    out.push({
      key: 'breakfast',
      hour: r.breakfast.hour,
      minute: r.breakfast.minute,
      title: '🌅 Breakfast',
      body: 'Time to log your breakfast in NutriDz',
    });
  }
  if (r.lunch.enabled) {
    out.push({
      key: 'lunch',
      hour: r.lunch.hour,
      minute: r.lunch.minute,
      title: '🍽️ Lunch',
      body: "Don't forget to track your lunch",
    });
  }
  if (r.dinner.enabled) {
    out.push({
      key: 'dinner',
      hour: r.dinner.hour,
      minute: r.dinner.minute,
      title: '🌙 Dinner',
      body: 'Wrap up the day with your dinner log',
    });
  }
  return out;
};

// ─── Calculations (reused across app) ─────────────────────────────────────

export const computeBmi = (heightCm: number, weightKg: number): number => {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return weightKg / (m * m);
};

export const bmiCategory = (bmi: number): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Mifflin-St Jeor (1990) — most accurate for adult non-athlete population
 * (Frankenfield et al., 2005). NutriDz n Health uses this as canonical BMR.
 *
 *   Male:   MB = 10·kg + 6.25·cm − 5·age + 5
 *   Female: MB = 10·kg + 6.25·cm − 5·age − 161
 */
export const computeBmr = (
  sex: Sex | null,
  age: number,
  heightCm: number,
  weightKg: number
): number => {
  const isMale = sex === 'MALE';
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161);
};

/** Physical Activity Factor (FAP) — OMS/FAO (2004) classification. */
export const activityFactor = (a: Activity | null): number =>
  ({
    NOT_ACTIVE: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    HIGHLY_ACTIVE: 1.725,
  }[a ?? 'LIGHTLY_ACTIVE']);

/**
 * Total Energy Expenditure (BET) = BMR × FAP, then adjusted by goal pace.
 * 1 kg fat ≈ 7700 kcal → daily delta = pace × 7700 / 7.
 */
export const computeDailyCalories = (
  sex: Sex | null,
  age: number,
  heightCm: number,
  weightKg: number,
  activity: Activity | null,
  paceKgPerWeek: number
): number => {
  const bmr = computeBmr(sex, age, heightCm, weightKg);
  const tdee = bmr * activityFactor(activity);
  const delta = (paceKgPerWeek * 7700) / 7;
  return Math.max(1200, Math.round(tdee + delta));
};

/**
 * Macronutrient split per WHO (2020) + ANSES (2016), adapted by goal.
 * Diabetic mode: WHO/IDF diabetic-specific split (sugars <10% AET, fiber ≥35g).
 * Muscle-gain athletes: protein clamped to 1.6–2.2 g/kg/day (ISSN, Stokes 2018).
 */
export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export const computeMacros = (
  dailyKcal: number,
  goal: Goal | null,
  diabetic: boolean | null,
  activity: Activity | null,
  weightKg: number
): MacroTargets => {
  // Default = WHO standard (midpoints of acceptable ranges)
  let proteinPct = 0.225; // 10–35%
  let carbsPct = 0.55;    // 45–65%
  let fatPct = 0.275;     // 20–35%
  let fiberG = 25;

  if (diabetic) {
    proteinPct = 0.25;
    carbsPct = 0.45;
    fatPct = 0.30;
    fiberG = 35;
  } else if (goal === 'LOSE') {
    proteinPct = 0.325;
    carbsPct = 0.425;
    fatPct = 0.25;
    fiberG = 30;
  } else if (goal === 'GAIN') {
    proteinPct = 0.35;
    carbsPct = 0.50;
    fatPct = 0.25;
    fiberG = 25;
  }

  let proteinG = Math.round((dailyKcal * proteinPct) / 4);
  const carbsG = Math.round((dailyKcal * carbsPct) / 4);
  const fatG = Math.round((dailyKcal * fatPct) / 9);

  // Athletes / muscle gain → protein clamped to 1.6–2.2 g/kg (ISSN guideline)
  if (goal === 'GAIN' && activity === 'HIGHLY_ACTIVE' && weightKg > 0) {
    const minP = Math.round(weightKg * 1.6);
    const maxP = Math.round(weightKg * 2.2);
    proteinG = Math.max(minP, Math.min(maxP, proteinG));
  }

  return {
    proteinG,
    carbsG,
    fatG,
    fiberG,
    proteinPct,
    carbsPct,
    fatPct,
  };
};

/** Convenience selector for in-app calc consumers. */
export const useOnboardingDerived = () => {
  const s = useOnboardingStore();
  const age = new Date().getFullYear() - s.birthYear;
  const bmi = +computeBmi(s.heightCm, s.currentWeightKg).toFixed(1);
  const bmr = Math.round(computeBmr(s.sex, age, s.heightCm, s.currentWeightKg));
  const dailyKcal = computeDailyCalories(
    s.sex,
    age,
    s.heightCm,
    s.currentWeightKg,
    s.activity,
    s.paceKgPerWeek
  );
  const macros = computeMacros(dailyKcal, s.goal, s.diabetic, s.activity, s.currentWeightKg);
  return { age, bmi, bmiCategory: bmiCategory(bmi), bmr, dailyKcal, macros };
};
