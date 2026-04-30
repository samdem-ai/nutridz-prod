import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

type TabKey = 'mine' | 'saved' | 'liked';

export default function MyProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [tab, setTab] = useState<TabKey>('mine');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const myRecipes = useQuery({
    queryKey: ['recipes', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/recipes/my');
      return data as any[];
    },
  });

  const savedRecipes = useQuery({
    queryKey: ['recipes', 'saved'],
    queryFn: async () => {
      const { data } = await api.get('/recipes/saved');
      return data as any[];
    },
  });

  const likedRecipes = useQuery({
    queryKey: ['recipes', 'liked'],
    queryFn: async () => {
      const { data } = await api.get('/recipes/liked');
      return data as any[];
    },
  });

  const queryByTab = { mine: myRecipes, saved: savedRecipes, liked: likedRecipes };
  const active = queryByTab[tab];
  const recipes = active.data || [];

  // Refresh all 3 lists every time the screen is focused so likes/saves done
  // elsewhere (feed, recipe detail) show up immediately when user returns here.
  useFocusEffect(
    useCallback(() => {
      myRecipes.refetch();
      savedRecipes.refetch();
      likedRecipes.refetch();
    }, [])
  );

  const totalLikes = (myRecipes.data || []).reduce((sum: number, r: any) => sum + (r.likesCount || 0), 0);
  const myCount = myRecipes.data?.length ?? 0;
  const savedCount = savedRecipes.data?.length ?? 0;
  const likedCount = likedRecipes.data?.length ?? 0;

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('profile.permissionRequired'), t('profile.permissionPhotoMsg'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.2,           // very aggressive — avatar doesn't need quality
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;

      setUploadingAvatar(true);
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert(t('common.error'), t('common.error'));
        return;
      }
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;

      // Cap at ~2MB encoded — backend supports MEDIUMTEXT (16MB) but we keep it lean
      if (dataUri.length > 2_500_000) {
        Alert.alert(
          'Image trop grande',
          'Choisis une photo plus petite (idéalement < 2 MB).',
        );
        return;
      }
      await updateProfile({ avatarUrl: dataUri } as any);
    } catch (e: any) {
      console.warn('avatar pick error:', e);
      Alert.alert(t('common.error'), e?.response?.data?.message || e?.message || t('common.error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarUrl: '' } as any);
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const tabsConfig: { key: TabKey; label: string; icon: any; count: number }[] = [
    { key: 'mine', label: t('profile.myRecipes'), icon: 'book', count: myCount },
    { key: 'saved', label: t('profile.saved'), icon: 'bookmark', count: savedCount },
    { key: 'liked', label: t('profile.liked'), icon: 'heart', count: likedCount },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings' as any)} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile hero */}
        <View style={styles.profileHero}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} disabled={uploadingAvatar}>
            <View style={styles.avatarWrap}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user?.username || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFF" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{user?.username || 'Anonyme'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {user?.avatarUrl && (
            <TouchableOpacity onPress={removeAvatar} style={styles.removeAvatarLink}>
              <Text style={styles.removeAvatarText}>{t('profile.removePhoto')}</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{myCount}</Text>
              <Text style={styles.statLabel}>{t('profile.myRecipes')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalLikes}</Text>
              <Text style={styles.statLabel}>{t('profile.likesReceived')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>{t('profile.saved')}</Text>
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/create-recipe' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.actionText}>{t('profile.newRecipe')}</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabsConfig.map((tc) => {
            const isActive = tab === tc.key;
            return (
              <TouchableOpacity
                key={tc.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setTab(tc.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tc.icon}
                  size={15}
                  color={isActive ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tc.label}
                </Text>
                {tc.count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && { color: '#FFF' }]}>{tc.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recipes list */}
        {active.isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : recipes.length > 0 ? (
          <View style={styles.recipesList}>
            {recipes.map((r: any) => (
              <TouchableOpacity
                key={r.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${r.id}` as any)}
                activeOpacity={0.8}
              >
                {r.imageUrl ? (
                  <Image source={{ uri: r.imageUrl }} style={styles.recipeImage} />
                ) : (
                  <View style={[styles.recipeImage, { backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="restaurant" size={28} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>{r.title}</Text>
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="flame" size={11} color={Colors.macros.calories} />
                      <Text style={styles.metaText}>{Math.round(r.caloriesPerServing || 0)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="heart" size={11} color={Colors.error} />
                      <Text style={styles.metaText}>{r.likesCount || 0}</Text>
                    </View>
                    {r.prepTimeMinutes && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={11} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{r.prepTimeMinutes}m</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  tab === 'mine' ? 'book-outline' :
                  tab === 'saved' ? 'bookmark-outline' : 'heart-outline'
                }
                size={36}
                color={Colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'mine' ? t('profile.noRecipes') :
               tab === 'saved' ? t('profile.noSaved') :
               t('profile.noLiked')}
            </Text>
            <Text style={styles.emptySub}>
              {tab === 'mine'
                ? t('profile.shareFirstRecipe')
                : tab === 'saved'
                ? t('profile.exploreFeed')
                : t('profile.likeRecipes')}
            </Text>
            {tab === 'mine' && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/create-recipe' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>{t('profile.createRecipe')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Theme.spacing.lg,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  profileHero: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarImg: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
  },
  email: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  removeAvatarLink: { marginTop: 6 },
  removeAvatarText: { fontSize: 11, color: Colors.error },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    ...Theme.darkCard,
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.surfaceBorder },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: 999,
    marginTop: Theme.spacing.md,
    ...Theme.glow.subtle,
  },
  actionText: { color: '#FFF', fontWeight: '700', fontSize: Theme.fontSize.sm },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    gap: 6,
    marginBottom: Theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tabActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  recipesList: {
    paddingHorizontal: Theme.spacing.lg,
    gap: 8,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Theme.darkCard,
    padding: 10,
  },
  recipeImage: {
    width: 64, height: 64, borderRadius: 12,
  },
  recipeInfo: { flex: 1 },
  recipeTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  recipeMeta: { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  empty: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    gap: 8,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: 999,
    marginTop: Theme.spacing.md,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
});
