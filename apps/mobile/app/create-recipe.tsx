import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import { useCreateRecipe } from '../src/hooks/useCommunity';

const CATEGORIES = [
  { key: 'ALGERIAN', label: 'Algérien', icon: 'flag-outline' as const },
  { key: 'HEALTHY', label: 'Sain', icon: 'leaf-outline' as const },
  { key: 'WEIGHT_LOSS', label: 'Minceur', icon: 'fitness-outline' as const },
  { key: 'MUSCLE_GAIN', label: 'Muscle', icon: 'barbell-outline' as const },
  { key: 'OTHER', label: 'Autre', icon: 'ellipsis-horizontal-outline' as const },
];

export default function CreateRecipeScreen() {
  const router = useRouter();
  const create = useCreateRecipe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('2');
  const [category, setCategory] = useState('ALGERIAN');
  const [isAlgerian, setIsAlgerian] = useState(true);
  const [steps, setSteps] = useState<string[]>(['']);

  const addStep = () => setSteps((s) => [...s, '']);
  const updateStep = (i: number, v: string) => setSteps((s) => s.map((x, idx) => idx === i ? v : x));
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!title.trim() || title.length < 3) {
      Alert.alert('Titre requis', 'Donne un titre à ta recette (min. 3 caractères)');
      return;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Description courte', 'Décris ta recette (min. 10 caractères)');
      return;
    }
    const filledSteps = steps.filter((s) => s.trim().length > 0);
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        prepTimeMinutes: parseInt(prepTime) || undefined,
        servings: parseInt(servings) || 2,
        category,
        isAlgerian,
        isPublic: true,
        ingredients: [],
        steps: filledSteps.map((s, i) => ({ stepNumber: i + 1, description: s.trim() })),
      },
      {
        onSuccess: () => {
          Alert.alert('Publié !', 'Ta recette est en ligne. Merci de partager !', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de publier');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Nouvelle recette</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex. Couscous traditionnel de ma grand-mère"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Raconte l'histoire de ta recette, ses bienfaits, conseils..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Image URL */}
          <Text style={styles.label}>URL de l'image (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={Colors.textMuted}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Two-col row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Temps (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={Colors.textMuted}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Portions</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                placeholderTextColor={Colors.textMuted}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Category */}
          <Text style={styles.label}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Theme.spacing.sm, paddingRight: Theme.spacing.lg }}>
            {CATEGORIES.map((c) => {
              const isActive = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, isActive && styles.catChipActive]}
                  onPress={() => setCategory(c.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={c.icon} size={16} color={isActive ? '#FFF' : Colors.textSecondary} />
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Algerian toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsAlgerian(!isAlgerian)}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleBox, isAlgerian && styles.toggleBoxActive]}>
              {isAlgerian && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.toggleLabel}>Recette algérienne traditionnelle</Text>
          </TouchableOpacity>

          {/* Steps */}
          <Text style={styles.label}>Étapes de préparation</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={`Étape ${i + 1}`}
                placeholderTextColor={Colors.textMuted}
                value={s}
                onChangeText={(v) => updateStep(i, v)}
                multiline
              />
              {steps.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeStep(i)}
                  style={styles.removeStepBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addStepBtn} onPress={addStep} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addStepText}>Ajouter une étape</Text>
          </TouchableOpacity>

          {/* Community rules notice */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={styles.noticeText}>
              Ta recette sera visible publiquement. Évite les contenus offensants. Les recettes signalées 3 fois sont automatiquement masquées.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, create.isPending && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={create.isPending}
            activeOpacity={0.85}
          >
            {create.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFF" />
                <Text style={styles.submitText}>Publier la recette</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  title: { fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.md,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: Theme.spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  catTextActive: { color: '#FFF' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  toggleBox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBoxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleLabel: { color: Colors.text, fontSize: Theme.fontSize.sm },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  stepNumberCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  stepNumberText: {
    color: Colors.primary,
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  removeStepBtn: {
    paddingTop: 12,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  addStepText: { color: Colors.primary, fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.sm },
  noticeCard: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    backgroundColor: Colors.info + '15',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginVertical: Theme.spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.md,
    ...Theme.glow.subtle,
  },
  submitText: { color: '#FFF', fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.md },
});
