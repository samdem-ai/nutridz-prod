import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import { ALGERIAN_DISHES, AlgerianDish } from '../src/data/algerianDishes';

const REGIONS = ['Tous', 'National', 'Alger', 'Constantine', 'Oran', 'Kabylie', 'Sahara'] as const;
const CATEGORIES = [
  { key: 'all', label: 'Tout', icon: 'apps' as const },
  { key: 'plat', label: 'Plats', icon: 'restaurant' as const },
  { key: 'soupe', label: 'Soupes', icon: 'water' as const },
  { key: 'entree', label: 'Entrées', icon: 'cafe' as const },
  { key: 'streetfood', label: 'Street', icon: 'fast-food' as const },
  { key: 'dessert', label: 'Desserts', icon: 'ice-cream' as const },
  { key: 'pain', label: 'Pains', icon: 'pizza' as const },
];

export default function AlgerianDishesScreen() {
  const router = useRouter();
  const [region, setRegion] = useState<string>('Tous');
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<AlgerianDish | null>(null);

  const filtered = useMemo(() => {
    return ALGERIAN_DISHES.filter((d) => {
      if (region !== 'Tous' && d.region !== region) return false;
      if (category !== 'all' && d.category !== category) return false;
      return true;
    });
  }, [region, category]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Cuisine algérienne</Text>
          <Text style={styles.subtitle}>{filtered.length} plats traditionnels</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Region filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {REGIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.regionPill, region === r && styles.regionPillActive]}
              onPress={() => setRegion(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.regionText, region === r && styles.regionTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIES.map((c) => {
            const isActive = category === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setCategory(c.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={c.icon} size={14} color={isActive ? '#FFF' : Colors.textSecondary} />
                <Text style={[styles.catText, isActive && { color: '#FFF' }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Dishes grid */}
        <View style={styles.grid}>
          {filtered.map((dish) => (
            <TouchableOpacity
              key={dish.id}
              style={styles.dishCard}
              onPress={() => setSelected(dish)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
              <View style={styles.dishOverlay}>
                <View style={styles.regionBadge}>
                  <Text style={styles.regionBadgeText}>{dish.region}</Text>
                </View>
              </View>
              <View style={styles.dishInfo}>
                <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                <Text style={styles.dishNameAr}>{dish.nameAr}</Text>
                <View style={styles.dishMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="flame" size={11} color={Colors.macros.calories} />
                    <Text style={styles.metaText}>{dish.caloriesPer100g} kcal</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun plat dans cette catégorie</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelected(null)} />
          {selected && (
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selected.imageUrl }} style={styles.modalImage} />
                <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{selected.name}</Text>
                      <Text style={styles.modalNameAr}>{selected.nameAr}</Text>
                    </View>
                    <View style={styles.modalRegionBadge}>
                      <Ionicons name="location" size={12} color={Colors.warning} />
                      <Text style={styles.modalRegionText}>{selected.region}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription}>{selected.description}</Text>

                  {/* Nutrition stats */}
                  <Text style={styles.sectionTitle}>Valeurs nutritionnelles (100g)</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={[styles.nutItem, { backgroundColor: Colors.macros.calories + '15' }]}>
                      <Text style={[styles.nutValue, { color: Colors.macros.calories }]}>{selected.caloriesPer100g}</Text>
                      <Text style={styles.nutLabel}>Kcal</Text>
                    </View>
                    <View style={[styles.nutItem, { backgroundColor: Colors.macros.proteines + '15' }]}>
                      <Text style={[styles.nutValue, { color: Colors.macros.proteines }]}>{selected.proteinPer100g}g</Text>
                      <Text style={styles.nutLabel}>Protéines</Text>
                    </View>
                    <View style={[styles.nutItem, { backgroundColor: Colors.macros.glucides + '15' }]}>
                      <Text style={[styles.nutValue, { color: Colors.macros.glucides }]}>{selected.carbsPer100g}g</Text>
                      <Text style={styles.nutLabel}>Glucides</Text>
                    </View>
                    <View style={[styles.nutItem, { backgroundColor: Colors.macros.lipides + '15' }]}>
                      <Text style={[styles.nutValue, { color: Colors.macros.lipides }]}>{selected.fatPer100g}g</Text>
                      <Text style={styles.nutLabel}>Lipides</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Histoire & culture</Text>
                  <Text style={styles.modalText}>{selected.history}</Text>

                  {selected.variations && selected.variations.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Variations régionales</Text>
                      {selected.variations.map((v, i) => (
                        <View key={i} style={styles.variationRow}>
                          <View style={styles.variationDot} />
                          <Text style={styles.variationText}>{v}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {selected.occasion && (
                    <View style={styles.occasionCard}>
                      <Ionicons name="calendar" size={16} color={Colors.warning} />
                      <Text style={styles.occasionText}>Occasion: {selected.occasion}</Text>
                    </View>
                  )}

                  <View style={{ height: 40 }} />
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  subtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  scrollContent: { paddingBottom: 40 },
  filterRow: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    gap: 8,
  },
  regionPill: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  regionPillActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  regionText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  regionTextActive: { color: '#FFF' },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  dishCard: {
    width: '48.5%',
    ...Theme.darkCard,
    padding: 0,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: 130,
  },
  dishOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  regionBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  regionBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  dishInfo: { padding: Theme.spacing.md },
  dishName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  dishNameAr: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dishMeta: { flexDirection: 'row', marginTop: 6, gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  empty: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    gap: 8,
  },
  emptyText: { color: Colors.textMuted },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '90%',
    overflow: 'hidden',
  },
  modalImage: { width: '100%', height: 240 },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalContent: { padding: Theme.spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  modalNameAr: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalRegionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modalRegionText: { color: Colors.warning, fontSize: 11, fontWeight: '700' },
  modalDescription: {
    color: Colors.text,
    fontSize: Theme.fontSize.sm,
    lineHeight: 22,
    marginTop: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  nutItem: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  nutValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '800',
  },
  nutLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalText: {
    color: Colors.text,
    fontSize: Theme.fontSize.sm,
    lineHeight: 22,
  },
  variationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  variationDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  variationText: {
    color: Colors.text,
    fontSize: Theme.fontSize.sm,
    flex: 1,
  },
  occasionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.lg,
  },
  occasionText: {
    color: Colors.text,
    fontSize: Theme.fontSize.sm,
    fontWeight: '600',
  },
});
