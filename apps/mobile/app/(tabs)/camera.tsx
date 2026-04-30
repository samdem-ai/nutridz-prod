import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert,
  ScrollView, ActivityIndicator, Modal, Animated, Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';
import NutriScoreBadge from '../../src/components/ui/NutriScoreBadge';
import api from '../../src/services/api';
import { useAddJournalEntry } from '../../src/hooks/useJournal';
import { useLogWater } from '../../src/hooks/useHydration';
import AddFoodModal from '../../src/components/ui/AddFoodModal';
import AddWaterModal from '../../src/components/ui/AddWaterModal';

const WATER_KEYWORDS = ['eau', 'water', 'ماء', 'aqua', 'h2o', 'mineral', 'minérale', 'plate', 'gazeuse'];

const isWaterFood = (food: any): boolean => {
  const name = (food?.name || '').toLowerCase();
  const nameAr = (food?.nameAr || '').toLowerCase();
  return WATER_KEYWORDS.some((kw) => name.includes(kw) || nameAr.includes(kw));
};

const todayStr = () => new Date().toISOString().split('T')[0];

const getCurrentMealType = () => {
  const h = new Date().getHours();
  if (h < 10) return 'BREAKFAST';
  if (h < 15) return 'LUNCH';
  if (h < 20) return 'DINNER';
  return 'SNACK';
};

export default function CameraScreen() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterFood, setWaterFood] = useState<any>(null);
  const addEntry = useAddJournalEntry();
  const logWater = useLogWater();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation while loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  // Slide-in result animation
  useEffect(() => {
    if (analysisResult) {
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [analysisResult]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('camera.permissionCamera'), t('camera.permissionCameraMsg'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setAnalysisResult(null);
      identifyFood(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setAnalysisResult(null);
      identifyFood(result.assets[0].uri);
    }
  };

  const identifyFood = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'food.jpg' } as any);
      const { data } = await api.post('/ai/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setAnalysisResult(data);
    } catch (e: any) {
      Alert.alert(t('common.error'), t('common.error'));
      setAnalysisResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: any) => {
    if (isWaterFood(food)) {
      setWaterFood(food);
      setShowWaterModal(true);
      return;
    }
    setSelectedFood({
      ...food,
      _defaultPortion: food.estimatedPortionGrams || 100,
    });
    setShowAddModal(true);
  };

  const handleConfirmWater = (ml: number) => {
    logWater.mutate(
      { mlToAdd: ml },
      {
        onSuccess: () => {
          setShowWaterModal(false);
          setWaterFood(null);
          Alert.alert(t('water.added'), t('water.addedMsg', { ml }));
        },
        onError: () => Alert.alert(t('common.error'), t('common.error')),
      }
    );
  };

  const handleConfirmAdd = (data: { foodId: number; quantityGrams: number; mealType: string }) => {
    if (!data.foodId || data.foodId <= 0) {
      Alert.alert(t('common.error'), 'Invalid food id from AI');
      return;
    }
    addEntry.mutate(
      { ...data, logSource: 'AI_PHOTO', date: todayStr() },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setSelectedFood(null);
          Alert.alert('OK', `Added to journal (${data.mealType})`);
        },
        onError: (e: any) => {
          const msg = e?.response?.data?.message || e?.message || 'Unknown error';
          console.warn('Add journal entry failed:', e?.response?.data || e);
          Alert.alert(t('common.error'), msg);
        },
      }
    );
  };

  const resetScan = () => {
    setImage(null);
    setAnalysisResult(null);
  };

  const foods = analysisResult?.foods || [];
  const advice = analysisResult?.advice;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('camera.title')}</Text>
        {image && (
          <TouchableOpacity onPress={resetScan} style={styles.resetBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preview area */}
        <View style={styles.previewArea}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          ) : (
            <TouchableOpacity style={styles.placeholder} onPress={takePhoto} activeOpacity={0.7}>
              <Animated.View style={[styles.placeholderIcon, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="camera" size={44} color={Colors.primary} />
              </Animated.View>
              <Text style={styles.placeholderTitle}>{t('camera.takePhoto')}</Text>
              <Text style={styles.placeholderSub}>
                {t('camera.scanInstructions')}
              </Text>
            </TouchableOpacity>
          )}

          {loading && (
            <View style={styles.analyzingOverlay}>
              <Animated.View style={[styles.analyzingPill, { transform: [{ scale: pulseAnim }] }]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.analyzingText}>{t('camera.analyzing')}</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* AI Advice card */}
        {advice && (
          <Animated.View
            style={[
              styles.adviceCard,
              {
                opacity: resultAnim,
                transform: [{
                  translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                }],
              },
            ]}
          >
            <View style={styles.adviceIconBg}>
              <Ionicons name="bulb" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.adviceText}>{advice}</Text>
          </Animated.View>
        )}

        {/* Detected foods */}
        {foods.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {foods.length === 1 ? '1 aliment détecté' : `${foods.length} aliments détectés`}
            </Text>
            {foods.map((food: any, i: number) => (
              <Animated.View
                key={food.id || i}
                style={{
                  opacity: resultAnim,
                  transform: [{
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40 + i * 10, 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity
                  style={[styles.foodCard, isWaterFood(food) && { borderColor: Colors.water, borderWidth: 1 }]}
                  onPress={() => handleSelectFood(food)}
                  activeOpacity={0.85}
                >
                  <View style={styles.foodCardLeft}>
                    <View style={styles.foodCardHeader}>
                      {isWaterFood(food) && (
                        <Ionicons name="water" size={18} color={Colors.water} />
                      )}
                      <Text style={styles.foodCardName} numberOfLines={1}>{food.name}</Text>
                      {food.nutritionalScore && !isWaterFood(food) && (
                        <NutriScoreBadge score={food.nutritionalScore} size="sm" />
                      )}
                    </View>
                    {food.nameAr && (
                      <Text style={styles.foodCardNameAr}>{food.nameAr}</Text>
                    )}
                    <View style={styles.foodCardMeta}>
                      {food.confidence != null && (
                        <View style={styles.confPill}>
                          <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                          <Text style={styles.confText}>
                            {(food.confidence * 100).toFixed(0)}% sûr
                          </Text>
                        </View>
                      )}
                      <Text style={styles.foodCardCals}>
                        {food.caloriesPer100g} kcal/100g
                      </Text>
                    </View>
                    {food.estimatedPortionGrams > 0 && (
                      <Text style={styles.foodCardPortion}>
                        Portion estimée: ~{food.estimatedPortionGrams}g ({Math.round((food.caloriesPer100g * food.estimatedPortionGrams) / 100)} kcal)
                      </Text>
                    )}
                  </View>
                  <View style={styles.foodCardAction}>
                    <Ionicons
                      name="add-circle"
                      size={32}
                      color={isWaterFood(food) ? Colors.water : Colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* No results */}
        {analysisResult && foods.length === 0 && !loading && (
          <View style={styles.noResultsCard}>
            <Ionicons name="alert-circle" size={32} color={Colors.warning} />
            <Text style={styles.noResultsTitle}>{t('camera.noFoodDetected')}</Text>
            <Text style={styles.noResultsSub}>{t('camera.tryClearer')}</Text>
          </View>
        )}

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage} activeOpacity={0.7}>
          <Ionicons name="images" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={takePhoto} activeOpacity={0.8} disabled={loading}>
          <View style={styles.captureRing}>
            <View style={[styles.captureInner, loading && { backgroundColor: Colors.textMuted }]} />
          </View>
        </TouchableOpacity>

        <View style={{ width: 48 }} />
      </View>

      {/* Add to journal modal */}
      <AddFoodModal
        visible={showAddModal}
        food={selectedFood}
        defaultMealType={getCurrentMealType()}
        defaultPortion={selectedFood?._defaultPortion || 100}
        showMealPicker={true}
        onClose={() => { setShowAddModal(false); setSelectedFood(null); }}
        onConfirm={handleConfirmAdd}
        loading={addEntry.isPending}
      />

      {/* Water modal — for detected drinks */}
      <AddWaterModal
        visible={showWaterModal}
        detectedName={waterFood?.name}
        onClose={() => { setShowWaterModal(false); setWaterFood(null); }}
        onConfirm={handleConfirmWater}
        loading={logWater.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: Theme.spacing.lg },
  previewArea: {
    height: 280,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: Theme.spacing.lg,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xxl,
  },
  placeholderIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  placeholderTitle: {
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  analyzingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    ...Theme.glow.subtle,
  },
  analyzingText: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: Theme.fontSize.sm,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  adviceIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceText: {
    flex: 1,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  resultsSection: {
    marginBottom: Theme.spacing.lg,
  },
  resultsTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.darkCard,
    marginBottom: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
  },
  foodCardLeft: { flex: 1 },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: 4,
  },
  foodCardName: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  foodCardNameAr: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  foodCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: 4,
  },
  confPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  confText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  foodCardCals: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
  },
  foodCardPortion: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  foodCardAction: {
    paddingLeft: Theme.spacing.md,
  },
  noResultsCard: {
    ...Theme.darkCard,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxxl,
    gap: Theme.spacing.sm,
  },
  noResultsTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  noResultsSub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
  },
  controls: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Theme.spacing.xl,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: { alignItems: 'center', justifyContent: 'center' },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    ...Theme.glow.primary,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
});
