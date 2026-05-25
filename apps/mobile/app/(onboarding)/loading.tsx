import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

const STEP_KEYS = [
  { labelKey: 'onboarding.loadingAnalyzing', delay: 0 },
  { labelKey: 'onboarding.loadingNutrients', delay: 600 },
  { labelKey: 'onboarding.loadingProgress', delay: 1500 },
  { labelKey: 'onboarding.loadingTips', delay: 2400 },
];

const TESTIMONIALS = [
  {
    name: 'Sarah W.',
    rating: 5,
    text: 'Amazing! Taking a picture is way easier than databases. The AI even recognized my dish correctly. Down 13 pounds and it feels great!',
  },
  {
    name: 'Michael T.',
    rating: 5,
    text: 'Busy dad approved! Logging is one tap and fast. Lost 18 lbs. Weekly insights keep me on track.',
  },
];

export default function LoadingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const STEPS = useMemo(
    () => STEP_KEYS.map((s) => ({ label: t(s.labelKey), delay: s.delay })),
    [t]
  );
  const animations = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const [doneIdx, setDoneIdx] = useState(-1);

  useEffect(() => {
    const animSeq = STEPS.map((s, i) =>
      Animated.timing(animations[i], {
        toValue: 1,
        duration: 800,
        delay: s.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );

    Animated.parallel(animSeq).start();

    STEPS.forEach((_, i) => {
      setTimeout(() => setDoneIdx(i), STEPS[i].delay + 800);
    });

    const t = setTimeout(() => {
      router.replace('/(onboarding)/plan-ready');
    }, STEPS[STEPS.length - 1].delay + 1400);

    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('onboarding.loadingTitle')}</Text>

        {STEPS.map((s, i) => {
          const width = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          });
          const isPrimary = i === 0;
          return (
            <View key={i} style={styles.stepWrap}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepStar}>✦</Text>
                <Text style={[styles.stepLabel, doneIdx >= i && styles.stepLabelActive]}>
                  {s.label}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width,
                      backgroundColor: isPrimary
                        ? OnboardingColors.success
                        : OnboardingColors.successMuted,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t) => (
          <View key={t.name} style={[styles.testimonial, OnboardingShadows.card]}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{t.name}</Text>
              <Text style={styles.testStars}>{'⭐️'.repeat(t.rating)}</Text>
            </View>
            <Text style={styles.testBody} numberOfLines={3}>
              {t.text}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bgSuccess },
  body: { paddingHorizontal: 24, paddingTop: 60, gap: 22 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: OnboardingColors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepWrap: { gap: 10 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepStar: { color: OnboardingColors.success, fontSize: 14 },
  stepLabel: { color: OnboardingColors.textSecondary, fontSize: 16, fontWeight: '600' },
  stepLabelActive: { color: OnboardingColors.text },
  barTrack: {
    height: 14,
    backgroundColor: OnboardingColors.trackBg,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 999 },
  testimonials: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    marginTop: 'auto',
  },
  testimonial: {
    flex: 1,
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  testName: { fontSize: 13, fontWeight: '800', color: OnboardingColors.text },
  testStars: { fontSize: 11 },
  testBody: { fontSize: 12, color: OnboardingColors.textSecondary, lineHeight: 17 },
});
