import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import {
  useRecipe, useLikeRecipe, useCommentRecipe, useSaveRecipe, useReportRecipe,
} from '../../src/hooks/useCommunity';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);

  const { data: recipe, isLoading } = useRecipe(recipeId);
  const like = useLikeRecipe();
  const save = useSaveRecipe();
  const comment = useCommentRecipe();
  const report = useReportRecipe();

  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = () => {
    const txt = commentText.trim();
    if (txt.length < 2) return;
    comment.mutate(
      { id: recipeId, content: txt },
      {
        onSuccess: () => setCommentText(''),
        onError: () => Alert.alert('Erreur', 'Impossible d\'envoyer'),
      }
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Signaler',
      `Signaler "${recipe?.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: () => report.mutate(
            { id: recipeId, reason: 'Contenu inapproprié' },
            {
              onSuccess: (d) => Alert.alert('Signalé', d.autoHidden ? 'Auto-masquée' : `Signalements: ${d.reportedCount}`),
            }
          ),
        },
      ]
    );
  };

  if (isLoading || !recipe) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Cover image */}
          <View style={styles.coverWrap}>
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="restaurant" size={64} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.coverGradient} />

            {/* Top bar overlay */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => save.mutate(recipeId)} style={styles.iconBtn}>
                  <Ionicons
                    name={recipe.savedByMe ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color="#FFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReport} style={styles.iconBtn}>
                  <Ionicons name="flag-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Title overlay */}
            <View style={styles.titleOverlay}>
              {recipe.isAlgerian && (
                <View style={styles.algerianBadge}>
                  <Ionicons name="flag" size={11} color="#FFF" />
                  <Text style={styles.algerianText}>Algérien</Text>
                </View>
              )}
              <Text style={styles.title}>{recipe.title}</Text>
              {recipe.titleAr && <Text style={styles.titleAr}>{recipe.titleAr}</Text>}
              <Text style={styles.author}>par {recipe.authorUsername}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat icon="time-outline" value={`${recipe.prepTimeMinutes || '—'}`} label="min" />
            <Stat icon="people-outline" value={`${recipe.servings || 1}`} label="parts" />
            <Stat icon="flame" value={`${Math.round(recipe.caloriesPerServing || 0)}`} label="kcal" color={Colors.macros.calories} />
            <Stat icon="heart" value={`${recipe.likesCount || 0}`} label="likes" color={Colors.error} />
          </View>

          {/* Description */}
          {recipe.description && (
            <View style={styles.section}>
              <Text style={styles.descText}>{recipe.description}</Text>
            </View>
          )}

          {/* Macros card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Par portion</Text>
            <View style={styles.macroGrid}>
              <MacroCell value={Math.round(recipe.caloriesPerServing || 0)} unit="kcal" label="Calories" color={Colors.macros.calories} />
              <MacroCell value={`${Math.round(recipe.proteinPerServing || 0)}g`} unit="" label="Protéines" color={Colors.macros.proteines} />
              <MacroCell value={`${Math.round(recipe.carbsPerServing || 0)}g`} unit="" label="Glucides" color={Colors.macros.glucides} />
              <MacroCell value={`${Math.round(recipe.fatPerServing || 0)}g`} unit="" label="Lipides" color={Colors.macros.lipides} />
            </View>
          </View>

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              {recipe.ingredients.map((ing: any) => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <View style={styles.ingDot} />
                  <Text style={styles.ingText}>
                    {ing.label || ing.foodName || 'Ingrédient'}
                  </Text>
                  <Text style={styles.ingQty}>{Math.round(ing.quantityGrams || 0)}g</Text>
                </View>
              ))}
            </View>
          )}

          {/* Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Préparation</Text>
              {recipe.steps
                .sort((a: any, b: any) => (a.stepNumber || 0) - (b.stepNumber || 0))
                .map((step: any) => (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumber}>{step.stepNumber}</Text>
                    </View>
                    <Text style={styles.stepText}>{step.description}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Commentaires {recipe.comments?.length ? `(${recipe.comments.length})` : ''}
            </Text>
            {recipe.comments && recipe.comments.length > 0 ? (
              recipe.comments.map((c: any) => (
                <View key={c.id} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentInitial}>
                      {(c.username || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentHead}>
                      <Text style={styles.commentUser}>{c.username}</Text>
                      <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentBody}>{c.content}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noComments}>Soyez le premier à commenter</Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => like.mutate(recipeId)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={recipe.likedByMe ? 'heart' : 'heart-outline'}
              size={26}
              color={recipe.likedByMe ? Colors.error : Colors.text}
            />
          </TouchableOpacity>
          <View style={styles.commentInputWrap}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={Colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (commentText.trim().length < 2 || comment.isPending) && { opacity: 0.4 },
              ]}
              onPress={handleSubmitComment}
              disabled={commentText.trim().length < 2 || comment.isPending}
              activeOpacity={0.7}
            >
              {comment.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Stat({ icon, value, label, color }: any) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={color || Colors.textSecondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MacroCell({ value, unit, label, color }: any) {
  return (
    <View style={[styles.macroCell, { backgroundColor: color + '15' }]}>
      <Text style={[styles.macroValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingHorizontal: Theme.spacing.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  coverWrap: { height: 320, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 16,
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
  },
  algerianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  algerianText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  titleAr: { fontSize: 16, color: '#FFF', opacity: 0.85, marginTop: 2 },
  author: { fontSize: 12, color: '#FFF', opacity: 0.7, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  descText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroCell: {
    width: '48%',
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  macroValue: { fontSize: 22, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 10,
  },
  ingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  ingText: { flex: 1, fontSize: Theme.fontSize.sm, color: Colors.text },
  ingQty: { fontSize: Theme.fontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumber: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: Theme.fontSize.sm, color: Colors.text, lineHeight: 22, marginTop: 4 },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  commentInitial: { color: Colors.primary, fontWeight: '800' },
  commentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentUser: { fontSize: 13, fontWeight: '700', color: Colors.text },
  commentDate: { fontSize: 11, color: Colors.textMuted },
  commentBody: { fontSize: Theme.fontSize.sm, color: Colors.text, lineHeight: 19 },
  noComments: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    backgroundColor: Colors.background,
  },
  likeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  commentInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    paddingVertical: 10,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    margin: 4,
  },
});
