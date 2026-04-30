import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import NutriScoreBadge from './NutriScoreBadge';

const MEAL_OPTIONS = [
  { key: 'BREAKFAST', label: 'Petit-dej', icon: 'sunny-outline' as const, color: Colors.meals.petit_dejeuner },
  { key: 'LUNCH', label: 'Dejeuner', icon: 'restaurant-outline' as const, color: Colors.meals.dejeuner },
  { key: 'DINNER', label: 'Diner', icon: 'moon-outline' as const, color: Colors.meals.diner },
  { key: 'SNACK', label: 'Collation', icon: 'cafe-outline' as const, color: Colors.meals.collation },
];

type ServingSize = { id: number; label: string; grams: number };

type Food = {
  id: number;
  name: string;
  nameAr?: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  nutritionalScore?: string;
  servingSizes?: ServingSize[];
};

type Props = {
  visible: boolean;
  food: Food | null;
  defaultMealType?: string;
  defaultPortion?: number;
  showMealPicker?: boolean;
  onClose: () => void;
  onConfirm: (data: { foodId: number; quantityGrams: number; mealType: string }) => void;
  loading?: boolean;
};

export default function AddFoodModal({
  visible,
  food,
  defaultMealType = 'LUNCH',
  defaultPortion = 100,
  showMealPicker = true,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  const [quantity, setQuantity] = useState('100');
  const [multiplier, setMultiplier] = useState(1);
  const [selectedServing, setSelectedServing] = useState<ServingSize | null>(null);
  const [mealType, setMealType] = useState(defaultMealType);
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setQuantity(String(defaultPortion));
      setMultiplier(1);
      setSelectedServing(null);
      setMealType(defaultMealType);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, defaultPortion, defaultMealType]);

  if (!food) return null;

  const baseGrams = selectedServing ? selectedServing.grams : parseFloat(quantity) || 0;
  const totalGrams = baseGrams * multiplier;
  const factor = totalGrams / 100;
  const calories = Math.round((food.caloriesPer100g || 0) * factor);
  const protein = Math.round((food.proteinPer100g || 0) * factor * 10) / 10;
  const carbs = Math.round((food.carbsPer100g || 0) * factor * 10) / 10;
  const fat = Math.round((food.fatPer100g || 0) * factor * 10) / 10;

  const servings: ServingSize[] = [
    { id: -1, label: '100g', grams: 100 },
    { id: -2, label: 'Petite (50g)', grams: 50 },
    { id: -3, label: 'Moyenne (150g)', grams: 150 },
    { id: -4, label: 'Grande (250g)', grams: 250 },
    ...(food.servingSizes || []),
  ];

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  const handleConfirm = () => {
    if (totalGrams <= 0) return;
    onConfirm({ foodId: food.id, quantityGrams: totalGrams, mealType });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                {food.nameAr && <Text style={styles.foodNameAr}>{food.nameAr}</Text>}
              </View>
              {food.nutritionalScore && <NutriScoreBadge score={food.nutritionalScore as any} size="md" />}
            </View>

            {/* Live nutrition card */}
            <View style={styles.nutritionCard}>
              <View style={styles.calorieRow}>
                <Ionicons name="flame" size={22} color={Colors.macros.calories} />
                <Text style={styles.calorieValue}>{calories}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
              <View style={styles.macrosRow}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.macros.proteines }]} />
                  <Text style={styles.macroValue}>{protein}g</Text>
                  <Text style={styles.macroLabel}>Proteines</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.macros.glucides }]} />
                  <Text style={styles.macroValue}>{carbs}g</Text>
                  <Text style={styles.macroLabel}>Glucides</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.macros.lipides }]} />
                  <Text style={styles.macroValue}>{fat}g</Text>
                  <Text style={styles.macroLabel}>Lipides</Text>
                </View>
              </View>
            </View>

            {/* Serving size pills */}
            <Text style={styles.sectionLabel}>Portion</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servingScroll}>
              {servings.map((s) => {
                const isSelected = selectedServing?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.servingPill, isSelected && styles.servingPillActive]}
                    onPress={() => {
                      setSelectedServing(s);
                      setQuantity(String(s.grams));
                      setMultiplier(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.servingText, isSelected && styles.servingTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom quantity */}
            <View style={styles.quantitySection}>
              <View style={styles.quantityField}>
                <Text style={styles.quantityFieldLabel}>Quantite (g)</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={(v) => {
                    setQuantity(v);
                    setSelectedServing(null);
                  }}
                  placeholder="100"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.multiplierField}>
                <Text style={styles.quantityFieldLabel}>x</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setMultiplier((m) => Math.max(0.5, m - 0.5))}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.multiplierValue}>{multiplier}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setMultiplier((m) => m + 0.5)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total: </Text>
              <Text style={styles.totalValue}>{totalGrams.toFixed(0)}g</Text>
            </Text>

            {/* Meal type picker */}
            {showMealPicker && (
              <>
                <Text style={styles.sectionLabel}>Repas</Text>
                <View style={styles.mealGrid}>
                  {MEAL_OPTIONS.map((m) => {
                    const isSelected = mealType === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.mealCard, isSelected && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                        onPress={() => setMealType(m.key)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.mealIconBg, { backgroundColor: m.color + (isSelected ? '40' : '15') }]}>
                          <Ionicons name={m.icon} size={20} color={m.color} />
                        </View>
                        <Text style={[styles.mealLabel, isSelected && { color: m.color, fontWeight: Theme.fontWeight.bold }]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || totalGrams <= 0) && styles.submitDisabled]}
              onPress={handleConfirm}
              disabled={loading || totalGrams <= 0}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                  <Text style={styles.submitText}>Ajouter au journal</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 8,
  },
  handle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    alignSelf: 'center',
    marginBottom: 8,
  },
  content: { paddingHorizontal: Theme.spacing.xl, paddingBottom: Theme.spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  foodName: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  foodNameAr: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  nutritionCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  calorieUnit: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroItem: { alignItems: 'center', flex: 1 },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  macroLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servingScroll: { gap: Theme.spacing.sm, paddingRight: Theme.spacing.lg },
  servingPill: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  servingPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  servingText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  servingTextActive: { color: '#FFF' },
  quantitySection: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  quantityField: { flex: 2 },
  multiplierField: { flex: 1 },
  quantityFieldLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  quantityInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    height: 49,
  },
  stepBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  totalRow: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  totalLabel: { color: Colors.textMuted },
  totalValue: { color: Colors.primary, fontWeight: Theme.fontWeight.bold },
  mealGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  mealCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  mealIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mealLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text,
    fontWeight: Theme.fontWeight.medium,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.lg,
    ...Theme.glow.subtle,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#FFF', fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold },
});
