import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const QUICK_AMOUNTS = [
  { ml: 150, label: 'Petit verre', icon: '🥃' },
  { ml: 250, label: 'Verre', icon: '🥤' },
  { ml: 330, label: 'Canette', icon: '🥫' },
  { ml: 500, label: 'Bouteille', icon: '💧' },
  { ml: 750, label: 'Grande bouteille', icon: '🍶' },
  { ml: 1000, label: '1 Litre', icon: '🌊' },
];

type Props = {
  visible: boolean;
  detectedName?: string;
  onClose: () => void;
  onConfirm: (ml: number) => void;
  loading?: boolean;
};

export default function AddWaterModal({
  visible,
  detectedName,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  const [amount, setAmount] = useState('250');
  const [selectedQuick, setSelectedQuick] = useState<number | null>(250);
  const slideAnim = useState(new Animated.Value(0))[0];
  const dropAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setAmount('250');
      setSelectedQuick(250);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(dropAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(dropAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      slideAnim.setValue(0);
      dropAnim.stopAnimation();
    }
  }, [visible]);

  const ml = parseFloat(amount) || 0;
  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const dropTranslate = dropAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 30] });
  const dropOpacity = dropAnim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] });

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
            {/* Animated water icon */}
            <View style={styles.iconArea}>
              <View style={styles.waterCircle}>
                <Ionicons name="water" size={56} color={Colors.water} />
                <Animated.View
                  style={[
                    styles.waterDrop,
                    { opacity: dropOpacity, transform: [{ translateY: dropTranslate }] },
                  ]}
                >
                  <Ionicons name="water" size={14} color={Colors.water} />
                </Animated.View>
              </View>
            </View>

            <Text style={styles.title}>Combien as-tu bu ?</Text>
            {detectedName && (
              <Text style={styles.subtitle}>Détecté : {detectedName}</Text>
            )}

            {/* Quick amounts */}
            <Text style={styles.sectionLabel}>Quantité rapide</Text>
            <View style={styles.quickGrid}>
              {QUICK_AMOUNTS.map((q) => {
                const isSelected = selectedQuick === q.ml;
                return (
                  <TouchableOpacity
                    key={q.ml}
                    style={[styles.quickCard, isSelected && styles.quickCardActive]}
                    onPress={() => {
                      setSelectedQuick(q.ml);
                      setAmount(String(q.ml));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickIcon}>{q.icon}</Text>
                    <Text style={[styles.quickMl, isSelected && styles.quickMlActive]}>
                      {q.ml}ml
                    </Text>
                    <Text style={[styles.quickLabel, isSelected && styles.quickLabelActive]}>
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom input */}
            <Text style={styles.sectionLabel}>Quantité personnalisée</Text>
            <View style={styles.customRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.customInput}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v);
                    setSelectedQuick(null);
                  }}
                  placeholder="250"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputSuffix}>ml</Text>
              </View>
              <View style={styles.stepperGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const next = Math.max(0, ml - 50);
                    setAmount(String(next));
                    setSelectedQuick(null);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="remove" size={18} color={Colors.water} />
                  <Text style={styles.stepText}>50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const next = ml + 50;
                    setAmount(String(next));
                    setSelectedQuick(null);
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="add" size={18} color={Colors.water} />
                  <Text style={styles.stepText}>50</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || ml <= 0) && styles.submitDisabled]}
              onPress={() => onConfirm(ml)}
              disabled={loading || ml <= 0}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="water" size={22} color="#FFF" />
                  <Text style={styles.submitText}>Ajouter {ml}ml</Text>
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
    maxHeight: '90%',
    paddingTop: 8,
  },
  handle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    alignSelf: 'center',
    marginBottom: 8,
  },
  content: { paddingHorizontal: Theme.spacing.xl, paddingBottom: Theme.spacing.xxxl },
  iconArea: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  waterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.water + '20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waterDrop: {
    position: 'absolute',
    top: 16,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Theme.fontSize.sm,
    color: Colors.water,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  quickCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  quickCardActive: {
    borderColor: Colors.water,
    backgroundColor: Colors.water + '20',
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  quickMl: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  quickMlActive: { color: Colors.water },
  quickLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  quickLabelActive: { color: Colors.water },
  customRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Theme.borderRadius.md,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  inputSuffix: {
    paddingRight: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.textMuted,
    fontWeight: Theme.fontWeight.semibold,
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    width: 56,
    height: 49,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.water + '15',
    borderWidth: 1,
    borderColor: Colors.water + '30',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  stepText: {
    fontSize: 11,
    color: Colors.water,
    fontWeight: Theme.fontWeight.semibold,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.water,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#FFF', fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold },
});
