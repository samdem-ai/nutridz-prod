import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import CalorieRing from '../../src/components/ui/CalorieRing';
import MacroBar from '../../src/components/ui/MacroBar';
import { useJournalSummary } from '../../src/hooks/useJournal';
import { useHydrationDaily, useLogWater } from '../../src/hooks/useHydration';
import { useStreak, useAchievements } from '../../src/hooks/useGamification';

const today = new Date().toISOString().split('T')[0];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: summary, isLoading: summaryLoading } = useJournalSummary(today);
  const { data: hydration } = useHydrationDaily(today);
  const { data: streak } = useStreak();
  const { data: achievements } = useAchievements();
  const logWater = useLogWater();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const caloriesCible = user?.dailyCalorieTarget || 2000;
  const caloriesConsumed = summary?.calories || 0;
  const protein = summary?.protein || 0;
  const carbs = summary?.carbs || 0;
  const fat = summary?.fat || 0;

  const waterConsumed = hydration?.totalMl || 0;
  const waterTarget = hydration?.targetMl || user?.dailyWaterTargetMl || 2000;
  const waterPercent = Math.min((waterConsumed / waterTarget) * 100, 100);
  const waterGlasses = hydration?.glassCount || 0;

  const handleAddWater = () => {
    logWater.mutate({ mlToAdd: 250 });
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { greeting: t('home.greetingNight'), icon: 'moon' as const, color: '#8B5CF6', tint: '#8B5CF615' };
    if (hour < 12) return { greeting: t('home.greetingMorning'), icon: 'sunny' as const, color: '#F59E0B', tint: '#F59E0B15' };
    if (hour < 18) return { greeting: t('home.greetingAfternoon'), icon: 'partly-sunny' as const, color: '#3B82F6', tint: '#3B82F615' };
    return { greeting: t('home.greetingEvening'), icon: 'moon' as const, color: '#8B5CF6', tint: '#8B5CF615' };
  };

  const tod = getTimeOfDay();
  const remaining = Math.max(0, caloriesCible - caloriesConsumed);
  const calPercent = Math.min(100, (caloriesConsumed / caloriesCible) * 100);

  const getDailyInsight = () => {
    if (caloriesConsumed === 0) return { icon: 'restaurant' as const, text: t('home.insightStart') };
    if (calPercent < 30) return { icon: 'flame' as const, text: t('home.insightLow', { remaining }) };
    if (calPercent < 70) return { icon: 'checkmark-circle' as const, text: t('home.insightMid') };
    if (calPercent < 100) return { icon: 'warning' as const, text: t('home.insightHigh', { remaining }) };
    return { icon: 'alert-circle' as const, text: t('home.insightOver', { over: Math.round(caloriesConsumed - caloriesCible) }) };
  };
  const insight = getDailyInsight();

  const quickActions = [
    { icon: 'camera' as const, label: t('home.quickPhoto'), color: Colors.primary, route: '/(tabs)/camera' },
    { icon: 'barcode' as const, label: t('home.quickBarcode'), color: Colors.info, route: '/barcode' },
    { icon: 'water' as const, label: t('home.quickWater'), color: Colors.water, onPress: handleAddWater },
    { icon: 'calendar' as const, label: t('home.quickMealPlan'), color: Colors.meals.dejeuner, route: '/meal-plan' },
  ];

  const quickActions2 = [
    { icon: 'restaurant' as const, label: t('home.quickJournal'), color: Colors.meals.dejeuner, route: '/(tabs)/journal' },
    { icon: 'flag' as const, label: t('home.quickAlgerian'), color: Colors.warning, route: '/algerian-dishes' },
    { icon: 'chatbubble' as const, label: t('home.quickChat'), color: Colors.info, route: '/chat' },
    { icon: 'trophy' as const, label: t('home.quickAchievements'), color: Colors.warning, route: '/achievements' },
  ];

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.push('/my-profile' as any)}
          activeOpacity={0.7}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>
                {(user?.username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greeting}>{tod.greeting}</Text>
            <Text style={styles.name}>{user?.username || 'User'}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {streak && streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color={Colors.warning} />
              <Text style={styles.streakText}>{streak.currentStreak}j</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/achievements' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="trophy-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome banner with time-of-day color */}
      <View style={[styles.welcomeBanner, { backgroundColor: tod.tint, borderColor: tod.color + '30' }]}>
        <View style={[styles.welcomeIconBg, { backgroundColor: tod.color + '25' }]}>
          <Ionicons name={tod.icon} size={22} color={tod.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>{insight.text}</Text>
        </View>
      </View>

      {/* Calorie Ring + remaining */}
      <View style={[styles.card, styles.ringCard]}>
        {summaryLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <>
            <View style={styles.ringHeaderRow}>
              <Text style={styles.cardLabel}>{t('home.caloriesToday')}</Text>
              {streak && streak.currentStreak > 0 && (
                <View style={styles.miniStreakBadge}>
                  <Ionicons name="flame" size={10} color={Colors.warning} />
                  <Text style={styles.miniStreakText}>{streak.currentStreak}j</Text>
                </View>
              )}
            </View>
            <CalorieRing consumed={caloriesConsumed} target={caloriesCible} size={200} />
            <View style={styles.calStats}>
              <View style={styles.calStat}>
                <Text style={styles.calStatValue}>{Math.round(caloriesConsumed)}</Text>
                <Text style={styles.calStatLabel}>{t('home.consumed')}</Text>
              </View>
              <View style={styles.calDivider} />
              <View style={styles.calStat}>
                <Text style={[styles.calStatValue, { color: Colors.primary }]}>{remaining}</Text>
                <Text style={styles.calStatLabel}>{t('home.remaining')}</Text>
              </View>
              <View style={styles.calDivider} />
              <View style={styles.calStat}>
                <Text style={styles.calStatValue}>{Math.round(caloriesCible)}</Text>
                <Text style={styles.calStatLabel}>{t('home.goal')}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Macros Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="pie-chart" size={18} color={Colors.primary} />
          <Text style={styles.cardLabel}>{t('home.macros')}</Text>
        </View>
        <MacroBar
          label={t('journal.proteins')}
          current={protein}
          target={user?.dailyProteinTarget || 150}
          color={Colors.macros.proteines}
        />
        <MacroBar
          label={t('journal.carbs')}
          current={carbs}
          target={user?.dailyCarbTarget || 250}
          color={Colors.macros.glucides}
        />
        <MacroBar
          label={t('journal.fats')}
          current={fat}
          target={user?.dailyFatTarget || 65}
          color={Colors.macros.lipides}
        />
      </View>

      {/* Quick Actions row 1 */}
      <View style={styles.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionCard}
            onPress={() => {
              if (action.onPress) action.onPress();
              else if (action.route) router.push(action.route as any);
            }}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions row 2 */}
      <View style={styles.actionsGrid}>
        {quickActions2.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionCard}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Achievement summary */}
      {achievements && achievements.unlocked > 0 && (
        <TouchableOpacity
          style={styles.achievementCard}
          onPress={() => router.push('/achievements' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.achievementIconBg}>
            <Ionicons name="trophy" size={24} color={Colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementTitle}>{t('home.achievementsProgress', { unlocked: achievements.unlocked, total: achievements.total })}</Text>
            <View style={styles.achievementBar}>
              <View style={[styles.achievementFill, { width: `${(achievements.unlocked / achievements.total) * 100}%` }]} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Hydration Card */}
      <View style={styles.card}>
        <View style={styles.hydrationHeader}>
          <View style={styles.hydrationLeft}>
            <View style={[styles.hydrationIconBg]}>
              <Ionicons name="water" size={18} color={Colors.water} />
            </View>
            <View>
              <Text style={styles.cardLabel}>{t('home.hydration')}</Text>
              <Text style={styles.hydrationGlasses}>{waterGlasses} {waterGlasses > 1 ? t('home.glassesOf') : t('home.glassOf')}</Text>
            </View>
          </View>
          <Text style={styles.hydrationValue}>{waterConsumed}ml</Text>
        </View>
        <View style={styles.hydrationTrack}>
          <Animated.View style={[styles.hydrationFill, { width: `${waterPercent}%` }]} />
        </View>
        <View style={styles.hydrationFooter}>
          <Text style={styles.hydrationTarget}>{t('home.goal')}: {waterTarget}ml</Text>
          <TouchableOpacity
            style={styles.addWaterButton}
            onPress={handleAddWater}
            disabled={logWater.isPending}
            activeOpacity={0.7}
          >
            {logWater.isPending ? (
              <ActivityIndicator size="small" color={Colors.water} />
            ) : (
              <>
                <Ionicons name="add" size={16} color={Colors.water} />
                <Text style={styles.addWaterText}>{t('home.addWater')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </Animated.ScrollView>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.primary },
  headerAvatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerAvatarText: { color: Colors.primary, fontWeight: '800', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: Colors.warning,
    fontWeight: '700',
    fontSize: 13,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  achievementIconBg: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  achievementBar: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    marginBottom: Theme.spacing.lg,
  },
  welcomeIconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    lineHeight: 19,
  },
  card: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  ringHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Theme.spacing.sm,
  },
  miniStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  miniStreakText: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  calStats: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  calStat: { flex: 1, alignItems: 'center' },
  calStatValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  calStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  calDivider: { width: 1, backgroundColor: Colors.surfaceBorder },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  cardLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  actionCard: {
    flex: 1,
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xs,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  actionLabel: {
    fontSize: Theme.fontSize.xs,
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
    gap: 12,
  },
  hydrationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.water + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationGlasses: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  hydrationValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.water,
  },
  hydrationTrack: {
    height: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 5,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    backgroundColor: Colors.water,
    borderRadius: 5,
  },
  hydrationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hydrationTarget: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
  },
  addWaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.water + '15',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
  },
  addWaterText: {
    color: Colors.water,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: Theme.fontSize.sm,
  },
});
