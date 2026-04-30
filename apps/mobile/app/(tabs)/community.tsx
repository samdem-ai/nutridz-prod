import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useCommunityRecipes, useLikeRecipe, useReportRecipe, useSaveRecipe } from '../../src/hooks/useCommunity';
import { useAuthStore } from '../../src/store/authStore';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: recipesData, isLoading, isError } = useCommunityRecipes();
  const likeRecipe = useLikeRecipe();
  const saveRecipe = useSaveRecipe();
  const reportRecipe = useReportRecipe();

  const handleReport = (recipeId: number, recipeTitle: string) => {
    Alert.alert(
      t('community.report'),
      `${t('community.reportConfirm', { title: recipeTitle })} ${t('community.reportHelper')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('community.report'),
          style: 'destructive',
          onPress: () => {
            reportRecipe.mutate(
              { id: recipeId, reason: 'Contenu inapproprié' },
              {
                onSuccess: (data) => {
                  Alert.alert(
                    t('community.reported'),
                    data.autoHidden ? t('community.autoHidden') : t('community.totalReports', { count: data.reportedCount })
                  );
                },
                onError: () => Alert.alert(t('common.error'), t('common.error')),
              }
            );
          },
        },
      ]
    );
  };

  const recipes = Array.isArray(recipesData) ? recipesData : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('community.title')}</Text>
            <Text style={styles.subtitle}>{t('community.subtitle')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/my-profile' as any)}
            style={styles.profileBtn}
            activeOpacity={0.7}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileFallback}>
                <Text style={styles.profileInitial}>
                  {(user?.username || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
        )}

        {isError && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="warning" size={40} color={Colors.error} />
            </View>
            <Text style={styles.emptyTitle}>{t('community.loadingError')}</Text>
            <Text style={styles.emptySubtitle}>{t('community.loadingErrorMsg')}</Text>
          </View>
        )}

        {!isLoading && !isError && recipes.length > 0 && (
          recipes.map((recipe: any) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.recipeCard}
              onPress={() => router.push(`/recipe/${recipe.id}` as any)}
              onLongPress={() => handleReport(recipe.id, recipe.title)}
              activeOpacity={0.85}
              delayLongPress={500}
            >
              {recipe.imageUrl && (
                <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
              )}
              <View style={styles.recipeBody}>
                <Text style={styles.recipeName} numberOfLines={2}>{recipe.title}</Text>
                {recipe.description && (
                  <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
                )}
                <View style={styles.recipeMeta}>
                  {recipe.caloriesPerServing != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="flame-outline" size={14} color={Colors.macros.calories} />
                      <Text style={styles.metaText}>{recipe.caloriesPerServing} kcal</Text>
                    </View>
                  )}
                  {recipe.prepTimeMinutes != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{recipe.prepTimeMinutes} min</Text>
                    </View>
                  )}
                </View>
                <View style={styles.recipeActions}>
                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => likeRecipe.mutate(recipe.id)}
                  >
                    <Ionicons
                      name={recipe.likedByMe ? 'heart' : 'heart-outline'}
                      size={20}
                      color={recipe.likedByMe ? Colors.error : Colors.textMuted}
                    />
                    <Text style={styles.likeCount}>{recipe.likesCount || 0}</Text>
                  </TouchableOpacity>
                  <View style={styles.likeBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.likeCount}>{recipe.comments?.length || 0}</Text>
                  </View>
                  {recipe.authorUsername && (
                    <Text style={styles.authorText}>par {recipe.authorUsername}</Text>
                  )}
                  <TouchableOpacity
                    onPress={() => saveRecipe.mutate(recipe.id)}
                    style={{ padding: 4 }}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name={recipe.savedByMe ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={recipe.savedByMe ? Colors.primary : Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!isLoading && !isError && recipes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="people" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('community.feed')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('community.emptyFeed')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-recipe' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: Theme.spacing.lg,
  },
  title: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  subtitle: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: 4 },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileAvatar: { width: '100%', height: '100%' },
  profileFallback: {
    width: '100%', height: '100%',
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitial: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  recipeCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  recipeBody: {
    padding: Theme.spacing.lg,
  },
  recipeName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
  },
  recipeDesc: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
  },
  recipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.lg,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
  },
  authorText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Theme.spacing.xxxl * 2,
    padding: Theme.spacing.xl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.glow.primary,
  },
});
