import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

const LANGUAGES = [
  { code: 'fr', label: 'Francais', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { language, setLanguage } = useSettingsStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile / Targets */}
      <Text style={styles.sectionTitle}>{t('settings.profileGoals')}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.settingRow, styles.langBorder]}
          onPress={() => router.push('/targets' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="flag" size={18} color={Colors.primary} />
            <Text style={styles.settingLabel}>{t('settings.myObjectives')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push('/(auth)/profile-setup' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person" size={18} color={Colors.textSecondary} />
            <Text style={styles.settingLabel}>{t('settings.editProfile')}</Text>
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
              i < LANGUAGES.length - 1 && styles.langBorder,
              language === lang.code && styles.langOptionActive,
            ]}
            onPress={() => setLanguage(lang.code)}
          >
            <View style={styles.langLeft}>
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                {lang.label}
              </Text>
            </View>
            {language === lang.code && (
              <View style={styles.radioActive}>
                <View style={styles.radioInner} />
              </View>
            )}
            {language !== lang.code && <View style={styles.radio} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
      <View style={styles.card}>
        <View style={[styles.settingRow, styles.langBorder]}>
          <View style={styles.settingLeft}>
            <Ionicons name="restaurant-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>{t('settings.mealReminders')}</Text>
              <Text style={styles.settingSub}>8h · 13h · 20h</Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={[styles.settingRow, styles.langBorder]}>
          <View style={styles.settingLeft}>
            <Ionicons name="water-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>{t('settings.waterReminders')}</Text>
              <Text style={styles.settingSub}>10h30 · 14h30 · 17h30</Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="flame-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>{t('settings.streakReminder')}</Text>
              <Text style={styles.settingSub}>21h30</Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>NutriDz v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg },
  sectionTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
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
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  langBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  langOptionActive: {
    backgroundColor: Colors.primaryMuted,
  },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  langFlag: { fontSize: 20 },
  langText: { fontSize: Theme.fontSize.md, color: Colors.text },
  langTextActive: { color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, flex: 1 },
  settingTexts: { flex: 1 },
  settingLabel: { fontSize: Theme.fontSize.md, color: Colors.text },
  settingSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  logoutButton: {
    marginTop: Theme.spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '10',
  },
  logoutText: {
    color: Colors.error,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: Theme.fontSize.md,
  },
  version: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Theme.fontSize.xs,
    marginTop: Theme.spacing.xxl,
    marginBottom: Theme.spacing.xxxl,
  },
});
