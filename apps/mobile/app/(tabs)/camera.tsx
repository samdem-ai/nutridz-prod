import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import NutriScoreBadge from '../../src/components/ui/NutriScoreBadge';
import api from '../../src/services/api';
import { useAddJournalEntry } from '../../src/hooks/useJournal';

const today = new Date().toISOString().split('T')[0];

export default function CameraScreen() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  // Java has no /foods/identify (structured candidates). It exposes
  // /ai/analyze-image which returns a French analysis paragraph only.
  // Until backend adds structured identify, show the analysis text instead.
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'photo' | 'barcode'>('photo');
  const addEntry = useAddJournalEntry();

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error'), 'Camera permission required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      identifyFood(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      identifyFood(result.assets[0].uri);
    }
  };

  const identifyFood = async (uri: string) => {
    setLoading(true);
    setAnalysisText(null);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'food.jpg' } as any);
      // Java endpoint: POST /ai/analyze-image  multipart  -> { analysis: string }
      const { data } = await api.post('/ai/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisText(data.analysis ?? null);
    } catch {
      Alert.alert(t('common.error'), 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToJournal = (food: any) => {
    addEntry.mutate(
      {
        foodId: food.id,
        quantityGrams: 100,
        mealType: 'LUNCH',
        date: today,
        logSource: 'AI_PHOTO',
      },
      {
        onSuccess: () => {
          Alert.alert('OK', `${food.name} ajoute au journal`);
        },
        onError: () => {
          Alert.alert(t('common.error'), 'Impossible d\'ajouter au journal');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Preview area */}
      <View style={styles.previewArea}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Ionicons name={mode === 'photo' ? 'camera' : 'barcode'} size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.placeholderText}>
              {mode === 'photo' ? t('camera.takePhoto') : t('camera.scanBarcode')}
            </Text>
          </View>
        )}
      </View>

      {/* Results */}
      {loading && (
        <View style={styles.analyzingBar}>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.analyzingText}>{t('camera.analyzing')}</Text>
        </View>
      )}

      {analysisText && (
        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
          <Text style={styles.resultsTitle}>{t('camera.results')}</Text>
          <View style={styles.resultCard}>
            <Text style={[styles.resultName, { lineHeight: 20 }]}>{analysisText}</Text>
          </View>
        </ScrollView>
      )}

      {results.length > 0 && (
        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
          <Text style={styles.resultsTitle}>{t('camera.results')}</Text>
          {results.map((r, i) => (
            <View key={i} style={styles.resultCard}>
              <View style={styles.resultInfo}>
                <View style={styles.resultNameRow}>
                  <Text style={styles.resultName} numberOfLines={1}>{r.name}</Text>
                  {r.nutritionalScore && (
                    <NutriScoreBadge score={r.nutritionalScore} size="sm" />
                  )}
                </View>
                <Text style={styles.resultConfidence}>
                  {r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : ''}
                  {r.caloriesPer100g ? `  ${r.caloriesPer100g} kcal/100g` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addResultButton}
                onPress={() => handleAddToJournal(r)}
                disabled={addEntry.isPending}
              >
                {addEntry.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addResultText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
            onPress={() => setMode('photo')}
          >
            <Ionicons name="camera" size={16} color={mode === 'photo' ? '#FFF' : Colors.textMuted} />
            <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'barcode' && styles.modeBtnActive]}
            onPress={() => setMode('barcode')}
          >
            <Ionicons name="barcode" size={16} color={mode === 'barcode' ? '#FFF' : Colors.textMuted} />
            <Text style={[styles.modeText, mode === 'barcode' && styles.modeTextActive]}>Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Capture row */}
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureRing}>
              <View style={styles.captureInner} />
            </View>
          </TouchableOpacity>

          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 80 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  previewArea: { flex: 1, margin: Theme.spacing.lg, marginTop: 60 },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: Theme.borderRadius.lg,
  },
  placeholder: {
    flex: 1,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  placeholderText: { fontSize: Theme.fontSize.md, color: Colors.textMuted },
  analyzingBar: {
    marginHorizontal: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  analyzingText: { color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
  resultsScroll: { maxHeight: 200, marginHorizontal: Theme.spacing.lg },
  resultsContent: { gap: Theme.spacing.sm },
  resultsTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  resultCard: {
    ...Theme.darkCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
  },
  resultInfo: { flex: 1 },
  resultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  resultName: { fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.medium, color: Colors.text, flex: 1 },
  resultConfidence: { fontSize: Theme.fontSize.sm, color: Colors.primary, marginTop: 2 },
  addResultButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginLeft: Theme.spacing.sm,
  },
  addResultText: { color: '#FFF', fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.sm },
  controls: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.full,
    padding: 3,
    marginBottom: Theme.spacing.lg,
    alignSelf: 'center',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
  },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeText: { fontSize: Theme.fontSize.sm, color: Colors.textMuted, fontWeight: Theme.fontWeight.medium },
  modeTextActive: { color: '#FFF' },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: { alignItems: 'center', justifyContent: 'center' },
  captureRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.glow.subtle,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
  },
});
