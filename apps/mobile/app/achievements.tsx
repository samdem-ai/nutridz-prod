import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import { useAchievements, useStreak } from '../src/hooks/useGamification';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  JOURNAL: { label: 'Journal', color: Colors.meals.dejeuner },
  STREAK: { label: 'Régularité', color: Colors.warning },
  HYDRATION: { label: 'Hydratation', color: Colors.water },
  WEIGHT: { label: 'Poids', color: Colors.primary },
  AI: { label: 'IA', color: Colors.info },
  CHAT: { label: 'Chat', color: Colors.info },
  COMMUNITY: { label: 'Communauté', color: Colors.warning },
  ALGERIAN: { label: 'Cuisine DZ', color: Colors.primary },
  PLAN: { label: 'Plans', color: Colors.meals.dejeuner },
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { data, isLoading } = useAchievements();
  const { data: streak } = useStreak();

  const grouped: Record<string, any[]> = {};
  (data?.achievements || []).forEach((a) => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Trophées</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Streak hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBg}>
              <Ionicons name="flame" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.heroValue}>{streak?.currentStreak || 0}</Text>
            <Text style={styles.heroLabel}>jours consécutifs</Text>
            {streak && streak.longestStreak > 0 && (
              <Text style={styles.heroSub}>Record: {streak.longestStreak} jours</Text>
            )}
          </View>

          {/* Progress overview */}
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Progression globale</Text>
            <Text style={styles.progressValue}>
              {data?.unlocked || 0} <Text style={styles.progressTotal}>/ {data?.total || 0}</Text>
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${data ? (data.unlocked / data.total) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>

          {/* Achievements by category */}
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = CATEGORIES[cat] || { label: cat, color: Colors.primary };
            const unlockedCount = items.filter((i) => i.unlocked).length;
            return (
              <View key={cat} style={{ marginBottom: Theme.spacing.lg }}>
                <View style={styles.catHeader}>
                  <Text style={styles.catTitle}>{meta.label}</Text>
                  <Text style={[styles.catCount, { color: meta.color }]}>
                    {unlockedCount}/{items.length}
                  </Text>
                </View>
                <View style={styles.grid}>
                  {items.map((a) => (
                    <View
                      key={a.id}
                      style={[
                        styles.achievementCard,
                        a.unlocked && { borderColor: meta.color, backgroundColor: meta.color + '15' },
                      ]}
                    >
                      <View
                        style={[
                          styles.achievementIcon,
                          {
                            backgroundColor: a.unlocked ? meta.color + '30' : Colors.surfaceLight,
                          },
                        ]}
                      >
                        <Ionicons
                          name={a.icon as any}
                          size={24}
                          color={a.unlocked ? meta.color : Colors.textMuted}
                        />
                        {a.unlocked && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.achievementTitle,
                          a.unlocked && { color: Colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {a.title}
                      </Text>
                      <Text style={styles.achievementDesc} numberOfLines={2}>
                        {a.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    paddingVertical: Theme.spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    marginBottom: Theme.spacing.lg,
  },
  heroIconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.warning,
  },
  heroLabel: {
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginTop: -4,
  },
  heroSub: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 8,
  },
  progressCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  progressLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  progressTotal: {
    fontSize: Theme.fontSize.lg,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  catTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  catCount: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  achievementCard: {
    width: '31.5%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
});
