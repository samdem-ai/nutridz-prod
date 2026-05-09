import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import {
  useOnboardingStore,
  computeBmi,
  bmiCategory,
  computeDailyCalories,
} from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

export default function PlanReadyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    goal,
    sex,
    birthYear,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activity,
    paceKgPerWeek,
  } = useOnboardingStore();

  const age = new Date().getFullYear() - birthYear;
  const bmi = +computeBmi(heightCm, currentWeightKg).toFixed(1);
  const cat = bmiCategory(bmi);
  const catColor =
    cat === 'Normal' ? OnboardingColors.success
    : cat === 'Underweight' ? OnboardingColors.info
    : cat === 'Overweight' ? OnboardingColors.warning
    : OnboardingColors.error;

  const dailyKcal = computeDailyCalories(sex, age, heightCm, currentWeightKg, activity, paceKgPerWeek);
  const carbsPct = 40, fatPct = 30, proteinPct = 30;

  const diff = Math.abs(targetWeightKg - currentWeightKg);
  const weeks = paceKgPerWeek === 0 ? 12 : Math.ceil(diff / Math.abs(paceKgPerWeek));
  const reachDate = new Date(Date.now() + weeks * 7 * 86400000);
  const dateStr = reachDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const continueToRegister = () => {
    setLoading(true);
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Your custom plan is ready!</Text>
        <Text style={styles.bigHeading}>
          {goal === 'GAIN' ? 'Reach' : goal === 'LOSE' ? 'Reach' : 'Maintain'}{' '}
          <Text style={{ color: OnboardingColors.success }}>
            {targetWeightKg.toFixed(1)} kg
          </Text>
          {'\n'}by {dateStr}
        </Text>

        {/* Projected progress card */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <Text style={styles.cardTitle}>Projected Progress</Text>
          <View style={styles.chartWrap}>
            <Svg width={290} height={140} viewBox="0 0 290 140">
              <Path
                d="M 20 30 C 80 30, 110 35, 150 90 S 240 110, 270 110"
                stroke="#FCD34D"
                strokeWidth={4}
                fill="none"
                strokeDasharray="0"
              />
              <Circle cx={20} cy={30} r={5} fill="#FCD34D" />
              <Circle cx={150} cy={90} r={6} fill={OnboardingColors.success} />
              <Circle cx={270} cy={110} r={5} fill={OnboardingColors.success} />
            </Svg>
            <View style={[styles.chartTag, { left: 0, top: 0 }]}>
              <Text style={styles.tagText}>{currentWeightKg.toFixed(1)} kg</Text>
            </View>
            <View
              style={[
                styles.chartTag,
                {
                  left: 130,
                  top: 60,
                  backgroundColor: OnboardingColors.success,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: '#fff' }]}>
                {targetWeightKg.toFixed(1)} kg
              </Text>
            </View>
            <View
              style={[
                styles.chartTag,
                {
                  right: 0,
                  top: 90,
                  backgroundColor: '#E8F5EC',
                },
              ]}
            >
              <Text style={[styles.tagText, { color: OnboardingColors.success }]}>
                Maintain goal
              </Text>
            </View>
          </View>
          <View style={styles.bullets}>
            <Bullet text={`See the first visible results in just ${Math.max(2, Math.round(weeks / 2))} weeks`} />
            <Bullet text={`Reach your goal by ${dateStr}`} />
            <Bullet text="Habits will help you sustain your success" />
          </View>
        </View>

        {/* Nutrition recommendations */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <Text style={styles.cardTitle}>Nutrition Recommendations</Text>
          <View style={styles.nutriRow}>
            <View style={styles.nutriCal}>
              <Text style={styles.nutriCalEmoji}>🔥</Text>
              <Text style={styles.nutriCalValue}>
                {dailyKcal.toLocaleString()}
              </Text>
              <Text style={styles.nutriCalLabel}>Calories</Text>
            </View>
            <View style={styles.nutriMacros}>
              <MacroItem pct={carbsPct} label="Carbs" color={OnboardingColors.success} emoji="🌿" />
              <MacroItem pct={fatPct} label="Fat" color={OnboardingColors.warning} emoji="💧" />
              <MacroItem pct={proteinPct} label="Protein" color={OnboardingColors.error} emoji="🍗" />
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Based on your needs, we calculated your daily calories and macro balance. You can always adjust them in the app.
          </Text>
        </View>

        {/* How to reach goal */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <Text style={styles.cardTitle}>How to Reach Your Goal:</Text>
          <Tip emoji="🔥" text="Track your food — make a healthy habit!" />
          <Tip emoji="🌿" text="Follow your daily calorie recommendation" />
          <Tip emoji="🌈" text="Balance your carbs, proteins and fat" />
        </View>

        {/* BMI */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <View style={styles.bmiHeader}>
            <Text style={styles.cardTitle}>Your BMI</Text>
            <View style={[styles.bmiTag, { backgroundColor: catColor }]}>
              <Text style={styles.bmiTagText}>{cat}</Text>
            </View>
          </View>
          <View style={styles.bmiRow}>
            <Text style={styles.bmiBig}>{bmi}</Text>
            <View style={styles.bmiBar}>
              <View style={[styles.bmiSeg, { backgroundColor: '#3B82F6' }]} />
              <View style={[styles.bmiSeg, { backgroundColor: '#22C55E', flex: 1.2 }]} />
              <View style={[styles.bmiSeg, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.bmiSeg, { backgroundColor: '#F97316' }]} />
            </View>
          </View>
          <Text style={styles.cardDesc}>
            {cat === 'Normal'
              ? "You're in a healthy range, but there's room to become even better! Focus on balanced nutrition and strength training to stay on track."
              : 'Small daily habits will help you reach a healthier range. We will guide you step by step.'}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Let's Get Started!"
          loading={loading}
          onPress={continueToRegister}
        />
        <Text style={styles.tagline}>Your future self will thank you</Text>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot}>
        <Text style={styles.bulletCheck}>✓</Text>
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function MacroItem({ pct, label, color, emoji }: { pct: number; label: string; color: string; emoji: string }) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.macroBar, { backgroundColor: color }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 12 }}>{emoji}</Text>
        <Text style={styles.macroPct}>{pct}%</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function Tip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.tip}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bgSuccess },
  scrollContent: { padding: 20, paddingBottom: 24, gap: 14 },
  heading: { textAlign: 'center', color: OnboardingColors.textSecondary, fontSize: 14, marginTop: 8 },
  bigHeading: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: OnboardingColors.text,
    marginBottom: 6,
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: OnboardingColors.text, marginBottom: 12 },
  cardDesc: { fontSize: 13, color: OnboardingColors.textSecondary, lineHeight: 19, marginTop: 10 },
  chartWrap: { alignItems: 'center', position: 'relative', height: 150 },
  chartTag: {
    position: 'absolute',
    backgroundColor: '#27214A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bullets: { gap: 8, marginTop: 8 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: OnboardingColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletCheck: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bulletText: { fontSize: 13, color: OnboardingColors.text, flex: 1 },
  nutriRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nutriCal: { alignItems: 'center', minWidth: 80 },
  nutriCalEmoji: { fontSize: 26 },
  nutriCalValue: { fontSize: 22, fontWeight: '800', color: OnboardingColors.text, marginTop: 2 },
  nutriCalLabel: { fontSize: 11, color: OnboardingColors.textSecondary },
  nutriMacros: { flex: 1, flexDirection: 'row', gap: 10 },
  macroItem: { flex: 1, alignItems: 'center', gap: 4 },
  macroBar: { height: 8, width: '90%', borderRadius: 4 },
  macroPct: { fontSize: 13, fontWeight: '800', color: OnboardingColors.text },
  macroLabel: { fontSize: 10, color: OnboardingColors.textSecondary },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  tipText: { flex: 1, fontSize: 13, color: OnboardingColors.text },
  bmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bmiTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bmiTagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bmiBig: { fontSize: 32, fontWeight: '800', color: OnboardingColors.text },
  bmiBar: { flex: 1, flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  bmiSeg: { flex: 1, height: '100%' },
  footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  tagline: { textAlign: 'center', color: OnboardingColors.textMuted, fontSize: 12 },
});
