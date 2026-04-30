import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import CalorieRing from '../../src/components/ui/CalorieRing';
import MacroBar from '../../src/components/ui/MacroBar';
import StreakBadge from '../../src/components/ui/StreakBadge';
import { useJournalSummary } from '../../src/hooks/useJournal';
import { useHydrationDaily, useLogWater } from '../../src/hooks/useHydration';

const today = new Date().toISOString().split('T')[0];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: summary, isLoading: summaryLoading } = useJournalSummary(today);
  const { data: hydration, isLoading: hydrationLoading } = useHydrationDaily(today);
  const logWater = useLogWater();

  const caloriesCible = user?.dailyCalorieTarget || 2000;
  const caloriesConsumed = summary?.calories || 0;
  const proteines = summary?.protein_g || 0;
  const glucides = summary?.carbs_g || 0;
  const lipides = summary?.fat_g || 0;

  const waterConsumed = hydration?.water_ml || 0;
  const waterTarget = hydration?.target_ml || 2000;
  const waterPercent = Math.min((waterConsumed / waterTarget) * 100, 100);

  const handleAddWater = () => {
    logWater.mutate({ ml: 250 });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  const quickActions = [
    { icon: 'restaurant-outline' as const, label: t('home.quickAdd'), color: Colors.meals.LUNCH, route: '/(tabs)/journal' },
    { icon: 'camera-outline' as const, label: t('camera.takePhoto'), color: Colors.primary, route: '/(tabs)/camera' },
    { icon: 'water-outline' as const, label: t('home.hydration'), color: Colors.water, route: null, onPress: handleAddWater },
    { icon: 'chatbubble-outline' as const, label: t('chat.title'), color: Colors.info, route: '/chat' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.username || 'User'}</Text>
        </View>
        <StreakBadge days={summary?.streak || 0} />
      </View>

      {/* Calorie Ring */}
      <View style={[styles.card, { alignItems: 'center', paddingVertical: Theme.spacing.xxl }]}>
        {summaryLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <CalorieRing consumed={caloriesConsumed} target={caloriesCible} size={200} />
        )}
      </View>

      {/* Macros */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('journal.dailyTotal')}</Text>
        <MacroBar
          label={t('journal.proteins')}
          current={proteines}
          target={user?.dailyProteinTarget || 150}
          color={Colors.macros.proteines}
        />
        <MacroBar
          label={t('journal.carbs')}
          current={glucides}
          target={user?.dailyCarbTarget || 250}
          color={Colors.macros.glucides}
        />
        <MacroBar
          label={t('journal.fats')}
          current={lipides}
          target={user?.dailyFatTarget || 65}
          color={Colors.macros.lipides}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionCard}
            onPress={() => {
              if (action.onPress) action.onPress();
              else if (action.route) router.push(action.route as any);
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hydration */}
      <View style={styles.card}>
        <View style={styles.hydrationHeader}>
          <View style={styles.hydrationLeft}>
            <Ionicons name="water" size={20} color={Colors.water} />
            <Text style={styles.sectionLabel}>{t('home.hydration')}</Text>
          </View>
          <Text style={styles.hydrationValue}>
            {hydrationLoading ? '...' : `${waterConsumed} / ${waterTarget} ml`}
          </Text>
        </View>
        <View style={styles.hydrationTrack}>
          <View style={[styles.hydrationFill, { width: `${waterPercent}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.addWaterButton}
          onPress={handleAddWater}
          disabled={logWater.isPending}
        >
          {logWater.isPending ? (
            <ActivityIndicator size="small" color={Colors.water} />
          ) : (
            <>
              <Ionicons name="add" size={18} color={Colors.water} />
              <Text style={styles.addWaterText}>{t('hydration.addGlass')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: Theme.spacing.xl,
  },
  greeting: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  card: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  actionCard: {
    width: '47%',
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  actionLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    fontWeight: Theme.fontWeight.medium,
    textAlign: 'center',
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  hydrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hydrationValue: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.water,
  },
  hydrationTrack: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    backgroundColor: Colors.water,
    borderRadius: 4,
  },
  addWaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.water + '15',
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  addWaterText: {
    color: Colors.water,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: Theme.fontSize.sm,
  },
});
