import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import {
  useOnboardingStore,
  computeBmi,
  bmiCategory,
  computeDailyCalories,
  computeMacros,
  buildProfilePatch,
} from '../../src/store/onboardingStore';
import { useAuthStore } from '../../src/store/authStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

export default function PlanReadyScreen() {
  const { t } = useTranslation();
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
    diabetic,
    mode,
    setMode,
  } = useOnboardingStore();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const age = new Date().getFullYear() - birthYear;
  const bmi = +computeBmi(heightCm, currentWeightKg).toFixed(1);
  const cat = bmiCategory(bmi);
  const catColor =
    cat === 'Normal' ? OnboardingColors.success
    : cat === 'Underweight' ? OnboardingColors.info
    : cat === 'Overweight' ? OnboardingColors.warning
    : OnboardingColors.error;

  const dailyKcal = computeDailyCalories(sex, age, heightCm, currentWeightKg, activity, paceKgPerWeek);
  const macros = computeMacros(dailyKcal, goal, diabetic, activity, currentWeightKg);
  const carbsPct = Math.round(macros.carbsPct * 100);
  const fatPct = Math.round(macros.fatPct * 100);
  const proteinPct = Math.round(macros.proteinPct * 100);

  const diff = Math.abs(targetWeightKg - currentWeightKg);
  const weeks = paceKgPerWeek === 0 ? 12 : Math.ceil(diff / Math.abs(paceKgPerWeek));
  const reachDate = new Date(Date.now() + weeks * 7 * 86400000);
  const dateStr = reachDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const onCta = async () => {
    setLoading(true);
    // Edit mode = user came from settings, already logged in.
    // Push profile patch + bail back to settings/tabs. Skip register screen.
    if (mode === 'edit' && isAuthenticated) {
      try {
        await updateProfile(buildProfilePatch() as any);
      } catch (e) {
        console.warn('updateProfile failed:', e);
      }
      setMode('create');
      setLoading(false);
      router.replace('/(tabs)');
      return;
    }
    // Create mode = fresh signup
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>{t('onboarding.planReadyHeader')}</Text>
        <Text style={styles.bigHeading}>
          {goal === 'MAINTAIN' ? t('onboarding.planReadyMaintain') : t('onboarding.planReadyReach')}{' '}
          <Text style={{ color: OnboardingColors.success }}>
            {targetWeightKg.toFixed(1)} kg
          </Text>
          {'\n'}{t('onboarding.planReadyBy')} {dateStr}
        </Text>

        {/* Projected progress card */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <Text style={styles.cardTitle}>{t('onboarding.projectedProgress')}</Text>
          <View style={styles.chartWrap}>
            {(() => {
              // Curve direction = goal direction.
              //   LOSE  → top-left to bottom-right (descending)
              //   GAIN  → bottom-left to top-right (ascending)
              //   MAINTAIN → flat
              const isGain = goal === 'GAIN';
              const isMaintain = goal === 'MAINTAIN';
              const yStart = isMaintain ? 70 : isGain ? 110 : 30;
              const yMid = isMaintain ? 70 : isGain ? 50 : 90;
              const yEnd = isMaintain ? 70 : isGain ? 30 : 110;
              const path = isMaintain
                ? `M 20 ${yStart} L 270 ${yEnd}`
                : isGain
                ? `M 20 ${yStart} C 80 ${yStart}, 110 105, 150 ${yMid} S 240 ${yEnd}, 270 ${yEnd}`
                : `M 20 ${yStart} C 80 ${yStart}, 110 35, 150 ${yMid} S 240 ${yEnd}, 270 ${yEnd}`;
              return (
                <>
                  <Svg width={290} height={140} viewBox="0 0 290 140">
                    <Path
                      d={path}
                      stroke="#FCD34D"
                      strokeWidth={4}
                      fill="none"
                    />
                    <Circle cx={20} cy={yStart} r={5} fill="#FCD34D" />
                    <Circle cx={150} cy={yMid} r={6} fill={OnboardingColors.success} />
                    <Circle cx={270} cy={yEnd} r={5} fill={OnboardingColors.success} />
                  </Svg>
                  <View
                    style={[
                      styles.chartTag,
                      { left: 0, top: Math.max(0, yStart - 30) },
                    ]}
                  >
                    <Text style={styles.tagText}>{currentWeightKg.toFixed(1)} kg</Text>
                  </View>
                  <View
                    style={[
                      styles.chartTag,
                      {
                        left: 130,
                        top: Math.max(0, yMid - 30),
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
                        top: Math.min(110, yEnd + 10),
                        backgroundColor: OnboardingColors.successMuted,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: OnboardingColors.success }]}>
                      {isGain ? t('onboarding.tagLeanGain') : isMaintain ? t('onboarding.tagMaintain') : t('onboarding.tagMaintainGoal')}
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
          <View style={styles.bullets}>
            <Bullet text={t('onboarding.bulletResults', { weeks: Math.max(2, Math.round(weeks / 2)) })} />
            <Bullet text={t('onboarding.bulletReach', { date: dateStr })} />
            <Bullet text={t('onboarding.bulletHabits')} />
          </View>
        </View>

        {/* Nutrition recommendations */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <View style={styles.bmiHeader}>
            <Text style={styles.cardTitle}>{t('onboarding.nutritionRecs')}</Text>
            {diabetic ? (
              <View style={[styles.bmiTag, { backgroundColor: OnboardingColors.info }]}>
                <Text style={styles.bmiTagText}>{t('onboarding.diabetesMode')}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.nutriRow}>
            <View style={styles.nutriCal}>
              <Text style={styles.nutriCalEmoji}>🔥</Text>
              <Text style={styles.nutriCalValue}>
                {dailyKcal.toLocaleString()}
              </Text>
              <Text style={styles.nutriCalLabel}>{t('journal.calories')}</Text>
            </View>
            <View style={styles.nutriMacros}>
              <MacroItem pct={carbsPct} grams={macros.carbsG} label={t('journal.carbs')} color={OnboardingColors.success} emoji="🌿" />
              <MacroItem pct={fatPct} grams={macros.fatG} label={t('journal.fats')} color={OnboardingColors.warning} emoji="💧" />
              <MacroItem pct={proteinPct} grams={macros.proteinG} label={t('journal.proteins')} color={OnboardingColors.error} emoji="🍗" />
            </View>
          </View>
          <View style={styles.fiberRow}>
            <Text style={styles.fiberLabel}>{t('onboarding.fiberTarget')}</Text>
            <Text style={styles.fiberValue}>≥ {macros.fiberG} {t('onboarding.fiberPerDay')}</Text>
          </View>
          <Text style={styles.cardDesc}>
            {diabetic
              ? t('onboarding.nutritionDescDiabetic')
              : t('onboarding.nutritionDescStandard')}
          </Text>
        </View>

        {/* How to reach goal */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <Text style={styles.cardTitle}>{t('onboarding.howToReach')}</Text>
          <Tip emoji="🔥" text={t('onboarding.tipTrack')} />
          <Tip emoji="🌿" text={t('onboarding.tipCalories')} />
          <Tip emoji="🥗" text={t('onboarding.tipBalance')} />
        </View>

        {/* BMI */}
        <View style={[styles.card, OnboardingShadows.card]}>
          <View style={styles.bmiHeader}>
            <Text style={styles.cardTitle}>{t('onboarding.yourBmi')}</Text>
            <View style={[styles.bmiTag, { backgroundColor: catColor }]}>
              <Text style={styles.bmiTagText}>
                {cat === 'Normal' ? t('onboarding.bmiNormal')
                  : cat === 'Underweight' ? t('onboarding.bmiUnderweight')
                  : cat === 'Overweight' ? t('onboarding.bmiOverweight')
                  : t('onboarding.bmiObese')}
              </Text>
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
              ? t('onboarding.bmiAdviceNormal')
              : t('onboarding.bmiAdviceOver')}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={mode === 'edit' ? t('common.saveChanges') : t('common.letsGetStarted')}
          loading={loading}
          onPress={onCta}
        />
        <Text style={styles.tagline}>{t('onboarding.futureSelf')}</Text>
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

function MacroItem({
  pct,
  grams,
  label,
  color,
  emoji,
}: {
  pct: number;
  grams: number;
  label: string;
  color: string;
  emoji: string;
}) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.macroBar, { backgroundColor: color }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 12 }}>{emoji}</Text>
        <Text style={styles.macroPct}>{pct}%</Text>
      </View>
      <Text style={styles.macroGrams}>{grams}g</Text>
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
  card: {
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: OnboardingColors.text, marginBottom: 12 },
  cardDesc: { fontSize: 13, color: OnboardingColors.textSecondary, lineHeight: 19, marginTop: 10 },
  chartWrap: { alignItems: 'center', position: 'relative', height: 150 },
  chartTag: {
    position: 'absolute',
    backgroundColor: OnboardingColors.surfaceElevated,
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
  macroGrams: { fontSize: 11, color: OnboardingColors.textSecondary, fontWeight: '600' },
  macroLabel: { fontSize: 10, color: OnboardingColors.textMuted },
  fiberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OnboardingColors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  fiberLabel: { fontSize: 13, color: OnboardingColors.text, fontWeight: '600' },
  fiberValue: { fontSize: 13, color: OnboardingColors.success, fontWeight: '800' },
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
