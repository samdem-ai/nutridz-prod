import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import TimePickerModal from '../../src/components/onboarding/TimePickerModal';
import {
  useOnboardingStore,
  buildProfilePatch,
  getEnabledReminders,
  ReminderSlot,
} from '../../src/store/onboardingStore';
import { useAuthStore } from '../../src/store/authStore';
import { scheduleOnboardingReminders } from '../../src/services/notifications';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

type SlotKey = 'breakfast' | 'lunch' | 'dinner';

const formatTime = (slot: ReminderSlot) => {
  const h = slot.hour.toString().padStart(2, '0');
  const m = slot.minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};

export default function RemindersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reminders, setReminder, mode, setMode } = useOnboardingStore();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [editing, setEditing] = useState<SlotKey | null>(null);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    // Edit mode = came from settings, already logged in.
    // Skip loading + plan-ready (no point showing projection + testimonials).
    // Save profile + reschedule reminders + return to tabs.
    if (mode === 'edit' && isAuthenticated) {
      setSaving(true);
      try {
        await updateProfile(buildProfilePatch() as any);
      } catch (e) {
        console.warn('updateProfile failed:', e);
      }
      scheduleOnboardingReminders(getEnabledReminders()).catch(() => {});
      setMode('create');
      setSaving(false);
      router.replace('/(tabs)');
      return;
    }
    router.push('/(onboarding)/loading');
  };

  const onConfirmTime = (hour: number, minute: number) => {
    if (editing) setReminder(editing, { hour, minute, enabled: true });
    setEditing(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={10 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.remindersTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.remindersHint')}</Text>

        <View style={styles.list}>
          {(['breakfast', 'lunch', 'dinner'] as const).map((key) => (
            <View key={key} style={[styles.row, OnboardingShadows.card]}>
              <TouchableOpacity
                onPress={() => setEditing(key)}
                activeOpacity={0.7}
                delayPressIn={0}
                style={styles.timeBtn}
              >
                <Text style={styles.rowLabel}>{t(`journal.${key}`)}</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.rowTime}>{formatTime(reminders[key])}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={OnboardingColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
              <Switch
                value={reminders[key].enabled}
                onValueChange={(v) => setReminder(key, { enabled: v })}
                trackColor={{ false: OnboardingColors.surfaceElevated, true: OnboardingColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={next} style={styles.skipBtn} delayPressIn={0}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>
        <PrimaryButton
          label={mode === 'edit' ? t('common.saveChanges') : t('common.next')}
          onPress={next}
          loading={saving}
        />
      </View>

      <TimePickerModal
        visible={editing !== null}
        title={editing ? t(`journal.${editing}`) : ''}
        initialHour={editing ? reminders[editing].hour : 12}
        initialMinute={editing ? reminders[editing].minute : 0}
        onCancel={() => setEditing(null)}
        onConfirm={onConfirmTime}
      />
    </SafeAreaView>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: OnboardingColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: OnboardingColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  timeBtn: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 14, color: OnboardingColors.textSecondary, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rowTime: { fontSize: 18, color: OnboardingColors.text, fontWeight: '800' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  skipBtn: { alignItems: 'center', padding: 8 },
  skipText: { color: OnboardingColors.textMuted, fontSize: 15, fontWeight: '700' },
});
