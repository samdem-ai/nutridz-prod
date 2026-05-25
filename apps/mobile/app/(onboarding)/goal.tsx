import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import OptionCard from '../../src/components/onboarding/OptionCard';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore, Goal } from '../../src/store/onboardingStore';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

const OPTIONS: { key: Goal; emoji: string; labelKey: string }[] = [
  { key: 'LOSE', emoji: '⚖️', labelKey: 'onboarding.loseWeight' },
  { key: 'MAINTAIN', emoji: '🎯', labelKey: 'onboarding.maintainWeight' },
  { key: 'GAIN', emoji: '💪', labelKey: 'onboarding.gainWeight' },
];

export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { goal, setGoal } = useOnboardingStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={1 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.primaryGoal')}</Text>
        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionCard
              key={o.key}
              emoji={o.emoji}
              title={t(o.labelKey)}
              selected={goal === o.key}
              onPress={() => setGoal(o.key)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label={t('common.next')}
          disabled={!goal}
          onPress={() => router.push('/(onboarding)/sex')}
        />
        <TouchableOpacity style={styles.sourceRow}>
          <Text style={styles.sourceText}>{t('common.sourceRecommendations')}</Text>
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
    marginBottom: 32,
  },
  options: { gap: 12, marginTop: 80 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: {
    color: OnboardingColors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
