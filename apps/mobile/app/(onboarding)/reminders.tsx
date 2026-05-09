import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore, ReminderSlot } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

interface RowProps {
  label: string;
  slot: ReminderSlot;
  onToggle: (v: boolean) => void;
}

const formatTime = (slot: ReminderSlot) => {
  const h12 = slot.hour % 12 === 0 ? 12 : slot.hour % 12;
  const am = slot.hour < 12 ? 'AM' : 'PM';
  const m = slot.minute.toString().padStart(2, '0');
  return `${h12}:${m} ${am}`;
};

function ReminderRow({ label, slot, onToggle }: RowProps) {
  return (
    <View style={[styles.row, OnboardingShadows.card]}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowTime}>{formatTime(slot)}</Text>
      </View>
      <Switch
        value={slot.enabled}
        onValueChange={onToggle}
        trackColor={{ false: '#D6D2E0', true: OnboardingColors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function RemindersScreen() {
  const router = useRouter();
  const { reminders, setReminder, goal } = useOnboardingStore();
  const next = () => router.push('/(onboarding)/loading');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={9 / 9} />
      <View style={styles.content}>
        <Text style={styles.title}>Stay on track with{'\n'}timely reminders</Text>
        <View style={styles.list}>
          <ReminderRow
            label="Breakfast"
            slot={reminders.breakfast}
            onToggle={(v) => setReminder('breakfast', { enabled: v })}
          />
          <ReminderRow
            label="Lunch"
            slot={reminders.lunch}
            onToggle={(v) => setReminder('lunch', { enabled: v })}
          />
          <ReminderRow
            label="Dinner"
            slot={reminders.dinner}
            onToggle={(v) => setReminder('dinner', { enabled: v })}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity onPress={next} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <PrimaryButton label="Next" onPress={next} />
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
    textAlign: 'center',
    marginBottom: 32,
  },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 14, color: OnboardingColors.textSecondary, fontWeight: '600' },
  rowTime: { fontSize: 18, color: OnboardingColors.text, fontWeight: '800', marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  skipBtn: { alignItems: 'center', padding: 8 },
  skipText: { color: OnboardingColors.textMuted, fontSize: 15, fontWeight: '700' },
});
