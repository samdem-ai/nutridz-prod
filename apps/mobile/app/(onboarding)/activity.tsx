import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import OptionCard from '../../src/components/onboarding/OptionCard';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore, Activity } from '../../src/store/onboardingStore';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

const OPTIONS: { key: Activity; emoji: string; title: string; desc: string }[] = [
  {
    key: 'NOT_ACTIVE',
    emoji: '🪑',
    title: 'Not active',
    desc: 'I quickly lose my breath climbing stairs',
  },
  {
    key: 'LIGHTLY_ACTIVE',
    emoji: '🚶',
    title: 'Lightly active',
    desc: 'Sometimes I do short workouts to keep myself moving',
  },
  {
    key: 'MODERATELY_ACTIVE',
    emoji: '🏃',
    title: 'Moderately active',
    desc: 'I maintain a regular exercise routine of 1-2 times per week',
  },
  {
    key: 'HIGHLY_ACTIVE',
    emoji: '🏋️',
    title: 'Highly active',
    desc: 'Fitness is a core part of my lifestyle',
  },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { activity, setActivity, goal } = useOnboardingStore();

  const next = () => {
    if (goal === 'MAINTAIN') {
      router.push('/(onboarding)/reminders');
    } else {
      router.push('/(onboarding)/pace');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={7 / 9} />
      <View style={styles.content}>
        <Text style={styles.title}>How active are you each week?</Text>
        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionCard
              key={o.key}
              emoji={o.emoji}
              title={o.title}
              description={o.desc}
              selected={activity === o.key}
              onPress={() => setActivity(o.key)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Next" disabled={!activity} onPress={next} />
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
    marginBottom: 24,
  },
  options: { gap: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
