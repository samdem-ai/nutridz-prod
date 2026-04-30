import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useJournalDaily, useJournalSummary, useAddJournalEntry, useDeleteJournalEntry } from '../../src/hooks/useJournal';
import { useFoodSearch } from '../../src/hooks/useFoods';

// Java MealType enum keys
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
type MealType = typeof MEAL_TYPES[number];
const MEAL_KEYS: Record<MealType, string> = {
  BREAKFAST: 'journal.breakfast',
  LUNCH: 'journal.lunch',
  DINNER: 'journal.dinner',
  SNACK: 'journal.snack',
};

const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: 'sunny-outline',
  LUNCH: 'restaurant-outline',
  DINNER: 'moon-outline',
  SNACK: 'cafe-outline',
};

export default function JournalScreen() {
  const { t } = useTranslation();

  // Date handling
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(3);

  const selectedDate = weekDays[selectedDay];
  const dateStr = selectedDate.toISOString().split('T')[0];

  // Data hooks
  const { data: dailyEntries, isLoading: entriesLoading } = useJournalDaily(dateStr);
  const { data: summary } = useJournalSummary(dateStr);
  const addEntry = useAddJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  // Food search modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('LUNCH');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useFoodSearch(searchQuery);

  // Track keyboard height — Expo Go's softInputMode is "pan" so manual lift needed.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const openAddFood = (mealType: MealType) => {
    setActiveMealType(mealType);
    setSearchQuery('');
    setShowSearchModal(true);
  };

  const handleAddFood = (food: any) => {
    addEntry.mutate(
      { foodId: food.id, quantityGrams: 100, mealType: activeMealType, date: dateStr },
      {
        onSuccess: () => {
          setShowSearchModal(false);
          setSearchQuery('');
        },
        onError: () => Alert.alert(t('common.error'), 'Failed to add food'),
      }
    );
  };

  const handleDeleteEntry = (id: number) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette entree ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteEntry.mutate(id),
        },
      ]
    );
  };

  // Java response: dailyEntries.meals is { BREAKFAST: [...], LUNCH: [...], DINNER: [...], SNACK: [...] }
  const entriesByMeal: Record<MealType, any[]> = {
    BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [],
  };
  if (dailyEntries?.meals) {
    (Object.entries(dailyEntries.meals) as [MealType, any[]][]).forEach(([meal, entries]) => {
      if (entriesByMeal[meal]) entriesByMeal[meal] = entries ?? [];
    });
  }

  const calories = dailyEntries?.totalCalories ?? summary?.calories ?? 0;
  const proteines = dailyEntries?.totalProtein ?? summary?.protein_g ?? 0;
  const glucides = dailyEntries?.totalCarbs ?? summary?.carbs_g ?? 0;
  const lipides = dailyEntries?.totalFat ?? summary?.fat_g ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('journal.title')}</Text>
          <Text style={styles.date}>
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* Date pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker} contentContainerStyle={styles.datePickerContent}>
          {weekDays.map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayPill, selectedDay === i && styles.dayPillActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayName, selectedDay === i && styles.dayTextActive]}>
                {day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}
              </Text>
              <Text style={[styles.dayNumber, selectedDay === i && styles.dayTextActive]}>
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.calories }]}>{Math.round(calories)}</Text>
              <Text style={styles.summaryLabel}>{t('journal.calories')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.proteines }]}>{Math.round(proteines)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.proteins')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.glucides }]}>{Math.round(glucides)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.carbs')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.lipides }]}>{Math.round(lipides)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.fats')}</Text>
            </View>
          </View>
        </View>

        {/* Meal Sections */}
        {entriesLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          MEAL_TYPES.map((mealType) => {
            const entries = entriesByMeal[mealType] || [];
            return (
              <View key={mealType} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <View style={[styles.mealAccent, { backgroundColor: Colors.meals[mealType] }]} />
                  <Ionicons name={MEAL_ICONS[mealType] as any} size={18} color={Colors.meals[mealType]} />
                  <Text style={styles.mealTitle}>{t(MEAL_KEYS[mealType])}</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => openAddFood(mealType)}>
                    <Ionicons name="add" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {entries.length === 0 ? (
                  <View style={styles.emptyMeal}>
                    <Text style={styles.emptyText}>{t('journal.addFood')}</Text>
                  </View>
                ) : (
                  entries.map((entry: any) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.entryRow}
                      onLongPress={() => handleDeleteEntry(entry.id)}
                    >
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryName} numberOfLines={1}>
                          {entry.foodName || entry.recipeName || 'Aliment'}
                        </Text>
                        <Text style={styles.entryDetail}>
                          {entry.quantityGrams}g
                        </Text>
                      </View>
                      <Text style={styles.entryCal}>
                        {Math.round(entry.caloriesConsumed || 0)} kcal
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            );
          })
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Food Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: Colors.overlay }}
            activeOpacity={1}
            onPress={() => { setShowSearchModal(false); Keyboard.dismiss(); }}
          />
          <View style={[styles.modalContent, { maxHeight: undefined, flexShrink: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un aliment</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un aliment..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            {searching && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
            )}

            <FlatList
              data={Array.isArray(searchResults) ? searchResults : []}
              keyExtractor={(item: any) => String(item.id)}
              style={styles.searchList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleAddFood(item)}
                  disabled={addEntry.isPending}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.searchResultMeta}>
                      {item.caloriesPer100g || 0} kcal / 100g
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 2 && !searching ? (
                  <Text style={styles.noResults}>Aucun resultat</Text>
                ) : null
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  header: { paddingTop: 60, marginBottom: Theme.spacing.lg },
  title: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  date: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: Theme.spacing.xs },
  datePicker: { marginBottom: Theme.spacing.lg },
  datePickerContent: { gap: Theme.spacing.sm },
  dayPill: {
    width: 48,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayName: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  dayNumber: { fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  dayTextActive: { color: '#FFFFFF' },
  summaryCard: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryDivider: { width: 1, height: 30, backgroundColor: Colors.divider },
  summaryValue: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold },
  summaryLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  mealSection: {
    ...Theme.darkCard,
    marginBottom: Theme.spacing.md,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  mealAccent: {
    position: 'absolute',
    left: 0,
    top: -Theme.spacing.lg,
    bottom: -Theme.spacing.lg,
    width: 3,
    borderRadius: 2,
  },
  mealTitle: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.lg,
  },
  emptyMeal: {
    padding: Theme.spacing.lg,
    paddingLeft: Theme.spacing.lg + Theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textMuted, fontSize: Theme.fontSize.sm },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingLeft: Theme.spacing.lg + Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  entryInfo: { flex: 1, marginRight: Theme.spacing.sm },
  entryName: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text,
  },
  entryDetail: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  entryCal: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.macros.calories,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    maxHeight: '80%',
    padding: Theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  searchInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  searchList: {
    maxHeight: 400,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  searchResultInfo: { flex: 1, marginRight: Theme.spacing.sm },
  searchResultName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text,
  },
  searchResultMeta: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Theme.fontSize.md,
    marginTop: Theme.spacing.xl,
  },
});
