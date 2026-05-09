import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { OnboardingColors, OnboardingShadows } from '../../constants/onboardingTheme';

interface Props {
  emoji: string;
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
}

export default function OptionCard({ emoji, title, description, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected && styles.selected, OnboardingShadows.card]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OnboardingColors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: OnboardingColors.primary,
    backgroundColor: OnboardingColors.primaryLight,
  },
  emoji: { fontSize: 28 },
  body: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: OnboardingColors.text },
  desc: { fontSize: 13, color: OnboardingColors.textSecondary, marginTop: 2 },
});
