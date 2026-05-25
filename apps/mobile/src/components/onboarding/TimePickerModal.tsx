import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import WheelPicker from './WheelPicker';
import { OnboardingColors, OnboardingShadows } from '../../constants/onboardingTheme';

interface Props {
  visible: boolean;
  title?: string;
  initialHour: number;
  initialMinute: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

// 24-hour format
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0..55, step 5

export default function TimePickerModal({
  visible,
  title,
  initialHour,
  initialMinute,
  onCancel,
  onConfirm,
}: Props) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(Math.round(initialMinute / 5) * 5);

  useEffect(() => {
    if (visible) {
      setHour(initialHour);
      setMinute(Math.round(initialMinute / 5) * 5);
    }
  }, [visible, initialHour, initialMinute]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Plain View backdrop — NO press handler. Nested Pressables blocked
          ScrollView gestures on Android. Dismiss via Cancel button only. */}
      <View style={styles.backdrop}>
        <View style={[styles.card, OnboardingShadows.card]}>
          {title ? <Text style={styles.title}>{title}</Text> : null}

          <View style={styles.preview}>
            <Text style={styles.previewText}>
              {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.wheels}>
            <View style={styles.wheelCol}>
              <Text style={styles.colLabel}>Hour</Text>
              <WheelPicker
                values={HOURS}
                value={hour}
                onChange={setHour}
                itemHeight={54}
                visibleCount={5}
                loop
              />
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.wheelCol}>
              <Text style={styles.colLabel}>Min</Text>
              <WheelPicker
                values={MINUTES}
                value={minute}
                onChange={setMinute}
                itemHeight={54}
                visibleCount={5}
                loop
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              delayPressIn={0}
              style={[styles.btn, styles.btnGhost]}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(hour, minute)}
              activeOpacity={0.7}
              delayPressIn={0}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnPrimaryText}>Set time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: OnboardingColors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: OnboardingColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  preview: {
    alignItems: 'center',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 38,
    fontWeight: '800',
    color: OnboardingColors.primary,
    letterSpacing: 2,
  },
  wheels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wheelCol: { flex: 1 },
  colLabel: {
    fontSize: 12,
    color: OnboardingColors.textSecondary,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colon: {
    fontSize: 32,
    fontWeight: '800',
    color: OnboardingColors.text,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: OnboardingColors.surfaceMuted,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: '700',
    color: OnboardingColors.textSecondary,
  },
  btnPrimary: { backgroundColor: OnboardingColors.primary },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
