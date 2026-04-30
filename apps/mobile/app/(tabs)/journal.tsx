import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import { useJournalDaily, useJournalSummary, useAddJournalEntry, useDeleteJournalEntry } from '../../src/hooks/useJournal';
import { useFoodSearch } from '../../src/hooks/useFoods';
import AddFoodModal from '../../src/components/ui/AddFoodModal';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
const MEAL_KEY: Record<string, string> = {
  BREAKFAST: 'journal.breakfast',
  LUNCH: 'journal.lunch',
  DINNER: 'journal.dinner',
  SNACK: 'journal.snack',
};

const MEAL_ICONS: Record<string, string> = {
  BREAKFAST: 'sunny-outline',
  LUNCH: 'restaurant-outline',
  DINNER: 'moon-outline',
  SNACK: 'cafe-outline',
};

const MEAL_COLORS: Record<string, string> = {
  BREAKFAST: Colors.meals.petit_dejeuner,
  LUNCH: Colors.meals.dejeuner,
  DINNER: Colors.meals.diner,
  SNACK: Colors.meals.collation,
};

export default function JournalScreen() {
  const { t } = useTranslation();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // selectedDate is the absolute date the user is viewing
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Build a 7-day window centered on selectedDate (or shifted if too far in future)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - 3 + i);
    return d;
  });
  const selectedDay = 3;

  const dateStr = selectedDate.toISOString().split('T')[0];

  const shiftWeek = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const isToday = selectedDate.toDateString() === today.toDateString();
  const isFuture = selectedDate > today;

  const dailyQ = useJournalDaily(dateStr);
  const summaryQ = useJournalSummary(dateStr);
  const { data: dailyData, isLoading: entriesLoading, refetch: refetchDaily } = dailyQ;
  const { data: summary, refetch: refetchSummary } = summaryQ;
  const addEntry = useAddJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  // Refetch on focus so entries added from camera/barcode appear immediately
  useFocusEffect(
    useCallback(() => {
      refetchDaily();
      refetchSummary();
    }, [dateStr])
  );

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<string>('LUNCH');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useFoodSearch(searchQuery);

  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const openAddFood = (mealType: string) => {
    setActiveMealType(mealType);
    setSearchQuery('');
    setShowSearchModal(true);
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setShowSearchModal(false);
    setShowAddModal(true);
  };

  const handleConfirmAdd = (data: { foodId: number; quantityGrams: number; mealType: string }) => {
    addEntry.mutate(
      { ...data, logSource: 'MANUAL_SEARCH', date: dateStr },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setSelectedFood(null);
        },
        onError: () => Alert.alert(t('common.error'), t('common.error')),
      }
    );
  };

  const handleDeleteEntry = (id: number) => {
    Alert.alert(
      t('common.delete'),
      t('journal.deleteEntry'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteEntry.mutate(id),
        },
      ]
    );
  };

  const meals: Record<string, any[]> = dailyData?.meals || {};

  const calories = summary?.calories || 0;
  const protein = summary?.protein || 0;
  const carbs = summary?.carbs || 0;
  const fat = summary?.fat || 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('journal.title')}</Text>
            <Text style={styles.date}>
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {!isToday && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => setSelectedDate(today)}
              activeOpacity={0.7}
            >
              <Ionicons name="today" size={14} color={Colors.primary} />
              <Text style={styles.todayBtnText}>{t('common.today')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => shiftWeek(-7)}
            style={styles.navArrow}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePickerContent}
            style={{ flex: 1 }}
          >
            {weekDays.map((day, i) => {
              const dayIsToday = day.toDateString() === today.toDateString();
              const dayIsSelected = day.toDateString() === selectedDate.toDateString();
              const dayIsFuture = day > today;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayPill,
                    dayIsSelected && styles.dayPillActive,
                    dayIsToday && !dayIsSelected && styles.todayBorder,
                    dayIsFuture && styles.futureDay,
                  ]}
                  onPress={() => !dayIsFuture && setSelectedDate(day)}
                  disabled={dayIsFuture}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayName, dayIsSelected && styles.dayTextActive]}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}
                  </Text>
                  <Text style={[styles.dayNumber, dayIsSelected && styles.dayTextActive]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => shiftWeek(7)}
            style={[styles.navArrow, isFuture && { opacity: 0.3 }]}
            activeOpacity={0.7}
            disabled={isFuture}
          >
            <Ionicons name="chevron-forward" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.calories }]}>{Math.round(calories)}</Text>
              <Text style={styles.summaryLabel}>{t('journal.calories')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.proteines }]}>{Math.round(protein)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.proteins')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.glucides }]}>{Math.round(carbs)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.carbs')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.macros.lipides }]}>{Math.round(fat)}g</Text>
              <Text style={styles.summaryLabel}>{t('journal.fats')}</Text>
            </View>
          </View>
        </View>

        {/* Meal Sections */}
        {entriesLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          MEAL_TYPES.map((mealType) => {
            const entries = meals[mealType] || [];
            const mealCalories = entries.reduce((sum: number, e: any) => sum + (e.caloriesConsumed || 0), 0);
            return (
              <View key={mealType} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <View style={[styles.mealIconBg, { backgroundColor: MEAL_COLORS[mealType] + '25' }]}>
                    <Ionicons name={MEAL_ICONS[mealType] as any} size={18} color={MEAL_COLORS[mealType]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle}>{t(MEAL_KEY[mealType])}</Text>
                    <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: MEAL_COLORS[mealType] + '20' }]}
                    onPress={() => openAddFood(mealType)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={22} color={MEAL_COLORS[mealType]} />
                  </TouchableOpacity>
                </View>

                {entries.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyMeal}
                    onPress={() => openAddFood(mealType)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyText}>{t('journal.addFood')}</Text>
                  </TouchableOpacity>
                ) : (
                  entries.map((entry: any) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.entryRow}
                      onLongPress={() => handleDeleteEntry(entry.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryName} numberOfLines={1}>
                          {entry.foodName || entry.recipeName || 'Aliment'}
                        </Text>
                        <Text style={styles.entryDetail}>
                          {entry.quantityGrams}g · {Math.round(entry.proteinConsumed || 0)}P · {Math.round(entry.carbsConsumed || 0)}G · {Math.round(entry.fatConsumed || 0)}L
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Food Search Modal — fixed keyboard handling */}
      <Modal visible={showSearchModal} animationType="slide" transparent onRequestClose={() => setShowSearchModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('journal.addToMeal', { meal: t(MEAL_KEY[activeMealType]) })}</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('journal.searchFood')}
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingHorizontal: 12 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

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
                  onPress={() => handleSelectFood(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.searchResultMeta}>
                      {item.caloriesPer100g || 0} kcal · {item.proteinPer100g || 0}P · {item.carbsPer100g || 0}G · {item.fatPer100g || 0}L /100g
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 2 && !searching ? (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={32} color={Colors.textMuted} />
                    <Text style={styles.noResults}>{t('journal.noFoodFound')}</Text>
                  </View>
                ) : searchQuery.length < 2 ? (
                  <Text style={styles.searchHint}>{t('journal.typeMin')}</Text>
                ) : null
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Food Modal with quantity/serving picker */}
      <AddFoodModal
        visible={showAddModal}
        food={selectedFood}
        defaultMealType={activeMealType}
        showMealPicker={false}
        onClose={() => { setShowAddModal(false); setSelectedFood(null); }}
        onConfirm={handleConfirmAdd}
        loading={addEntry.isPending}
      />
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
  date: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: Theme.spacing.xs, textTransform: 'capitalize' },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  todayBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.lg,
  },
  navArrow: {
    width: 32, height: 56, borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  futureDay: { opacity: 0.3 },
  datePickerContent: { gap: Theme.spacing.sm, paddingHorizontal: 4 },
  dayPill: {
    width: 52,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  todayBorder: { borderColor: Colors.primary },
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
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  mealIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  mealCalories: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMeal: {
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  emptyText: { color: Colors.textMuted, fontSize: Theme.fontSize.sm },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  entryInfo: { flex: 1, marginRight: Theme.spacing.sm },
  entryName: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  entryDetail: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  entryCal: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.macros.calories,
  },
  // Search modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 8,
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  searchList: {
    flex: 1,
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
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxxl,
    gap: Theme.spacing.md,
  },
  noResults: {
    color: Colors.textMuted,
    fontSize: Theme.fontSize.md,
  },
  searchHint: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xl,
  },
});
