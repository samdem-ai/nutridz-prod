import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  itemHeight?: number;
}

export default function WheelPicker({
  values,
  value,
  onChange,
  itemHeight = 64,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const visibleCount = 5;
  const padding = ((visibleCount - 1) / 2) * itemHeight;

  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: idx * itemHeight, animated: false });
      });
    }
  }, []);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / itemHeight);
    const v = values[Math.max(0, Math.min(values.length - 1, idx))];
    if (v !== undefined && v !== value) onChange(v);
  };

  return (
    <View style={[styles.container, { height: itemHeight * visibleCount }]}>
      <View
        pointerEvents="none"
        style={[styles.selector, { height: itemHeight }]}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingVertical: padding }}
      >
        {values.map((v) => {
          const selected = v === value;
          return (
            <View key={v} style={[styles.item, { height: itemHeight }]}>
              <Text style={[styles.text, selected && styles.textSelected]}>{v}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  selector: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -32 }],
    left: '20%',
    right: '20%',
    borderWidth: 2,
    borderColor: OnboardingColors.primary,
    borderRadius: 999,
    backgroundColor: OnboardingColors.primaryLight,
    zIndex: 0,
  },
  item: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: OnboardingColors.textMuted, fontWeight: '700' },
  textSelected: { color: OnboardingColors.text, fontSize: 36 },
});
