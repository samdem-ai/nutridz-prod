import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import OptionCard from '../../src/components/onboarding/OptionCard';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

export default function DiabetesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { diabetic, setDiabetic, goal } = useOnboardingStore();

  const next = () => {
    if (goal === 'MAINTAIN') {
      router.push('/(onboarding)/reminders');
    } else {
      router.push('/(onboarding)/pace');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={8 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.diabetesTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.diabetesSub')}</Text>

        <View style={styles.options}>
          <OptionCard
            emoji="✅"
            title={t('onboarding.diabetesYes')}
            description={t('onboarding.diabetesYesDesc')}
            selected={diabetic === true}
            onPress={() => setDiabetic(true)}
          />
          <OptionCard
            emoji="❌"
            title={t('onboarding.diabetesNo')}
            description={t('onboarding.diabetesNoDesc')}
            selected={diabetic === false}
            onPress={() => setDiabetic(false)}
          />
        </View>

        <View style={[styles.disclaimer, OnboardingShadows.card]}>
          <Text style={styles.disclaimerTitle}>{t('onboarding.medicalDisclaimer')}</Text>
          <Text style={styles.disclaimerBody}>
            {t('onboarding.medicalDisclaimerBody')}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label={t('common.next')} disabled={diabetic === null} onPress={next} />
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
  title: { fontSize: 24, fontWeight: '800', color: OnboardingColors.text, marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: OnboardingColors.textSecondary,
    marginBottom: 28,
    lineHeight: 20,
  },
  options: { gap: 12 },
  disclaimer: {
    backgroundColor: OnboardingColors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 28,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: OnboardingColors.warning,
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: 12,
    color: OnboardingColors.textSecondary,
    lineHeight: 17,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
