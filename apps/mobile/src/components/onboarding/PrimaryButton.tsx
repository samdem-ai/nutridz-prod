import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingColors, OnboardingShadows } from '../../constants/onboardingTheme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  showArrow = true,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      delayPressIn={0}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, disabled && styles.disabled]}
    >
      <View style={styles.side} />
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={OnboardingColors.ctaText} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </View>
      <View style={styles.side}>
        {showArrow && !loading && (
          <Ionicons name="arrow-forward" size={20} color={OnboardingColors.ctaText} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OnboardingColors.cta,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 999,
    ...OnboardingShadows.cta,
  },
  disabled: { backgroundColor: '#A09BB5', shadowOpacity: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: {
    color: OnboardingColors.ctaText,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  side: { width: 28, alignItems: 'center', justifyContent: 'center' },
});
