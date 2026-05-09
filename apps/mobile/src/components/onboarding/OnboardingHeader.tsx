import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  /** 0..1 progress fill */
  progress: number;
  onBack?: () => void;
  hideBack?: boolean;
}

export default function OnboardingHeader({ progress, onBack, hideBack }: Props) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.row}>
      {hideBack ? (
        <View style={styles.backBtn} />
      ) : (
        <TouchableOpacity onPress={back} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={OnboardingColors.text} />
        </TouchableOpacity>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 14,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: OnboardingColors.trackBg,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: OnboardingColors.primary },
});
