import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

const STEPS = 10; // 0.1 .. 1.0
const PACE_VALUES = Array.from({ length: STEPS }, (_, i) => +((i + 1) * 0.1).toFixed(1));

export default function PaceScreen() {
  const router = useRouter();
  const { paceKgPerWeek, setPace, goal } = useOnboardingStore();
  const sign = goal === 'GAIN' ? 1 : -1;
  const absVal = Math.abs(paceKgPerWeek);
  const idx = Math.max(0, Math.min(STEPS - 1, Math.round(absVal * 10) - 1));

  const setIdx = (newIdx: number) => {
    const v = PACE_VALUES[Math.max(0, Math.min(STEPS - 1, newIdx))];
    setPace(sign * v);
  };

  const tone = idx <= 3 ? 'Balanced approach' : idx <= 6 ? 'Steady progress' : 'Aggressive pace';
  const recommended = idx <= 3;
  const fillRatio = (idx + 1) / STEPS;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={8 / 9} />
      <View style={styles.content}>
        <Text style={styles.title}>How soon do you want to see results?</Text>

        <View style={styles.toneCard}>
          <Text style={styles.toneTitle}>{tone}</Text>
          {recommended ? <Text style={styles.recommended}>Recommended</Text> : null}
        </View>

        <View style={styles.valueWrap}>
          <View style={[styles.valuePill, OnboardingShadows.card]}>
            <Text style={styles.valueLabel}>Per Week</Text>
            <Text style={styles.valueText}>
              {sign < 0 ? '-' : '+'}
              {PACE_VALUES[idx].toFixed(1)} kg
            </Text>
          </View>
        </View>

        <View style={styles.sliderWrap}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fillRatio * 100}%` }]} />
          </View>
          <View style={styles.dotRow}>
            {PACE_VALUES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setIdx(i)}
                style={styles.dotHit}
                hitSlop={8}
              >
                <View style={[styles.dot, i === idx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bounds}>
          <Text style={styles.boundText}>{sign < 0 ? '-' : '+'}0.1kg</Text>
          <Text style={styles.boundText}>{sign < 0 ? '-' : '+'}1.0kg</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Next" onPress={() => router.push('/(onboarding)/reminders')} />
        <TouchableOpacity style={styles.sourceRow}>
          <Text style={styles.sourceText}>Source of recommendations</Text>
        </TouchableOpacity>
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
    marginBottom: 28,
    textAlign: 'center',
  },
  toneCard: {
    backgroundColor: OnboardingColors.primaryLight,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 100,
  },
  toneTitle: { fontSize: 15, color: OnboardingColors.textSecondary, fontWeight: '700' },
  recommended: { fontSize: 22, color: OnboardingColors.success, fontWeight: '800', marginTop: 4 },
  valueWrap: { alignItems: 'center', marginBottom: 16 },
  valuePill: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  valueLabel: { fontSize: 11, color: OnboardingColors.textSecondary },
  valueText: { fontSize: 18, fontWeight: '800', color: OnboardingColors.text },
  sliderWrap: { paddingVertical: 14, position: 'relative' },
  track: {
    height: 14,
    backgroundColor: OnboardingColors.trackBg,
    borderRadius: 999,
    justifyContent: 'center',
  },
  fill: { height: 14, backgroundColor: OnboardingColors.success, borderRadius: 999 },
  dotRow: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dotHit: { padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  dotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: OnboardingColors.success,
    marginTop: -5,
    marginLeft: -5,
  },
  bounds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  boundText: { color: OnboardingColors.textSecondary, fontSize: 12, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
