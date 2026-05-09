import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  options: [string, string];
  value: string;
  onChange: (v: string) => void;
}

export default function UnitToggle({ options, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: OnboardingColors.primaryLight,
    borderRadius: 999,
    padding: 4,
    alignSelf: 'center',
  },
  pill: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 999 },
  pillActive: { backgroundColor: OnboardingColors.primary },
  label: { fontSize: 15, fontWeight: '700', color: OnboardingColors.textSecondary },
  labelActive: { color: '#FFFFFF' },
});
