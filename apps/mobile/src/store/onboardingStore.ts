import { create } from 'zustand';

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
  paceKgPerWeek: number; // negative for loss, positive for gain
  reminders: {
    breakfast: ReminderSlot;
    lunch: ReminderSlot;
    dinner: ReminderSlot;
  };

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
  setReminder: (key: 'breakfast' | 'lunch' | 'dinner', slot: Partial<ReminderSlot>) => void;
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
  reminders: {
    breakfast: { enabled: false, hour: 9, minute: 0 },
    lunch: { enabled: false, hour: 12, minute: 0 },
    dinner: { enabled: false, hour: 18, minute: 30 },
  },
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
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
  setReminder: (key, slot) =>
    set((state) => ({
      reminders: { ...state.reminders, [key]: { ...state.reminders[key], ...slot } },
    })),
  reset: () => set(DEFAULTS),
}));

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
  return {
    gender: s.sex && s.sex !== 'UNSPECIFIED' ? s.sex : undefined,
    birthDate: `${s.birthYear}-01-01`,
    heightCm: s.heightCm,
    weightKg: s.currentWeightKg,
    activityLevel: s.activity ? activityMap[s.activity] : undefined,
    nutritionGoal: s.goal ? goalMap[s.goal] : undefined,
  };
};

/** Returns the enabled reminders as { hour, minute } slots for scheduling. */
export const getEnabledReminders = () => {
  const r = useOnboardingStore.getState().reminders;
  const out: Array<{ key: string; hour: number; minute: number; title: string; body: string }> = [];
  if (r.breakfast.enabled) {
    out.push({
      key: 'breakfast',
      hour: r.breakfast.hour,
      minute: r.breakfast.minute,
      title: '🌅 Breakfast',
      body: "Time to log your breakfast in NutriDz",
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

// Helpers
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

// BMR (Mifflin-St Jeor) → TDEE → adjusted for goal
export const computeDailyCalories = (
  sex: Sex | null,
  age: number,
  heightCm: number,
  weightKg: number,
  activity: Activity | null,
  paceKgPerWeek: number
): number => {
  const isMale = sex === 'MALE';
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161);
  const factor = {
    NOT_ACTIVE: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    HIGHLY_ACTIVE: 1.725,
  }[activity ?? 'LIGHTLY_ACTIVE'];
  const tdee = bmr * factor;
  // 7700 kcal ≈ 1 kg fat. Daily delta = pace * 7700 / 7
  const delta = (paceKgPerWeek * 7700) / 7;
  return Math.max(1200, Math.round(tdee + delta));
};
