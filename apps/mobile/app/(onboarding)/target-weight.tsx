import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import WeightRuler from '../../src/components/onboarding/WeightRuler';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

export default function TargetWeightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { targetWeightKg, setTargetWeight, currentWeightKg, goal } = useOnboardingStore();

  // Constrain target weight bounds based on goal direction.
  // LOSE  → target < current   (cap max at current - 0.5 kg)
  // GAIN  → target > current   (floor min at current + 0.5 kg)
  // MAINTAIN never reaches this screen (skipped in flow)
  const rulerMin = goal === 'GAIN' ? Math.min(200, currentWeightKg + 0.5) : 30;
  const rulerMax = goal === 'LOSE' ? Math.max(30, currentWeightKg - 0.5) : 200;

  // Clamp current targetWeightKg into the valid range on mount/goal change
  useEffect(() => {
    if (targetWeightKg < rulerMin || targetWeightKg > rulerMax) {
      // Default target: ~10% movement from current in goal direction
      const seed =
        goal === 'GAIN'
          ? Math.min(rulerMax, currentWeightKg + Math.max(2, currentWeightKg * 0.05))
          : Math.max(rulerMin, currentWeightKg - Math.max(2, currentWeightKg * 0.05));
      setTargetWeight(+seed.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, currentWeightKg]);

  const diff = targetWeightKg - currentWeightKg;
  const pct = currentWeightKg > 0 ? Math.abs(diff) / currentWeightKg : 0;
  const isLose = diff < 0;
  const challengePct = (pct * 100).toFixed(1);

  const tone = pct > 0.15 ? 'challenging' : pct > 0.05 ? 'balanced' : 'mild';
  const toneTitle =
    tone === 'challenging' ? 'Challenging goal:' : tone === 'balanced' ? 'Balanced goal:' : 'Easy goal:';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={6 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.targetWeight')}</Text>

        <View style={styles.valueRow}>
          <Text style={styles.valueBig}>{targetWeightKg.toFixed(1)}</Text>
          <Text style={styles.valueUnit}>kg</Text>
          <View style={styles.refTag}>
            <Ionicons
              name={isLose ? 'chevron-back' : 'chevron-forward'}
              size={18}
              color={OnboardingColors.error}
            />
            <Text style={styles.refText}>{currentWeightKg.toFixed(1)}</Text>
          </View>
        </View>

        <WeightRuler
          key={`${goal}-${currentWeightKg}`}
          min={rulerMin}
          max={rulerMax}
          step={0.1}
          majorEvery={5}
          tickWidth={12}
          value={targetWeightKg}
          onChange={setTargetWeight}
        />

        <View style={[styles.tipCard, OnboardingShadows.card]}>
          <Text style={styles.tipTitle}>
            {toneTitle}{' '}
            <Text style={styles.tipHighlight}>
              {goal === 'GAIN' ? 'gain' : 'lose'} {challengePct}%
            </Text>
          </Text>
          <Text style={styles.tipBody}>
            {tone === 'challenging'
              ? 'This is a challenging pace that requires strict diet management. Our VIP features can be your powerful assistant.'
              : tone === 'balanced'
              ? 'A balanced and sustainable pace. Most users succeed with this approach.'
              : 'A mild change. Easy to maintain alongside daily life.'}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label={t('common.next')} onPress={() => router.push('/(onboarding)/activity')} />
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
    marginBottom: 32,
  },
  valueRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, marginBottom: 8 },
  valueBig: { fontSize: 56, fontWeight: '800', color: OnboardingColors.text },
  valueUnit: { fontSize: 18, color: OnboardingColors.textSecondary, marginBottom: 12 },
  refTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginLeft: 8 },
  refText: { color: OnboardingColors.textSecondary, fontWeight: '700' },
  tipCard: {
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  tipTitle: { fontSize: 15, fontWeight: '800', color: OnboardingColors.text, marginBottom: 6 },
  tipHighlight: { color: OnboardingColors.warning },
  tipBody: { fontSize: 13, color: OnboardingColors.textSecondary, lineHeight: 19 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
