import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

// Keys must match Java NutritionGoal enum
const GOALS = [
  { key: 'WEIGHT_LOSS', labelKey: 'profile.weightLoss' },
  { key: 'MUSCLE_GAIN', labelKey: 'profile.muscleGain' },
  { key: 'MAINTENANCE', labelKey: 'profile.maintain' },
  { key: 'BALANCED', labelKey: 'profile.balanced' },
];

// Keys must match Java ActivityLevel enum
const ACTIVITY_LEVELS = [
  { key: 'SEDENTARY', labelKey: 'profile.sedentary' },
  { key: 'LIGHT', labelKey: 'profile.light' },
  { key: 'MODERATE', labelKey: 'profile.moderate' },
  { key: 'VERY_ACTIVE', labelKey: 'profile.active' },
  { key: 'EXTRA_ACTIVE', labelKey: 'profile.veryActive' },
];

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    birthDate: '',                  // ISO YYYY-MM-DD
    gender: '',                     // MALE | FEMALE
    heightCm: '',
    weightKg: '',
    activityLevel: '',              // SEDENTARY | LIGHT | MODERATE | VERY_ACTIVE | EXTRA_ACTIVE
    nutritionGoal: '',              // WEIGHT_LOSS | MUSCLE_GAIN | MAINTENANCE | BALANCED
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateProfile({
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        activityLevel: form.activityLevel || undefined,
        nutritionGoal: form.nutritionGoal || undefined,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>{t('profile.personalInfo')}</Text>
            <Text style={styles.label}>{t('profile.sex')}</Text>
            <View style={styles.row}>
              {['MALE', 'FEMALE'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.gender === s && styles.chipActive]}
                  onPress={() => setForm({ ...form, gender: s })}
                >
                  <Text style={[styles.chipText, form.gender === s && styles.chipTextActive]}>
                    {t(s === 'MALE' ? 'profile.male' : 'profile.female')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('profile.height')}
              placeholderTextColor={Colors.textMuted}
              value={form.heightCm}
              onChangeText={(v) => setForm({ ...form, heightCm: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder={t('profile.weight')}
              placeholderTextColor={Colors.textMuted}
              value={form.weightKg}
              onChangeText={(v) => setForm({ ...form, weightKg: v })}
              keyboardType="numeric"
            />
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>{t('profile.activity')}</Text>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.key}
                style={[styles.optionCard, form.activityLevel === level.key && styles.optionCardActive]}
                onPress={() => setForm({ ...form, activityLevel: level.key })}
              >
                <Text style={[styles.optionText, form.activityLevel === level.key && styles.optionTextActive]}>
                  {t(level.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>{t('profile.goal')}</Text>
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[styles.optionCard, form.nutritionGoal === goal.key && styles.optionCardActive]}
                onPress={() => setForm({ ...form, nutritionGoal: goal.key })}
              >
                <Text style={[styles.optionText, form.nutritionGoal === goal.key && styles.optionTextActive]}>
                  {t(goal.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>NutriDz</Text>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i <= step && styles.dotActive]}
          />
        ))}
      </View>

      {renderStep()}

      <View style={styles.buttons}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={step < 2 ? () => setStep(step + 1) : handleFinish}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {step < 2 ? 'Suivant' : loading ? t('common.loading') : t('common.confirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.xxl, paddingTop: 60 },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(34,197,94,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Theme.spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  stepTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  row: { flexDirection: 'row', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  chip: {
    flex: 1,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text, fontWeight: Theme.fontWeight.medium },
  chipTextActive: { color: '#FFF' },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  optionCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.surface,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  optionText: { fontSize: Theme.fontSize.md, color: Colors.text },
  optionTextActive: { color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
  buttons: { flexDirection: 'row', marginTop: Theme.spacing.xxl, gap: Theme.spacing.sm },
  backButton: {
    flex: 1,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  backButtonText: { color: Colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  nextButtonText: { color: '#FFF', fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.md },
});
