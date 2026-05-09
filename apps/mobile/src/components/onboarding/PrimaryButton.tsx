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
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, disabled && styles.disabled]}
    >
      <View style={styles.spacer} />
      {loading ? (
        <ActivityIndicator color={OnboardingColors.ctaText} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.spacer}>
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
  label: {
    flex: 0,
    color: OnboardingColors.ctaText,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  spacer: { width: 28, alignItems: 'flex-end' },
});
