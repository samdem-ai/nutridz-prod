import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import OptionCard from '../../src/components/onboarding/OptionCard';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore, Activity } from '../../src/store/onboardingStore';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

const OPTIONS: { key: Activity; emoji: string; titleKey: string; descKey: string }[] = [
  { key: 'NOT_ACTIVE', emoji: '🪑', titleKey: 'onboarding.actNot', descKey: 'onboarding.actNotDesc' },
  { key: 'LIGHTLY_ACTIVE', emoji: '🚶', titleKey: 'onboarding.actLight', descKey: 'onboarding.actLightDesc' },
  { key: 'MODERATELY_ACTIVE', emoji: '🏃', titleKey: 'onboarding.actMod', descKey: 'onboarding.actModDesc' },
  { key: 'HIGHLY_ACTIVE', emoji: '🏋️', titleKey: 'onboarding.actHigh', descKey: 'onboarding.actHighDesc' },
];

export default function ActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activity, setActivity, goal } = useOnboardingStore();

  const next = () => router.push('/(onboarding)/diabetes');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={7 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.activityTitle')}</Text>
        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionCard
              key={o.key}
              emoji={o.emoji}
              title={t(o.titleKey)}
              description={t(o.descKey)}
              selected={activity === o.key}
              onPress={() => setActivity(o.key)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label={t('common.next')} disabled={!activity} onPress={next} />
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
    marginBottom: 24,
  },
  options: { gap: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
