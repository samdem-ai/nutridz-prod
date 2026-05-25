import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import WeightRuler from '../../src/components/onboarding/WeightRuler';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import {
  useOnboardingStore,
  computeBmi,
  bmiCategory,
} from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

// Conversion helpers
const KG_PER_LB = 0.45359237;
const kgToLb = (kg: number) => kg / KG_PER_LB;
const lbToKg = (lb: number) => lb * KG_PER_LB;

export default function CurrentWeightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    currentWeightKg,
    setCurrentWeight,
    weightUnit,
    setWeightUnit,
    heightCm,
    goal,
    setTargetWeight,
  } = useOnboardingStore();

  // Display value reflects current unit; underlying storage is always kg.
  const displayValue =
    weightUnit === 'kg' ? currentWeightKg : kgToLb(currentWeightKg);

  // Ruler operates in display unit; converts back to kg on emit.
  const handleRulerChange = (v: number) => {
    const kg = weightUnit === 'kg' ? v : lbToKg(v);
    setCurrentWeight(+kg.toFixed(2));
  };

  const handleUnitChange = (unit: 'kg' | 'lb') => {
    if (unit !== weightUnit) setWeightUnit(unit);
  };

  const bmi = +computeBmi(heightCm, currentWeightKg).toFixed(1);
  const cat = bmiCategory(bmi);
  const catColor =
    cat === 'Normal'
      ? OnboardingColors.success
      : cat === 'Underweight'
      ? OnboardingColors.info
      : cat === 'Overweight'
      ? OnboardingColors.warning
      : OnboardingColors.error;

  const onNext = () => {
    if (goal === 'MAINTAIN') {
      setTargetWeight(currentWeightKg);
      router.push('/(onboarding)/activity');
    } else {
      router.push('/(onboarding)/target-weight');
    }
  };

  // Ruler bounds in current unit
  const min = weightUnit === 'kg' ? 30 : 66; // 30 kg ≈ 66 lb
  const max = weightUnit === 'kg' ? 200 : 440;
  const step = weightUnit === 'kg' ? 0.1 : 0.2;
  const majorEvery = weightUnit === 'kg' ? 5 : 10;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={5 / 10} />

      <View style={styles.body}>
        <Text style={styles.title}>{t('onboarding.currentWeight')}</Text>

        <View style={styles.toggleRow}>
          <ToggleBtn
            label="lb"
            active={weightUnit === 'lb'}
            onPress={() => handleUnitChange('lb')}
          />
          <ToggleBtn
            label="kg"
            active={weightUnit === 'kg'}
            onPress={() => handleUnitChange('kg')}
          />
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.valueBig}>{displayValue.toFixed(1)}</Text>
          <Text style={styles.valueUnit}>{weightUnit}</Text>
        </View>

        {/* Re-key on unit change so FlatList re-mounts with correct min/step */}
        <WeightRuler
          key={weightUnit}
          min={min}
          max={max}
          step={step}
          majorEvery={majorEvery}
          tickWidth={12}
          value={displayValue}
          onChange={handleRulerChange}
        />

        <View style={[styles.bmiCard, OnboardingShadows.card]}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiText}>
              {t('onboarding.yourBmi')}:{' '}
              <Text style={[styles.bmiValue, { color: catColor }]}>{bmi}</Text>
            </Text>
            <View style={[styles.bmiTag, { backgroundColor: catColor }]}>
              <Text style={styles.bmiTagText}>
                {cat === 'Normal' ? t('onboarding.bmiNormal')
                  : cat === 'Underweight' ? t('onboarding.bmiUnderweight')
                  : cat === 'Overweight' ? t('onboarding.bmiOverweight')
                  : t('onboarding.bmiObese')}
              </Text>
            </View>
          </View>
          <Text style={styles.bmiAdvice}>
            {cat === 'Normal' ? t('onboarding.bmiAdviceNormal')
              : cat === 'Underweight' ? t('onboarding.bmiAdviceUnder')
              : cat === 'Overweight' ? t('onboarding.bmiAdviceOver')
              : t('onboarding.bmiAdviceObese')}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={t('common.next')} onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

function ToggleBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      delayPressIn={0}
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: OnboardingColors.text,
    marginBottom: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: OnboardingColors.surface,
    borderRadius: 999,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  toggleBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: OnboardingColors.primary },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: OnboardingColors.textSecondary,
  },
  toggleTextActive: { color: '#FFFFFF' },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  valueBig: { fontSize: 56, fontWeight: '800', color: OnboardingColors.text },
  valueUnit: {
    fontSize: 18,
    color: OnboardingColors.textSecondary,
    marginBottom: 12,
  },
  bmiCard: {
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiText: { fontSize: 16, fontWeight: '700', color: OnboardingColors.text },
  bmiValue: { fontWeight: '800' },
  bmiTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bmiTagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bmiAdvice: {
    fontSize: 13,
    color: OnboardingColors.textSecondary,
    lineHeight: 19,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
