import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';

export default function IntroScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={12}>
        <Ionicons name="chevron-back" size={28} color={OnboardingColors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>NutriDz delivers{'\n'}long-term result</Text>

        <View style={styles.chartWrap}>
          <Svg width={300} height={220} viewBox="0 0 300 220">
            <G>
              {/* axis */}
              <Path
                d="M 30 180 L 280 180"
                stroke="#D6D2E0"
                strokeWidth={1}
                strokeDasharray="4 6"
              />
              {/* Other (red dashed) */}
              <Path
                d="M 30 100 C 70 60, 100 200, 140 130 S 230 30, 280 70"
                stroke={OnboardingColors.error}
                strokeWidth={3}
                strokeDasharray="6 6"
                fill="none"
              />
              {/* Your weight (green) */}
              <Path
                d="M 30 100 C 90 100, 130 100, 170 150 S 240 170, 280 170"
                stroke={OnboardingColors.success}
                strokeWidth={4}
                fill="none"
              />
              <Circle cx={30} cy={100} r={5} fill={OnboardingColors.success} />
              <Circle cx={280} cy={170} r={5} fill={OnboardingColors.success} />
            </G>
          </Svg>
          <View style={[styles.label, { left: 60, top: 60 }]}>
            <Text style={styles.labelText}>Your Weight</Text>
          </View>
          <View style={[styles.label, { right: 30, top: 30 }]}>
            <Text style={[styles.labelText, { color: OnboardingColors.error }]}>Other</Text>
          </View>
          <View style={[styles.tag, { right: 50, top: 130 }]}>
            <Text style={styles.tagText}>NutriDz App</Text>
          </View>
        </View>

        <View style={[styles.statCard, OnboardingShadows.card]}>
          <Text style={styles.statText}>
            <Text style={styles.statHighlight}>74% </Text>
            of NutriDz users sustain weight loss over 6 months
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Next" onPress={() => router.push('/(onboarding)/goal')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bgAlt },
  back: { padding: 14 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: OnboardingColors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  chartWrap: { marginVertical: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  label: { position: 'absolute' },
  labelText: { fontSize: 13, fontWeight: '700', color: OnboardingColors.text },
  tag: {
    position: 'absolute',
    backgroundColor: OnboardingColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    width: '100%',
  },
  statText: { fontSize: 15, color: OnboardingColors.text, textAlign: 'center', lineHeight: 22 },
  statHighlight: { color: OnboardingColors.success, fontWeight: '800', fontSize: 17 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
