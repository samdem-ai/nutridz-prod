import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import {
  useOnboardingStore,
  getEnabledReminders,
  computeBmi,
  bmiCategory,
  ReminderSlot,
} from '../src/store/onboardingStore';
import { scheduleNotificationsIfPermitted } from '../src/services/notifications';
import TimePickerModal from '../src/components/onboarding/TimePickerModal';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

const LANGUAGES = [
  { code: 'fr', label: 'Francais', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
];

type SlotKey = 'breakfast' | 'lunch' | 'dinner';

const formatTime = (slot: ReminderSlot) =>
  `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;

const goalLabel = (g: string | null, t: any) => {
  if (g === 'LOSE') return t('onboarding.loseWeight');
  if (g === 'GAIN') return t('onboarding.gainWeight');
  if (g === 'MAINTAIN') return t('onboarding.maintainWeight');
  return '—';
};
const activityLabel = (a: string | null, t: any) => {
  if (a === 'NOT_ACTIVE') return t('onboarding.actNot');
  if (a === 'LIGHTLY_ACTIVE') return t('onboarding.actLight');
  if (a === 'MODERATELY_ACTIVE') return t('onboarding.actMod');
  if (a === 'HIGHLY_ACTIVE') return t('onboarding.actHigh');
  return '—';
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const {
    language,
    setLanguage,
    hydrationNudges,
    streakReminder,
    setHydrationNudges,
    setStreakReminder,
  } = useSettingsStore();
  const onboarding = useOnboardingStore();
  const { reminders, setReminder, setMode } = onboarding;

  const [editing, setEditing] = useState<SlotKey | null>(null);

  const reschedule = () => {
    scheduleNotificationsIfPermitted(
      {
        enableMealReminders: true,
        enableHydrationNudges: hydrationNudges,
        enableStreakReminder: streakReminder,
      },
      getEnabledReminders()
    ).catch(() => {});
  };

  const toggleMeal = (key: SlotKey, v: boolean) => {
    setReminder(key, { enabled: v });
    setTimeout(reschedule, 50);
  };

  const onConfirmTime = (hour: number, minute: number) => {
    if (editing) {
      setReminder(editing, { hour, minute, enabled: true });
      setEditing(null);
      setTimeout(reschedule, 50);
    }
  };

  const editProfile = () => {
    setMode('edit');
    router.push('/(onboarding)/goal');
  };

  const toggleHydration = async (v: boolean) => {
    await setHydrationNudges(v);
    reschedule();
  };
  const toggleStreak = async (v: boolean) => {
    await setStreakReminder(v);
    reschedule();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Derived display values
  const bmi = onboarding.currentWeightKg > 0
    ? +computeBmi(onboarding.heightCm, onboarding.currentWeightKg).toFixed(1)
    : 0;
  const cat = bmi > 0 ? bmiCategory(bmi) : null;
  const age = onboarding.birthYear ? new Date().getFullYear() - onboarding.birthYear : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile snapshot — values from onboarding store */}
      <Text style={styles.sectionTitle}>{t('settings.profileGoals')}</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileTitleWrap}>
            <Text style={styles.profileGoal}>{goalLabel(onboarding.goal, t)}</Text>
            <Text style={styles.profileSub}>
              {age ? `${age}y · ` : ''}
              {onboarding.heightCm}cm · {onboarding.currentWeightKg.toFixed(1)}kg
            </Text>
          </View>
          {cat && (
            <View style={[styles.bmiBadge, { backgroundColor: Colors.primaryMuted }]}>
              <Text style={styles.bmiBadgeValue}>{bmi}</Text>
              <Text style={styles.bmiBadgeLabel}>{cat}</Text>
            </View>
          )}
        </View>
        <View style={styles.chipsRow}>
          <Chip icon="walk" text={activityLabel(onboarding.activity, t)} />
          {onboarding.goal !== 'MAINTAIN' && (
            <Chip
              icon="trending-down"
              text={`${t('goalsExtra.target')} ${onboarding.targetWeightKg.toFixed(1)}kg`}
            />
          )}
          {onboarding.diabetic && (
            <Chip icon="medkit" text={t('onboarding.diabetesMode')} color={Colors.info} />
          )}
        </View>
        <TouchableOpacity
          onPress={editProfile}
          style={styles.editBtn}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
          <Text style={styles.editBtnText}>{t('settings.editProfile')}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.targetsRow}
          onPress={() => router.push('/targets' as any)}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="flag" size={18} color={Colors.textSecondary} />
            <Text style={styles.settingLabel}>{t('settings.myObjectives')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Language */}
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <View style={styles.card}>
        {LANGUAGES.map((lang, i) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langOption,
              i < LANGUAGES.length - 1 && styles.divider,
              language === lang.code && styles.langOptionActive,
            ]}
            onPress={() => setLanguage(lang.code)}
            delayPressIn={0}
          >
            <View style={styles.langLeft}>
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                {lang.label}
              </Text>
            </View>
            {language === lang.code ? (
              <View style={styles.radioActive}>
                <View style={styles.radioInner} />
              </View>
            ) : (
              <View style={styles.radio} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Meal reminders synced w/ onboarding */}
      <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
      <View style={styles.card}>
        {(['breakfast', 'lunch', 'dinner'] as SlotKey[]).map((key, idx) => (
          <View
            key={key}
            style={[styles.settingRow, idx < 2 && styles.divider]}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={
                  key === 'breakfast'
                    ? 'sunny-outline'
                    : key === 'lunch'
                    ? 'restaurant-outline'
                    : 'moon-outline'
                }
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.settingTexts}>
                <Text style={styles.settingLabel}>{t(`journal.${key}`)}</Text>
                <TouchableOpacity onPress={() => setEditing(key)} delayPressIn={0}>
                  <Text style={styles.timePill}>{formatTime(reminders[key])} ▾</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Switch
              value={reminders[key].enabled}
              onValueChange={(v) => toggleMeal(key, v)}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        ))}
      </View>

      {/* Hydration + streak */}
      <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
        <View style={[styles.settingRow, styles.divider]}>
          <View style={styles.settingLeft}>
            <Ionicons name="water-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>{t('settings.waterReminders')}</Text>
              <Text style={styles.settingSub}>10:30 · 14:30 · 17:30</Text>
            </View>
          </View>
          <Switch
            value={hydrationNudges}
            onValueChange={toggleHydration}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="flame-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>{t('settings.streakReminder')}</Text>
              <Text style={styles.settingSub}>21:30</Text>
            </View>
          </View>
          <Switch
            value={streakReminder}
            onValueChange={toggleStreak}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} delayPressIn={0}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>NutriDz v1.0.0</Text>

      <TimePickerModal
        visible={editing !== null}
        title={editing ? t(`journal.${editing}`) : ''}
        initialHour={editing ? reminders[editing].hour : 12}
        initialMinute={editing ? reminders[editing].minute : 0}
        onCancel={() => setEditing(null)}
        onConfirm={onConfirmTime}
      />
    </ScrollView>
  );
}

function Chip({ icon, text, color = Colors.primary }: { icon: any; text: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 60 },
  sectionTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  profileTitleWrap: { flex: 1 },
  profileGoal: { fontSize: Theme.fontSize.xl, fontWeight: '900', color: Colors.text },
  profileSub: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  bmiBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  bmiBadgeValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  bmiBadgeLabel: { fontSize: 10, color: Colors.primary, fontWeight: '700', marginTop: -2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Theme.spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    gap: 6,
  },
  editBtnText: {
    flex: 1,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },

  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  langOptionActive: { backgroundColor: Colors.primaryMuted },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  langFlag: { fontSize: 20 },
  langText: { fontSize: Theme.fontSize.md, color: Colors.text },
  langTextActive: { color: Colors.primary, fontWeight: '700' },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  radioActive: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, flex: 1 },
  settingTexts: { flex: 1 },
  settingLabel: { fontSize: Theme.fontSize.md, color: Colors.text, fontWeight: '600' },
  settingSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  timePill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 999,
  },
  logoutButton: {
    marginTop: Theme.spacing.xxxl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '10',
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: Theme.fontSize.md },
  version: {
    textAlign: 'center', color: Colors.textMuted, fontSize: Theme.fontSize.xs,
    marginTop: Theme.spacing.xxl, marginBottom: Theme.spacing.xxxl,
  },
});
