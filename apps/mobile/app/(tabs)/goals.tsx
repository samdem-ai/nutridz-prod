import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useWeightHistory, useGoalsProgress, useLogWeight } from '../../src/hooks/useGoals';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [weight, setWeight] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | '3m'>('weekly');

  const { data: weightHistory, isLoading: weightLoading } = useWeightHistory();
  const { data: progress, isLoading: progressLoading } = useGoalsProgress();
  const logWeightMutation = useLogWeight();

  const handleLogWeight = () => {
    if (!weight) return;
    logWeightMutation.mutate(
      {
        weightKg: parseFloat(weight),
        date: new Date().toISOString().split('T')[0],
      },
      {
        onSuccess: () => {
          setWeight('');
          setShowLogWeight(false);
          Alert.alert('OK', 'Weight logged');
        },
        onError: () => {
          Alert.alert(t('common.error'), 'Failed to log weight');
        },
      }
    );
  };

  // Get latest weight from history
  const latestWeight = Array.isArray(weightHistory) && weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1]?.weightKg
    : user?.weightKg;

  const bmi = latestWeight && user?.heightCm
    ? (latestWeight / ((user.heightCm / 100) ** 2)).toFixed(1)
    : null;

  const stats = [
    { label: t('goals.weight'), value: latestWeight || '--', unit: 'kg', icon: 'scale-outline' },
    { label: t('goals.bmi'), value: bmi || '--', unit: 'kg/m\u00B2', icon: 'body-outline' },
    { label: 'Objectif', value: '--', unit: 'kg', icon: 'flag-outline' },
  ];

  // Weight history entries for display
  const historyEntries = Array.isArray(weightHistory) ? weightHistory : weightHistory?.entries || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('goals.title')}</Text>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statUnit}>{stat.unit}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress summary */}
      {progress && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{t('goals.progress')}</Text>
          {progress.poids_perdu != null && (
            <Text style={styles.progressStat}>
              {progress.poids_perdu > 0 ? '-' : '+'}{Math.abs(progress.poids_perdu).toFixed(1)} kg
            </Text>
          )}
          {progress.message && (
            <Text style={styles.progressMessage}>{progress.message}</Text>
          )}
        </View>
      )}

      {/* Period selector */}
      <View style={styles.periodToggle}>
        {(['weekly', 'monthly', '3m'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'weekly' ? t('goals.weekly') : p === 'monthly' ? t('goals.monthly') : '3M'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weight history list */}
      <View style={styles.chartCard}>
        {weightLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : historyEntries.length > 0 ? (
          <>
            <Text style={styles.historyTitle}>Historique</Text>
            {historyEntries.slice(-10).reverse().map((entry: any, i: number) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.recordedOn}</Text>
                <Text style={styles.historyWeight}>{entry.weightKg} kg</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <Ionicons name="analytics-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.chartText}>{t('goals.progress')}</Text>
            <Text style={styles.chartSubtext}>Aucune donnee de poids</Text>
          </>
        )}
      </View>

      {/* Log Weight */}
      <TouchableOpacity
        style={styles.logButton}
        onPress={() => setShowLogWeight(!showLogWeight)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
        <Text style={styles.logButtonText}>{t('goals.logWeight')}</Text>
      </TouchableOpacity>

      {showLogWeight && (
        <View style={styles.logForm}>
          <TextInput
            style={styles.logInput}
            placeholder="kg"
            placeholderTextColor={Colors.textMuted}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.logSubmit}
            onPress={handleLogWeight}
            disabled={logWeightMutation.isPending}
          >
            {logWeightMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.logSubmitText}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Objective card */}
      <View style={styles.objectiveCard}>
        <Text style={styles.objectiveLabel}>{t('profile.goal')}</Text>
        <Text style={styles.objectiveValue}>
          {user?.nutritionGoal
            ? t(`profile.${user.nutritionGoal === 'WEIGHT_LOSS' ? 'weightLoss' : user.nutritionGoal === 'MUSCLE_GAIN' ? 'muscleGain' : 'maintain'}`)
            : '--'}
        </Text>
        {user?.dailyCalorieTarget && (
          <Text style={styles.objectiveCalories}>
            {Math.round(user.dailyCalorieTarget)} kcal/{t('goals.day') || 'jour'}
          </Text>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: { paddingTop: 60, marginBottom: Theme.spacing.xl },
  title: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  statRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  statValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginTop: Theme.spacing.sm,
  },
  statUnit: { fontSize: Theme.fontSize.xs, color: Colors.textMuted },
  statLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, marginTop: Theme.spacing.xs },
  progressCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  progressStat: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
  },
  progressMessage: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.full,
    padding: 3,
    marginBottom: Theme.spacing.lg,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { color: Colors.textMuted, fontWeight: Theme.fontWeight.medium, fontSize: Theme.fontSize.sm },
  periodTextActive: { color: '#FFF' },
  chartCard: {
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  chartText: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginTop: Theme.spacing.md,
  },
  chartSubtext: { fontSize: Theme.fontSize.sm, color: Colors.textMuted, marginTop: Theme.spacing.xs },
  historyTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
    alignSelf: 'flex-start',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  historyDate: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary },
  historyWeight: { fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.semibold, color: Colors.text },
  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
    ...Theme.glow.subtle,
  },
  logButtonText: { color: '#FFF', fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.md },
  logForm: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  logInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  logSubmit: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xxl,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
  },
  logSubmitText: { color: '#FFF', fontWeight: Theme.fontWeight.semibold },
  objectiveCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  objectiveLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary },
  objectiveValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginVertical: Theme.spacing.xs,
  },
  objectiveCalories: { fontSize: Theme.fontSize.md, color: Colors.primary },
});
