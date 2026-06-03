import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import api from '../src/services/api';

const DAY_OPTIONS = [
  { days: 3, label: '3 jours' },
  { days: 5, label: '5 jours' },
  { days: 7, label: '7 jours' },
];

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

const MEAL_META: Record<MealType, { label: string; icon: any; color: string }> = {
  BREAKFAST: { label: 'Petit-déjeuner', icon: 'sunny',     color: Colors.warning },
  LUNCH:     { label: 'Déjeuner',       icon: 'restaurant',color: Colors.primary },
  DINNER:    { label: 'Dîner',          icon: 'moon',      color: Colors.info },
  SNACK:     { label: 'Collation',      icon: 'cafe',      color: Colors.textSecondary },
};

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

type PlanItem = {
  id: number;
  recipeId?: number | null;
  recipeName?: string | null;
  foodId?: number | null;
  foodName?: string | null;
  quantityGrams?: number | null;
  calories?: number | null;
  isAlgerian?: boolean;
};

type DayPlan = {
  date: string;
  totalCalories?: number | null;
  totalProtein?: number | null;
  totalCarbs?: number | null;
  totalFat?: number | null;
  meals: Partial<Record<MealType, PlanItem[]>>;
};

type MealPlan = {
  id: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  days: DayPlan[];
  shoppingList: Array<{ id: number; foodId: number; foodName: string | null; quantityGrams: number; checked: boolean }>;
};

export default function MealPlanScreen() {
  const router = useRouter();
  const [days, setDays] = useState(3);
  const [preferAlgerian, setPreferAlgerian] = useState(true);
  const [vegetarian, setVegetarian] = useState(false);
  const [lowCarb, setLowCarb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [addingDay, setAddingDay] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const { data } = await api.post<MealPlan>('/meal-plans/generate', {
        days, preferAlgerian, vegetarian, lowCarb,
      }, { timeout: 120000 });
      setPlan(data);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de générer le plan');
    } finally {
      setLoading(false);
    }
  };

  const addItemsToJournal = async (items: Array<{ item: PlanItem; mealType: MealType; date: string }>) => {
    let ok = 0, skipped = 0, failed = 0;
    for (const { item, mealType, date } of items) {
      if (!item.foodId && !item.recipeId) { skipped++; continue; }
      try {
        await api.post('/journal', {
          foodId: item.foodId ?? undefined,
          recipeId: item.recipeId ?? undefined,
          mealType,
          quantityGrams: item.quantityGrams ?? 100,
          logSource: 'MEAL_PLAN',
          date,
        });
        ok++;
      } catch {
        failed++;
      }
    }
    return { ok, skipped, failed };
  };

  const flattenDay = (day: DayPlan) =>
    MEAL_ORDER.flatMap((mt) => (day.meals?.[mt] ?? []).map((item) => ({ item, mealType: mt, date: day.date })));

  const handleAddDay = async (day: DayPlan) => {
    setAddingDay(day.date);
    const { ok, failed } = await addItemsToJournal(flattenDay(day));
    setAddingDay(null);
    Alert.alert(
      'Ajouté au journal',
      `${ok} entrée${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''} pour le ${formatDate(day.date)}${failed ? ` (${failed} échec${failed > 1 ? 's' : ''})` : ''}.`,
    );
  };

  const handleAddAll = async () => {
    if (!plan) return;
    setAddingAll(true);
    const all = plan.days.flatMap(flattenDay);
    const { ok, failed } = await addItemsToJournal(all);
    setAddingAll(false);
    Alert.alert(
      'Plan ajouté au journal',
      `${ok} entrée${ok > 1 ? 's' : ''} sur ${all.length} ajoutée${ok > 1 ? 's' : ''}${failed ? ` (${failed} échec${failed > 1 ? 's' : ''})` : ''}.`,
    );
  };

  const totalCalories = useMemo(
    () => plan?.days?.reduce((s, d) => s + (d.totalCalories ?? 0), 0) ?? 0,
    [plan],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Plan repas IA</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="calendar" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Plan personnalisé</Text>
          <Text style={styles.heroSub}>Génère un plan alimentaire adapté à ton profil et tes préférences. L'IA prend en compte tes objectifs caloriques, allergies et restrictions.</Text>
        </View>

        <Text style={styles.sectionLabel}>Durée</Text>
        <View style={styles.daysRow}>
          {DAY_OPTIONS.map((o) => {
            const isActive = days === o.days;
            return (
              <TouchableOpacity
                key={o.days}
                style={[styles.dayCard, isActive && styles.dayCardActive]}
                onPress={() => setDays(o.days)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayValue, isActive && { color: '#FFF' }]}>{o.days}</Text>
                <Text style={[styles.dayLabel, isActive && { color: '#FFF' }]}>jours</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Préférences</Text>
        <View style={styles.toggleList}>
          <PrefToggle icon="flag"    label="Cuisine algérienne" sub="Prioriser plats traditionnels" value={preferAlgerian} onToggle={() => setPreferAlgerian(!preferAlgerian)} color={Colors.warning} />
          <PrefToggle icon="leaf"    label="Végétarien"         sub="Sans viande ni poisson"         value={vegetarian}     onToggle={() => setVegetarian(!vegetarian)}         color={Colors.primary} />
          <PrefToggle icon="fitness" label="Faible en glucides" sub="Idéal perte de poids"           value={lowCarb}        onToggle={() => setLowCarb(!lowCarb)}                color={Colors.info} />
        </View>

        <TouchableOpacity
          style={[styles.genBtn, loading && { opacity: 0.5 }]}
          onPress={generate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.genText}>Génération en cours...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.genText}>{plan ? 'Régénérer' : 'Générer le plan'}</Text>
            </>
          )}
        </TouchableOpacity>

        {plan && (
          <>
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>Plan {plan.durationDays} jours</Text>
                <Text style={styles.summaryDates}>{formatDate(plan.startDate)} → {formatDate(plan.endDate)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryKcal}>{Math.round(totalCalories)}</Text>
                <Text style={styles.summaryKcalLabel}>kcal total</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addAllBtn, addingAll && { opacity: 0.5 }]}
              onPress={handleAddAll}
              disabled={addingAll}
              activeOpacity={0.85}
            >
              {addingAll ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="add-circle" size={20} color={Colors.primary} />}
              <Text style={styles.addAllText}>Ajouter tout le plan au journal</Text>
            </TouchableOpacity>

            {plan.days.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                onAdd={() => handleAddDay(day)}
                loading={addingDay === day.date}
              />
            ))}
          </>
        )}

        {loading && !plan && (
          <View style={styles.loadingHint}>
            <Text style={styles.loadingHintText}>L'IA prépare un plan adapté à ton profil. Cela peut prendre 30-60 secondes...</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function DayCard({ day, onAdd, loading }: { day: DayPlan; onAdd: () => void; loading: boolean }) {
  return (
    <View style={styles.dayPlanCard}>
      <View style={styles.dayPlanHeader}>
        <View>
          <Text style={styles.dayPlanDate}>{formatDate(day.date)}</Text>
          <Text style={styles.dayPlanMacros}>
            {Math.round(day.totalCalories ?? 0)} kcal · P {Math.round(day.totalProtein ?? 0)}g · G {Math.round(day.totalCarbs ?? 0)}g · L {Math.round(day.totalFat ?? 0)}g
          </Text>
        </View>
        <TouchableOpacity onPress={onAdd} disabled={loading} style={[styles.addDayBtn, loading && { opacity: 0.5 }]}>
          {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="add" size={18} color={Colors.primary} />}
        </TouchableOpacity>
      </View>

      {MEAL_ORDER.map((mt) => {
        const items = day.meals?.[mt] ?? [];
        if (items.length === 0) return null;
        const meta = MEAL_META[mt];
        return (
          <View key={mt} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={[styles.mealDot, { backgroundColor: meta.color + '25' }]}>
                <Ionicons name={meta.icon} size={14} color={meta.color} />
              </View>
              <Text style={styles.mealLabel}>{meta.label}</Text>
            </View>
            {items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.recipeName || it.foodName || 'Aliment'}
                  </Text>
                  <Text style={styles.itemSub}>
                    {it.quantityGrams ? `${Math.round(it.quantityGrams)} g · ` : ''}{Math.round(it.calories ?? 0)} kcal
                  </Text>
                </View>
                {it.isAlgerian && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>DZ</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function PrefToggle({ icon, label, sub, value, onToggle, color }: any) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <View style={[styles.switch, value && { backgroundColor: color }]}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
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
    marginBottom: Theme.spacing.lg,
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  heroTitle: { fontSize: Theme.fontSize.xl, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  sectionLabel: {
    fontSize: Theme.fontSize.xs, color: Colors.textMuted, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm,
  },
  daysRow: { flexDirection: 'row', gap: Theme.spacing.sm },
  dayCard: { flex: 1, ...Theme.darkCard, alignItems: 'center', paddingVertical: Theme.spacing.md, borderWidth: 2, borderColor: Colors.surfaceBorder },
  dayCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayValue: { fontSize: 28, fontWeight: '800', color: Colors.text },
  dayLabel: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: -2 },
  toggleList: { ...Theme.darkCard, gap: 0, paddingVertical: 0 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  toggleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.text },
  toggleSub: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.surfaceLight, padding: 2, justifyContent: 'center' },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.text },
  switchThumbActive: { transform: [{ translateX: 18 }], backgroundColor: '#FFF' },
  genBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: 999,
    marginTop: Theme.spacing.lg,
    ...Theme.glow.subtle,
  },
  genText: { color: '#FFF', fontWeight: '700', fontSize: Theme.fontSize.md },
  summaryCard: {
    ...Theme.darkCard,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  summaryLabel: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.text },
  summaryDates: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  summaryKcal: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  summaryKcalLabel: { fontSize: Theme.fontSize.xs, color: Colors.textMuted },
  addAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1, borderColor: Colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: 999,
    marginTop: Theme.spacing.md,
  },
  addAllText: { color: Colors.primary, fontWeight: '700', fontSize: Theme.fontSize.md },
  dayPlanCard: { ...Theme.darkCard, marginTop: Theme.spacing.md },
  dayPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
    marginBottom: Theme.spacing.sm,
  },
  dayPlanDate: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.text, textTransform: 'capitalize' },
  dayPlanMacros: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  addDayBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  mealSection: { marginTop: Theme.spacing.sm },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mealDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingLeft: 28, gap: 8,
  },
  itemName: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: Theme.fontSize.xs, color: Colors.textMuted, marginTop: 1 },
  tag: { backgroundColor: Colors.warning + '25', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '700', color: Colors.warning, letterSpacing: 0.5 },
  loadingHint: { marginTop: Theme.spacing.lg, padding: Theme.spacing.md, backgroundColor: Colors.info + '15', borderRadius: Theme.borderRadius.md },
  loadingHintText: { color: Colors.text, fontSize: Theme.fontSize.sm, lineHeight: 20, textAlign: 'center' },
});
