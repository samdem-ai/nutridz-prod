import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import api from '../src/services/api';
import Markdown from '../src/components/ui/Markdown';

const DAY_OPTIONS = [
  { days: 3, label: '3 jours' },
  { days: 5, label: '5 jours' },
  { days: 7, label: '7 jours' },
];

export default function MealPlanScreen() {
  const router = useRouter();
  const [days, setDays] = useState(3);
  const [preferAlgerian, setPreferAlgerian] = useState(true);
  const [vegetarian, setVegetarian] = useState(false);
  const [lowCarb, setLowCarb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const { data } = await api.post('/meal-plans/generate', {
        days,
        preferAlgerian,
        vegetarian,
        lowCarb,
      }, { timeout: 120000 });
      setPlan(data.plan || data.text || JSON.stringify(data, null, 2));
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de générer le plan');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="calendar" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Plan personnalisé</Text>
          <Text style={styles.heroSub}>Génère un plan alimentaire adapté à ton profil et tes préférences. L'IA prend en compte tes objectifs caloriques, allergies et restrictions.</Text>
        </View>

        {/* Duration */}
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

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Préférences</Text>
        <View style={styles.toggleList}>
          <PrefToggle
            icon="flag"
            label="Cuisine algérienne"
            sub="Prioriser plats traditionnels"
            value={preferAlgerian}
            onToggle={() => setPreferAlgerian(!preferAlgerian)}
            color={Colors.warning}
          />
          <PrefToggle
            icon="leaf"
            label="Végétarien"
            sub="Sans viande ni poisson"
            value={vegetarian}
            onToggle={() => setVegetarian(!vegetarian)}
            color={Colors.primary}
          />
          <PrefToggle
            icon="fitness"
            label="Faible en glucides"
            sub="Idéal perte de poids"
            value={lowCarb}
            onToggle={() => setLowCarb(!lowCarb)}
            color={Colors.info}
          />
        </View>

        {/* Generate button */}
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

        {/* Plan output */}
        {plan && (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Ionicons name="restaurant" size={18} color={Colors.primary} />
              <Text style={styles.planTitle}>Ton plan {days} jours</Text>
            </View>
            <Markdown text={plan} />
          </View>
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
  heroTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  heroSub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  daysRow: { flexDirection: 'row', gap: Theme.spacing.sm },
  dayCard: {
    flex: 1,
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  dayCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  dayLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: -2,
  },
  toggleList: {
    ...Theme.darkCard,
    gap: 0,
    paddingVertical: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  toggleIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  switch: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: Colors.surfaceLight,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.text,
  },
  switchThumbActive: {
    transform: [{ translateX: 18 }],
    backgroundColor: '#FFF',
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: 999,
    marginTop: Theme.spacing.lg,
    ...Theme.glow.subtle,
  },
  genText: { color: '#FFF', fontWeight: '700', fontSize: Theme.fontSize.md },
  planCard: {
    ...Theme.darkCard,
    marginTop: Theme.spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  planTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  loadingHint: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Colors.info + '15',
    borderRadius: Theme.borderRadius.md,
  },
  loadingHintText: {
    color: Colors.text,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
