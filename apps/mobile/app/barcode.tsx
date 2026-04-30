import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Easing, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import api from '../src/services/api';
import { useAddJournalEntry } from '../src/hooks/useJournal';
import AddFoodModal from '../src/components/ui/AddFoodModal';

const today = new Date().toISOString().split('T')[0];

const getCurrentMealType = () => {
  const h = new Date().getHours();
  if (h < 10) return 'BREAKFAST';
  if (h < 15) return 'LUNCH';
  if (h < 20) return 'DINNER';
  return 'SNACK';
};

export default function BarcodeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundFood, setFoundFood] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const addEntry = useAddJournalEntry();

  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scanned && !loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(lineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [scanned, loading]);

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const { data: food } = await api.get(`/foods/barcode/${data}`);
      setFoundFood(food);
      setShowAddModal(true);
    } catch (e: any) {
      Alert.alert(
        'Produit non trouvé',
        `Code-barres "${data}" pas dans notre base.\n\nTu peux l'ajouter manuellement via le journal.`,
        [
          { text: 'Réessayer', onPress: () => { setScanned(false); } },
          { text: 'Retour', onPress: () => router.back() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdd = (data: { foodId: number; quantityGrams: number; mealType: string }) => {
    addEntry.mutate(
      { ...data, logSource: 'BARCODE_SCAN', date: today },
      {
        onSuccess: () => {
          setShowAddModal(false);
          Alert.alert('Ajouté !', `${foundFood?.name} ajouté au journal`, [
            { text: 'Scanner un autre', onPress: () => { setScanned(false); setFoundFood(null); } },
            { text: 'Terminer', onPress: () => router.back() },
          ]);
        },
        onError: () => Alert.alert('Erreur', 'Impossible d\'ajouter'),
      }
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permWrap}>
          <Ionicons name="barcode" size={56} color={Colors.primary} />
          <Text style={styles.permTitle}>Caméra requise</Text>
          <Text style={styles.permSub}>Pour scanner les codes-barres des produits</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
            <Text style={styles.permBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const lineY = lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'code39'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scanner</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan zone */}
        <View style={styles.scanZone}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {!scanned && !loading && (
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: lineY }] }]}
            />
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Recherche...</Text>
            </View>
          )}
        </View>

        {/* Hint */}
        <View style={styles.hintBar}>
          <Ionicons name="information-circle" size={16} color="#FFF" />
          <Text style={styles.hintText}>
            {scanned ? 'Code détecté' : 'Aligne le code-barres dans le cadre'}
          </Text>
        </View>

        {scanned && !showAddModal && !loading && (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => { setScanned(false); setFoundFood(null); }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.rescanText}>Scanner un autre</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddFoodModal
        visible={showAddModal}
        food={foundFood}
        defaultMealType={getCurrentMealType()}
        defaultPortion={100}
        showMealPicker={true}
        onClose={() => { setShowAddModal(false); setScanned(false); }}
        onConfirm={handleConfirmAdd}
        loading={addEntry.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: '#FFF', fontSize: Theme.fontSize.lg, fontWeight: '700' },
  scanZone: {
    width: 280,
    height: 200,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28, height: 28,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  loadingText: { color: '#FFF', fontWeight: '600' },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: 999,
    marginBottom: Theme.spacing.xxl,
  },
  hintText: { color: '#FFF', fontSize: Theme.fontSize.sm },
  rescanBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: 999,
  },
  rescanText: { color: '#FFF', fontWeight: '700' },
  permWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xxl,
    backgroundColor: Colors.background,
    gap: Theme.spacing.md,
  },
  permTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  permSub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xxl,
    paddingVertical: Theme.spacing.md,
    borderRadius: 999,
    marginTop: Theme.spacing.md,
  },
  permBtnText: { color: '#FFF', fontWeight: '700' },
});
