import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import RulerPicker from '../../src/components/onboarding/RulerPicker';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

export default function TargetWeightScreen() {
  const router = useRouter();
  const { targetWeightKg, setTargetWeight, currentWeightKg, goal } = useOnboardingStore();

  const diff = targetWeightKg - currentWeightKg;
  const pct = currentWeightKg > 0 ? Math.abs(diff) / currentWeightKg : 0;
  const isLose = diff < 0;
  const challengePct = (pct * 100).toFixed(1);

  const tone = pct > 0.15 ? 'challenging' : pct > 0.05 ? 'balanced' : 'mild';
  const toneTitle =
    tone === 'challenging' ? 'Challenging goal:' : tone === 'balanced' ? 'Balanced goal:' : 'Easy goal:';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={6 / 9} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your target weight?</Text>

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

        <RulerPicker
          min={30}
          max={200}
          step={0.1}
          labelEvery={10}
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
        <PrimaryButton label="Next" onPress={() => router.push('/(onboarding)/activity')} />
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
  tipCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 24 },
  tipTitle: { fontSize: 15, fontWeight: '800', color: OnboardingColors.text, marginBottom: 6 },
  tipHighlight: { color: OnboardingColors.warning },
  tipBody: { fontSize: 13, color: OnboardingColors.textSecondary, lineHeight: 19 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
