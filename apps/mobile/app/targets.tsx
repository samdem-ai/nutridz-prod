import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

export default function TargetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const loadUser = useAuthStore((s) => s.loadUser);

  // Refresh from server on focus so targets reflect latest persisted values
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill the form with the values currently in use. If a target hasn't been
  // explicitly set, fall back to the same defaults the dashboard displays so the
  // user can see and tweak what's actually applied today.
  useEffect(() => {
    if (!user) return;
    setCalories(String(Math.round(user.dailyCalorieTarget ?? 2000)));
    setProtein(String(Math.round(user.dailyProteinTarget ?? 150)));
    setCarbs(String(Math.round(user.dailyCarbTarget ?? 250)));
    setFat(String(Math.round(user.dailyFatTarget ?? 65)));
    setWater(String(Math.round(user.dailyWaterTargetMl ?? 2000)));
  }, [user]);

  const cal = parseFloat(calories) || 0;
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  const computedKcal = p * 4 + c * 4 + f * 9;
  const macroDelta = Math.abs(computedKcal - cal);

  const proteinPct = cal > 0 ? Math.round((p * 4 / cal) * 100) : 0;
  const carbsPct = cal > 0 ? Math.round((c * 4 / cal) * 100) : 0;
  const fatPct = cal > 0 ? Math.round((f * 9 / cal) * 100) : 0;

  const applyPreset = (preset: 'balanced' | 'lowcarb' | 'highprotein' | 'keto') => {
    const baseCal = cal > 0 ? cal : 2000;
    setCalories(String(baseCal));
    if (preset === 'balanced') {
      setProtein(String(Math.round(baseCal * 0.25 / 4)));
      setCarbs(String(Math.round(baseCal * 0.50 / 4)));
      setFat(String(Math.round(baseCal * 0.25 / 9)));
    } else if (preset === 'lowcarb') {
      setProtein(String(Math.round(baseCal * 0.30 / 4)));
      setCarbs(String(Math.round(baseCal * 0.25 / 4)));
      setFat(String(Math.round(baseCal * 0.45 / 9)));
    } else if (preset === 'highprotein') {
      setProtein(String(Math.round(baseCal * 0.35 / 4)));
      setCarbs(String(Math.round(baseCal * 0.40 / 4)));
      setFat(String(Math.round(baseCal * 0.25 / 9)));
    } else if (preset === 'keto') {
      setProtein(String(Math.round(baseCal * 0.25 / 4)));
      setCarbs(String(Math.round(baseCal * 0.05 / 4)));
      setFat(String(Math.round(baseCal * 0.70 / 9)));
    }
  };

  const handleSave = async () => {
    if (cal < 800 || cal > 5000) {
      Alert.alert(t('targets.invalidCalories'), t('targets.invalidCaloriesMsg'));
      return;
    }
    if (macroDelta > cal * 0.15) {
      Alert.alert(
        'Incohérence',
        `Tes macros donnent ${Math.round(computedKcal)} kcal mais ton objectif est ${cal}. Veux-tu sauvegarder quand même ?`,
        [
          { text: 'Corriger', style: 'cancel' },
          { text: 'Sauvegarder', onPress: doSave },
        ]
      );
      return;
    }
    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        dailyCalorieTarget: cal,
        dailyProteinTarget: p,
        dailyCarbTarget: c,
        dailyFatTarget: f,
        dailyWaterTargetMl: parseFloat(water) || 2000,
      } as any);
      Alert.alert(t('targets.saved'), t('targets.savedMsg'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAutoCompute = async () => {
    if (!user?.weightKg || !user?.heightCm || !user?.birthDate || !user?.activityLevel) {
      Alert.alert(t('targets.incompleteProfile'), t('targets.incompleteProfileMsg'));
      return;
    }
    setSaving(true);
    try {
      // Send empty targets — backend will auto-compute
      await updateProfile({
        weightKg: user.weightKg,
      } as any);
      Alert.alert(t('targets.saved'), t('targets.savedMsg'));
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('targets.title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="flag" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{t('targets.heroTitle')}</Text>
            <Text style={styles.heroSub}>
              {t('targets.heroSub')}
            </Text>
          </View>

          {/* Calories */}
          <Text style={styles.sectionLabel}>{t('targets.calories')}</Text>
          <View style={styles.bigInputCard}>
            <Ionicons name="flame" size={26} color={Colors.macros.calories} />
            <TextInput
              style={styles.bigInput}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              placeholder="2000"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.bigSuffix}>kcal/j</Text>
          </View>

          {/* Macros section */}
          <Text style={styles.sectionLabel}>{t('targets.macros')}</Text>

          {/* Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
            <PresetChip label={t('targets.presetBalanced')} sub="25/50/25" onPress={() => applyPreset('balanced')} icon="leaf" />
            <PresetChip label={t('targets.presetLowCarb')} sub="30/25/45" onPress={() => applyPreset('lowcarb')} icon="fitness" />
            <PresetChip label={t('targets.presetHighProtein')} sub="35/40/25" onPress={() => applyPreset('highprotein')} icon="barbell" />
            <PresetChip label={t('targets.presetKeto')} sub="25/5/70" onPress={() => applyPreset('keto')} icon="medical" />
          </ScrollView>

          <MacroInputRow
            label={t('targets.proteins')}
            value={protein}
            onChangeText={setProtein}
            color={Colors.macros.proteines}
            pct={proteinPct}
          />
          <MacroInputRow
            label={t('targets.carbs')}
            value={carbs}
            onChangeText={setCarbs}
            color={Colors.macros.glucides}
            pct={carbsPct}
          />
          <MacroInputRow
            label={t('targets.fats')}
            value={fat}
            onChangeText={setFat}
            color={Colors.macros.lipides}
            pct={fatPct}
          />

          {/* Coherence indicator */}
          <View
            style={[
              styles.coherenceCard,
              macroDelta > cal * 0.15 ? styles.coherenceWarn : styles.coherenceOk,
            ]}
          >
            <Ionicons
              name={macroDelta > cal * 0.15 ? 'warning' : 'checkmark-circle'}
              size={18}
              color={macroDelta > cal * 0.15 ? Colors.warning : Colors.primary}
            />
            <Text style={styles.coherenceText}>
              {macroDelta > cal * 0.15
                ? t('targets.macroOff', { kcal: Math.round(computedKcal), delta: Math.round(macroDelta) })
                : t('targets.macroCoherent', { a: proteinPct, b: carbsPct, c: fatPct })}
            </Text>
          </View>

          {/* Water */}
          <Text style={styles.sectionLabel}>{t('targets.hydrationTarget')}</Text>
          <View style={styles.bigInputCard}>
            <Ionicons name="water" size={26} color={Colors.water} />
            <TextInput
              style={styles.bigInput}
              keyboardType="numeric"
              value={water}
              onChangeText={setWater}
              placeholder="2000"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.bigSuffix}>ml/j</Text>
          </View>

          {/* Auto-compute */}
          <TouchableOpacity
            style={styles.autoBtn}
            onPress={handleAutoCompute}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Ionicons name="calculator" size={18} color={Colors.info} />
            <Text style={styles.autoText}>{t('targets.recompute')}</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveText}>{t('targets.saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PresetChip({ label, sub, onPress, icon }: any) {
  return (
    <TouchableOpacity style={styles.presetChip} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <View>
        <Text style={styles.presetLabel}>{label}</Text>
        <Text style={styles.presetSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MacroInputRow({ label, value, onChangeText, color, pct }: any) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={[styles.pctPill, { backgroundColor: color + '20' }]}>
        <Text style={[styles.pctText, { color }]}>{pct}%</Text>
      </View>
      <TextInput
        style={styles.macroInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
      />
      <Text style={styles.macroSuffix}>g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.text },
  scrollContent: { padding: Theme.spacing.lg },
  heroCard: {
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  heroTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  heroSub: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: Theme.spacing.md,
  },
  sectionLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  bigInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Theme.darkCard,
    paddingVertical: Theme.spacing.lg,
  },
  bigInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    paddingVertical: 0,
  },
  bigSuffix: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  presets: {
    gap: Theme.spacing.sm,
    paddingRight: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  presetLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  presetSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 8,
  },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroLabel: {
    flex: 1,
    fontSize: Theme.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  pctPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    minWidth: 38,
    alignItems: 'center',
  },
  pctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroInput: {
    width: 60,
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'right',
  },
  macroSuffix: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    width: 14,
  },
  coherenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: 8,
  },
  coherenceOk: { backgroundColor: Colors.primary + '15' },
  coherenceWarn: { backgroundColor: Colors.warning + '15' },
  coherenceText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.info + '15',
    marginTop: Theme.spacing.lg,
  },
  autoText: {
    color: Colors.info,
    fontWeight: '600',
    fontSize: Theme.fontSize.sm,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: 999,
    marginTop: Theme.spacing.md,
    ...Theme.glow.subtle,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: Theme.fontSize.md,
  },
});
