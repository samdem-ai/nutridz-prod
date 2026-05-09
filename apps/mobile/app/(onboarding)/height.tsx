import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import VerticalRulerPicker from '../../src/components/onboarding/VerticalRulerPicker';
import UnitToggle from '../../src/components/onboarding/UnitToggle';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

const cmToFt = (cm: number) => {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}'${inch}"`;
};

export default function HeightScreen() {
  const router = useRouter();
  const { heightCm, setHeight, heightUnit, setHeightUnit } = useOnboardingStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={4 / 9} />
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.title}>Select Your Height</Text>
          <View style={styles.toggleWrap}>
            <UnitToggle
              options={['ft', 'cm']}
              value={heightUnit}
              onChange={(v) => setHeightUnit(v as 'ft' | 'cm')}
            />
          </View>
          <View style={styles.valueWrap}>
            <Text style={styles.valueBig}>
              {heightUnit === 'cm' ? heightCm : cmToFt(heightCm)}
            </Text>
            <Text style={styles.valueUnit}>{heightUnit}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <VerticalRulerPicker
            min={140}
            max={210}
            step={1}
            labelEvery={10}
            value={heightCm}
            onChange={setHeight}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label="Next"
          onPress={() => router.push('/(onboarding)/current-weight')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8, flexDirection: 'row' },
  left: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 8 },
  right: { width: 90, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: OnboardingColors.text, marginBottom: 24 },
  toggleWrap: { marginBottom: 60 },
  valueWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  valueBig: { fontSize: 56, fontWeight: '800', color: OnboardingColors.text },
  valueUnit: { fontSize: 18, color: OnboardingColors.textSecondary, marginBottom: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
