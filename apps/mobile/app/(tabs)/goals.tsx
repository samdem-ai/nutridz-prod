import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useWeightHistory, useGoalsProgress, useLogWeight } from '../../src/hooks/useGoals';
import WeightChart from '../../src/components/ui/WeightChart';

const PERIODS = [
  { key: 'week', labelKey: 'goals.weekly', days: 7 },
  { key: 'month', labelKey: 'goals.monthly', days: 30 },
  { key: '3m', labelKey: 'goals.threeMonths', days: 90 },
  { key: 'all', labelKey: 'goals.all', days: 9999 },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

export default function GoalsScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const getMotivation = (change: number, hasData: boolean) => {
    if (!hasData) return { icon: 'flag-outline' as const, color: Colors.primary, title: t('goals.motivStart'), message: t('goals.motivStartMsg') };
    if (Math.abs(change) < 0.2) return { icon: 'checkmark-circle' as const, color: Colors.info, title: t('goals.motivStable'), message: t('goals.motivStableMsg') };
    if (change < -2) return { icon: 'trophy' as const, color: Colors.primary, title: t('goals.motivExcellent'), message: t('goals.motivExcellentMsg', { kg: Math.abs(change).toFixed(1) }) };
    if (change < 0) return { icon: 'trending-down' as const, color: Colors.primary, title: t('goals.motivGood'), message: t('goals.motivGoodMsg', { kg: Math.abs(change).toFixed(1) }) };
    if (change > 2) return { icon: 'fitness' as const, color: Colors.warning, title: t('goals.motivStayMotivated'), message: t('goals.motivStayMotivatedMsg', { kg: change.toFixed(1) }) };
    return { icon: 'trending-up' as const, color: Colors.warning, title: t('goals.motivAdjust'), message: t('goals.motivAdjustMsg', { kg: change.toFixed(1) }) };
  };
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [weight, setWeight] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('month');

  const { data: weightHistory, isLoading: weightLoading } = useWeightHistory();
  const { data: progress } = useGoalsProgress();
  const logWeightMutation = useLogWeight();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const allEntries = Array.isArray(weightHistory) ? weightHistory : [];
  const periodCfg = PERIODS.find((p) => p.key === period)!;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodCfg.days);
  const filtered = allEntries.filter((e: any) => new Date(e.recordedOn) >= cutoff);
  const chartData = (filtered.length > 0 ? filtered : allEntries).map((e: any) => ({
    date: e.recordedOn,
    weightKg: e.weightKg,
  }));

  const sortedAll = [...allEntries].sort((a: any, b: any) => a.recordedOn.localeCompare(b.recordedOn));
  const latestWeight = sortedAll.length > 0 ? sortedAll[sortedAll.length - 1].weightKg : user?.weightKg;
  const startWeight = sortedAll.length > 0 ? sortedAll[0].weightKg : user?.weightKg;
  const totalChange = (latestWeight && startWeight) ? latestWeight - startWeight : 0;
  const bmi = latestWeight && user?.heightCm ? latestWeight / ((user.heightCm / 100) ** 2) : null;
  const bmiCategory = bmi ? (bmi < 18.5 ? t('goals.bmiInsufficient') : bmi < 25 ? t('goals.bmiNormal') : bmi < 30 ? t('goals.bmiOverweight') : t('goals.bmiObese')) : '--';
  const bmiColor = bmi ? (bmi < 18.5 ? Colors.info : bmi < 25 ? Colors.primary : bmi < 30 ? Colors.warning : Colors.error) : Colors.textMuted;

  const motivation = getMotivation(totalChange, sortedAll.length > 0);

  const handleLogWeight = () => {
    const w = parseFloat(weight);
    if (!w || w < 20 || w > 300) {
      Alert.alert(t('common.error'), t('goals.invalidWeight'));
      return;
    }
    logWeightMutation.mutate(
      { weightKg: w, date: new Date().toISOString().split('T')[0] },
      {
        onSuccess: () => {
          setWeight('');
          setShowLogWeight(false);
        },
        onError: () => Alert.alert(t('common.error'), t('common.error')),
      }
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('goals.title')}</Text>
          <Text style={styles.subtitle}>{t('goals.subtitle')}</Text>
        </View>

        {/* Motivation card */}
        <View style={[styles.motivationCard, { borderLeftColor: motivation.color }]}>
          <View style={[styles.motivationIcon, { backgroundColor: motivation.color + '20' }]}>
            <Ionicons name={motivation.icon} size={24} color={motivation.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.motivationTitle, { color: motivation.color }]}>{motivation.title}</Text>
            <Text style={styles.motivationMessage}>{motivation.message}</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{latestWeight ? `${latestWeight.toFixed(1)}` : '--'}</Text>
            <Text style={styles.statUnit}>kg</Text>
            <Text style={styles.statLabel}>{t('goals.current')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: bmiColor }]}>{bmi ? bmi.toFixed(1) : '--'}</Text>
            <Text style={styles.statUnit}>{t('goals.bmi')}</Text>
            <Text style={[styles.statLabel, { color: bmiColor }]}>{bmiCategory}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: totalChange === 0 ? Colors.text : totalChange < 0 ? Colors.primary : Colors.warning }]}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
            <Text style={styles.statLabel}>{t('goals.evolution')}</Text>
          </View>
        </View>

        {/* Chart card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('goals.weightEvolution')}</Text>
          </View>

          <View style={styles.periodToggle}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
                onPress={() => setPeriod(p.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                  {t(p.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {weightLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 30 }} />
          ) : (
            <WeightChart data={chartData} height={180} />
          )}
        </View>

        {/* Recent entries */}
        {sortedAll.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>{t('goals.recentHistory')}</Text>
            {sortedAll.slice(-5).reverse().map((entry: any, i: number) => {
              const prevWeight = i < sortedAll.slice(-5).reverse().length - 1
                ? sortedAll.slice(-5).reverse()[i + 1]?.weightKg
                : null;
              const delta = prevWeight ? entry.weightKg - prevWeight : 0;
              return (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{formatFullDate(entry.recordedOn)}</Text>
                    {entry.bmi && <Text style={styles.historyBmi}>{t('goals.bmi')} {entry.bmi.toFixed(1)}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyWeight}>{entry.weightKg.toFixed(1)} kg</Text>
                    {delta !== 0 && prevWeight && (
                      <Text style={[styles.historyDelta, { color: delta < 0 ? Colors.primary : Colors.warning }]}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Goal card */}
        <View style={styles.goalCard}>
          <Ionicons name="flag" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.goalLabel}>{t('profile.goal')}</Text>
            <Text style={styles.goalValue}>
              {user?.nutritionGoal === 'WEIGHT_LOSS' ? t('profile.weightLoss')
                : user?.nutritionGoal === 'MUSCLE_GAIN' ? t('profile.muscleGain')
                : user?.nutritionGoal === 'MAINTENANCE' ? t('profile.maintain')
                : user?.nutritionGoal === 'BALANCED' ? t('profile.balanced')
                : '--'}
            </Text>
          </View>
          {user?.dailyCalorieTarget && (
            <View style={styles.goalCalPill}>
              <Text style={styles.goalCalText}>{Math.round(user.dailyCalorieTarget)} {t('goals.kcalPerDay')}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Floating action button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowLogWeight(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
        <Text style={styles.fabText}>{t('common.save')}</Text>
      </TouchableOpacity>

      {/* Log weight modal */}
      <Modal visible={showLogWeight} transparent animationType="fade" onRequestClose={() => setShowLogWeight(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowLogWeight(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconBg}>
              <Ionicons name="scale" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>{t('goals.weightToday')}</Text>
            <Text style={styles.modalSubtitle}>{t('goals.weightHint')}</Text>
            <View style={styles.weightInputWrap}>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="70.5"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <Text style={styles.weightSuffix}>kg</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogWeight(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, logWeightMutation.isPending && { opacity: 0.5 }]}
                onPress={handleLogWeight}
                disabled={logWeightMutation.isPending}
                activeOpacity={0.85}
              >
                {logWeightMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function formatFullDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: { paddingTop: 60, marginBottom: Theme.spacing.xl },
  title: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  subtitle: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  motivationCard: {
    ...Theme.darkCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    borderLeftWidth: 4,
    marginBottom: Theme.spacing.lg,
  },
  motivationIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  motivationTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 2,
  },
  motivationMessage: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  statValue: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  statUnit: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: -4,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  chartCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  chartTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Theme.borderRadius.full,
    padding: 3,
    marginBottom: Theme.spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { color: Colors.textMuted, fontWeight: Theme.fontWeight.medium, fontSize: Theme.fontSize.xs },
  periodTextActive: { color: '#FFF' },
  historyCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  historyTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Theme.spacing.md,
  },
  historyDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  historyDate: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    fontWeight: Theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  historyBmi: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyWeight: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  historyDelta: {
    fontSize: 11,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: 2,
  },
  goalCard: {
    ...Theme.darkCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  goalLabel: { fontSize: Theme.fontSize.xs, color: Colors.textMuted },
  goalValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginTop: 2,
  },
  goalCalPill: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  goalCalText: {
    color: Colors.primary,
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 95,
    right: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    ...Theme.glow.primary,
  },
  fabText: {
    color: '#FFF',
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    ...Theme.darkCard,
    width: '100%',
    alignItems: 'center',
    padding: Theme.spacing.xxl,
  },
  modalIconBg: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Theme.spacing.xl,
  },
  weightInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  weightInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  weightSuffix: {
    paddingRight: Theme.spacing.lg,
    fontSize: Theme.fontSize.md,
    color: Colors.textMuted,
  },
  modalButtons: { flexDirection: 'row', gap: Theme.spacing.sm, width: '100%' },
  modalCancel: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  modalConfirm: {
    flex: 2,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
  },
  modalConfirmText: { color: '#FFF', fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.md },
});
