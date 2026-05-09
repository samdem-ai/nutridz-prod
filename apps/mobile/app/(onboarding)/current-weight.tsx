import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import RulerPicker from '../../src/components/onboarding/RulerPicker';
import UnitToggle from '../../src/components/onboarding/UnitToggle';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore, computeBmi, bmiCategory } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

const kgToLb = (kg: number) => +(kg * 2.20462).toFixed(1);

export default function CurrentWeightScreen() {
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

  const next = () => {
    if (goal === 'MAINTAIN') {
      setTargetWeight(currentWeightKg);
      router.push('/(onboarding)/activity');
    } else {
      router.push('/(onboarding)/target-weight');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={5 / 9} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your current weight?</Text>
        <View style={styles.toggleWrap}>
          <UnitToggle
            options={['lb', 'kg']}
            value={weightUnit}
            onChange={(v) => setWeightUnit(v as 'kg' | 'lb')}
          />
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueBig}>
            {weightUnit === 'kg' ? currentWeightKg.toFixed(1) : kgToLb(currentWeightKg).toFixed(1)}
          </Text>
          <Text style={styles.valueUnit}>{weightUnit}</Text>
        </View>
        <RulerPicker
          min={30}
          max={200}
          step={0.1}
          labelEvery={10}
          value={currentWeightKg}
          onChange={setCurrentWeight}
        />

        <View style={[styles.bmiCard, OnboardingShadows.card]}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiText}>
              Your BMI: <Text style={[styles.bmiValue, { color: catColor }]}>{bmi}</Text>
            </Text>
            <View style={[styles.bmiTag, { backgroundColor: catColor }]}>
              <Text style={styles.bmiTagText}>{cat}</Text>
            </View>
          </View>
          <Text style={styles.bmiAdvice}>
            {cat === 'Normal'
              ? 'Within the healthy range. 💪 Keep up with a balanced diet and exercise!'
              : cat === 'Underweight'
              ? 'Below the healthy range. Focus on nutrient-dense foods.'
              : cat === 'Overweight'
              ? 'Above the healthy range. Small daily habits make a difference.'
              : 'Significantly above healthy range. We can help you reach your target.'}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Next" onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: OnboardingColors.text,
    marginBottom: 24,
    textAlign: 'left',
  },
  toggleWrap: { alignItems: 'center', marginBottom: 24 },
  valueRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, marginBottom: 8 },
  valueBig: { fontSize: 56, fontWeight: '800', color: OnboardingColors.text },
  valueUnit: { fontSize: 18, color: OnboardingColors.textSecondary, marginBottom: 12 },
  bmiCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 16 },
  bmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bmiText: { fontSize: 16, fontWeight: '700', color: OnboardingColors.text },
  bmiValue: { fontWeight: '800' },
  bmiTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bmiTagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bmiAdvice: { fontSize: 13, color: OnboardingColors.textSecondary, lineHeight: 19 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
