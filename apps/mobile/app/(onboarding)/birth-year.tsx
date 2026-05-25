import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import WheelPicker from '../../src/components/onboarding/WheelPicker';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - 14 - i); // age 14..114

export default function BirthYearScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { birthYear, setBirthYear } = useOnboardingStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={3 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.selectBirthYear')}</Text>
        <View style={styles.wheelWrap}>
          <WheelPicker
            values={YEARS}
            value={birthYear}
            onChange={setBirthYear}
            visibleCount={7}
            itemHeight={72}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label={t('common.next')}
          onPress={() => router.push('/(onboarding)/height')}
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
  wheelWrap: { flex: 1, justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
