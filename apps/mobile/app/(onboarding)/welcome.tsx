import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  title: string;
  subtitle: string;
  illustration: 'plan' | 'nutrition' | 'analysis' | 'goals';
}

const SLIDES: Slide[] = [
  {
    title: 'Personalized Meal Plans',
    subtitle: 'Offer every meal across various diets with effortless ease',
    illustration: 'plan',
  },
  {
    title: 'Track Your Nutrition',
    subtitle: 'Input your meals to monitor calories and maintain a balanced diet',
    illustration: 'nutrition',
  },
  {
    title: 'Detailed Food Analysis',
    subtitle: 'Get detailed nutritional breakdown of any dish with AI analysis',
    illustration: 'analysis',
  },
  {
    title: 'Achieve Your Goals',
    subtitle: 'Monitor your weight progress and reach your health targets',
    illustration: 'goals',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.illustrationWrap}>
              <Illustration kind={slide.illustration} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Let's Get Started" onPress={() => router.push('/(onboarding)/intro')} />
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.signInRow}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Illustration({ kind }: { kind: Slide['illustration'] }) {
  // Lightweight CSS-style illustration cards (no images required).
  if (kind === 'plan') {
    return (
      <View style={[styles.phoneFrame, OnboardingShadows.card]}>
        <Text style={styles.phoneTitle}>Fat Burn Reset</Text>
        <Text style={styles.phoneSub}>Week 2 · In Progress</Text>
        <View style={styles.daysRow}>
          {['D2', 'D3', 'D4', 'D5'].map((d, i) => (
            <View key={d} style={[styles.dayPill, i === 0 && styles.dayPillActive]}>
              <Text style={[styles.dayText, i === 0 && styles.dayTextActive]}>{d}</Text>
            </View>
          ))}
        </View>
        <MealRow color="#FCD34D" name="Almond Butter Oatmeal" kcal={338} />
        <MealRow color="#86EFAC" name="Cottage Cheese Salad" kcal={228} />
        <MealRow color="#A78BFA" name="Oven Poached Salmon" kcal={318} />
      </View>
    );
  }
  if (kind === 'nutrition') {
    return (
      <View style={[styles.phoneFrame, OnboardingShadows.card]}>
        <Text style={styles.phoneTitle}>Today</Text>
        <Text style={styles.phoneSub}>Goal · Food · Exercise</Text>
        <View style={styles.macros}>
          <MacroDot label="Carbs" color="#22C55E" />
          <MacroDot label="Fat" color="#F59E0B" />
          <MacroDot label="Protein" color="#EF4444" />
        </View>
        <MealRow color="#86EFAC" name="Protein bowl" kcal={447} />
        <MealRow color="#FCD34D" name="Classic salad" kcal={210} />
        <MealRow color="#FCA5A5" name="Chicken wing" kcal={859} />
      </View>
    );
  }
  if (kind === 'analysis') {
    return (
      <View style={[styles.phoneFrame, OnboardingShadows.card]}>
        <Text style={styles.phoneTitle}>Egg & Avocado Bowl</Text>
        <Text style={styles.phoneSub}>413 kcal · 1 ½ servings</Text>
        <View style={styles.macroCards}>
          <MacroCard pct="55%" value="48g" label="Carbs" color="#22C55E" />
          <MacroCard pct="35%" value="22g" label="Fat" color="#F59E0B" />
          <MacroCard pct="10%" value="32g" label="Protein" color="#EF4444" />
        </View>
        <MealRow color="#FCA5A5" name="Scrambled Eggs Mix" kcal={180} />
        <MealRow color="#86EFAC" name="Avocado Slices" kcal={89} />
      </View>
    );
  }
  // goals
  return (
    <View style={[styles.phoneFrame, OnboardingShadows.card]}>
      <Text style={styles.phoneTitle}>Current BMI · 27.3</Text>
      <View style={styles.bmiBar}>
        <View style={[styles.bmiSeg, { backgroundColor: '#3B82F6' }]} />
        <View style={[styles.bmiSeg, { backgroundColor: '#22C55E' }]} />
        <View style={[styles.bmiSeg, { backgroundColor: '#F59E0B' }]} />
        <View style={[styles.bmiSeg, { backgroundColor: '#EF4444' }]} />
      </View>
      <View style={styles.goalRow}>
        <View>
          <Text style={styles.phoneSub}>Goal Weight</Text>
          <Text style={styles.goalVal}>65.0 kg</Text>
        </View>
        <View>
          <Text style={styles.phoneSub}>Reach goal</Text>
          <Text style={[styles.goalVal, { color: OnboardingColors.success }]}>Apr 10</Text>
        </View>
      </View>
      <Text style={styles.phoneSub}>Calorie Trends</Text>
    </View>
  );
}

function MealRow({ color, name, kcal }: { color: string; name: string; kcal: number }) {
  return (
    <View style={styles.mealRow}>
      <View style={[styles.mealDot, { backgroundColor: color }]} />
      <Text style={styles.mealName}>{name}</Text>
      <Text style={styles.mealKcal}>{kcal} kcal</Text>
    </View>
  );
}

function MacroDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.macroDotWrap}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.phoneSub}>{label}</Text>
    </View>
  );
}

function MacroCard({
  pct,
  value,
  label,
  color,
}: {
  pct: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroPctTag, { backgroundColor: '#27214A' }]}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pct}</Text>
      </View>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OnboardingColors.border,
  },
  dotActive: { backgroundColor: OnboardingColors.text, width: 22 },
  scroll: { flex: 1 },
  slide: {
    width: SCREEN_W,
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OnboardingColors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: OnboardingColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 14 },
  signInRow: { alignItems: 'center', paddingVertical: 4 },
  signInText: { color: OnboardingColors.textSecondary, fontSize: 14 },
  signInBold: { color: OnboardingColors.text, fontWeight: '700' },

  // Phone illustration
  phoneFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    width: SCREEN_W * 0.78,
    minHeight: 360,
  },
  phoneTitle: { fontSize: 18, fontWeight: '800', color: OnboardingColors.text },
  phoneSub: { fontSize: 12, color: OnboardingColors.textSecondary, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 14 },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: OnboardingColors.bg,
  },
  dayPillActive: { backgroundColor: OnboardingColors.primary },
  dayText: { fontSize: 11, color: OnboardingColors.textSecondary, fontWeight: '700' },
  dayTextActive: { color: '#fff' },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: OnboardingColors.border,
    gap: 10,
  },
  mealDot: { width: 28, height: 28, borderRadius: 14 },
  mealName: { flex: 1, fontSize: 13, fontWeight: '600', color: OnboardingColors.text },
  mealKcal: { fontSize: 12, color: OnboardingColors.warning, fontWeight: '700' },
  macros: { flexDirection: 'row', gap: 16, marginVertical: 12 },
  macroDotWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroCards: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  macroCard: {
    flex: 1,
    backgroundColor: OnboardingColors.bg,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  macroPctTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  macroValue: { fontSize: 18, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: OnboardingColors.textSecondary },
  bmiBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginVertical: 12 },
  bmiSeg: { flex: 1 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  goalVal: { fontSize: 18, fontWeight: '800', color: OnboardingColors.text },
});
