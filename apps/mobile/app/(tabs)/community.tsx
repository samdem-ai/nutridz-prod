import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useCommunityRecipes, useLikeRecipe } from '../../src/hooks/useCommunity';

const FILTER_TAGS = ['all', 'perte_poids', 'prise_masse', 'healthy', 'algerien'];

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: recipesData, isLoading, isError } = useCommunityRecipes(activeFilter);
  const likeRecipe = useLikeRecipe();

  const recipes = Array.isArray(recipesData) ? recipesData : recipesData?.recipes || recipesData?.results || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('community.title')}</Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterChip, activeFilter === tag && styles.filterChipActive]}
              onPress={() => setActiveFilter(tag)}
            >
              <Text style={[styles.filterText, activeFilter === tag && styles.filterTextActive]}>
                {tag === 'all' ? 'Tout' : tag.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading */}
        {isLoading && (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
        )}

        {/* Error state */}
        {isError && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="warning" size={40} color={Colors.error} />
            </View>
            <Text style={styles.emptyTitle}>Erreur de chargement</Text>
            <Text style={styles.emptySubtitle}>Impossible de charger les recettes</Text>
          </View>
        )}

        {/* Recipe cards */}
        {!isLoading && !isError && recipes.length > 0 && (
          recipes.map((recipe: any) => (
            <View key={recipe.id} style={styles.recipeCard}>
              {recipe.imageUrl && (
                <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
              )}
              <View style={styles.recipeBody}>
                <Text style={styles.recipeName} numberOfLines={2}>{recipe.title}</Text>
                {recipe.description && (
                  <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
                )}
                <View style={styles.recipeMeta}>
                  {recipe.caloriesPerServing && (
                    <View style={styles.metaChip}>
                      <Ionicons name="flame-outline" size={14} color={Colors.macros.calories} />
                      <Text style={styles.metaText}>{Math.round(recipe.caloriesPerServing)} kcal</Text>
                    </View>
                  )}
                  {recipe.prepTimeMinutes && (
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
                      name={recipe.likedByUser ? 'heart' : 'heart-outline'}
                      size={20}
                      color={recipe.likedByUser ? Colors.error : Colors.textMuted}
                    />
                    <Text style={styles.likeCount}>{recipe.likesCount || 0}</Text>
                  </TouchableOpacity>
                  <View style={styles.likeBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.likeCount}>{recipe.commentsCount || 0}</Text>
                  </View>
                  {recipe.authorUsername && (
                    <Text style={styles.authorText}>par {recipe.authorUsername}</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        {/* Empty state */}
        {!isLoading && !isError && recipes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="people" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('community.feed')}</Text>
            <Text style={styles.emptySubtitle}>
              Les recettes de la communaute apparaitront ici
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: {
    paddingTop: 60,
    marginBottom: Theme.spacing.lg,
  },
  title: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  filterRow: { marginBottom: Theme.spacing.lg },
  filterContent: { gap: Theme.spacing.sm },
  filterChip: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  filterTextActive: { color: '#FFF' },
  // Recipe card styles
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
  // Empty / error state
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
