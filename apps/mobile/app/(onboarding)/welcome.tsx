import { useRef, useState, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import BrandLogo from '../../src/components/onboarding/BrandLogo';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  title: string;
  subtitle: string;
  illustration: 'plan' | 'nutrition' | 'analysis' | 'goals';
}

// Slide content is built from t() keys at render time (see component).
const SLIDE_KEYS: Array<{ titleKey: string; subKey: string; illustration: Slide['illustration'] }> = [
  { titleKey: 'onboarding.slide1Title', subKey: 'onboarding.slide1Sub', illustration: 'plan' },
  { titleKey: 'onboarding.slide2Title', subKey: 'onboarding.slide2Sub', illustration: 'nutrition' },
  { titleKey: 'onboarding.slide3Title', subKey: 'onboarding.slide3Sub', illustration: 'analysis' },
  { titleKey: 'onboarding.slide4Title', subKey: 'onboarding.slide4Sub', illustration: 'goals' },
];

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const SLIDES = useMemo(
    () =>
      SLIDE_KEYS.map((s) => ({
        title: t(s.titleKey),
        subtitle: t(s.subKey),
        illustration: s.illustration,
      })),
    [t]
  );
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.logoWrap}>
        <BrandLogo size={68} showLabel={false} />
      </View>
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
          const width = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[styles.dot, { width, opacity }]} />;
        })}
      </View>

      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={1}
        decelerationRate="fast"
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => {
          const inputRange = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.88, 1, 0.88],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <View key={i} style={styles.slide}>
              <Animated.View
                style={[styles.illustrationWrap, { transform: [{ scale }], opacity }]}
              >
                <Illustration kind={slide.illustration} />
              </Animated.View>
              <Animated.Text style={[styles.title, { opacity }]}>
                {slide.title}
              </Animated.Text>
              <Animated.Text style={[styles.subtitle, { opacity }]}>
                {slide.subtitle}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={t('common.letsGetStarted')} onPress={() => router.push('/(onboarding)/intro')} />
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.signInRow}>
          <Text style={styles.signInText}>
            {t('common.alreadyHaveAccount')} <Text style={styles.signInBold}>{t('common.signIn')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Illustration = memo(function Illustration({ kind }: { kind: Slide['illustration'] }) {
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
});

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
      <View style={[styles.macroPctTag, { backgroundColor: OnboardingColors.surfaceElevated }]}>
        <Text style={{ color: OnboardingColors.text, fontSize: 10, fontWeight: '700' }}>{pct}</Text>
      </View>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  logoWrap: { alignItems: 'center', paddingTop: 8 },
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
    backgroundColor: OnboardingColors.text,
  },
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
    backgroundColor: OnboardingColors.surface,
    borderRadius: 28,
    padding: 18,
    width: SCREEN_W * 0.78,
    minHeight: 360,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
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
