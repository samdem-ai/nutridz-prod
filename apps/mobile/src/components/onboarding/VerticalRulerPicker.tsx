import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  min: number;
  max: number;
  step?: number;
  labelEvery?: number;
  value: number;
  onChange: (v: number) => void;
  tickSpacing?: number;
  height?: number;
}

const SCREEN_H = Dimensions.get('window').height;

export default function VerticalRulerPicker({
  min,
  max,
  step = 1,
  labelEvery = 10,
  value,
  onChange,
  tickSpacing = 8,
  height = SCREEN_H * 0.55,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(2));
  }, [min, max, step]);

  const sidePad = height / 2;

  useEffect(() => {
    // scroll position = (max - value) / step * tickSpacing  (top = max)
    const idx = Math.round((max - value) / step);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * tickSpacing, animated: false });
    });
  }, []);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / tickSpacing);
    const v = +(max - idx * step).toFixed(2);
    if (v !== value) onChange(Math.max(min, Math.min(max, v)));
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.indicator} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={tickSpacing}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingVertical: sidePad - tickSpacing / 2 }}
      >
        {ticks
          .slice()
          .reverse()
          .map((t, i) => {
            const realIdx = ticks.length - 1 - i;
            const isLabel = realIdx % labelEvery === 0;
            return (
              <View key={i} style={[styles.tickWrap, { height: tickSpacing }]}>
                {isLabel ? <Text style={styles.label}>{Math.round(t)}</Text> : null}
                <View
                  style={[styles.tick, isLabel ? styles.tickMajor : styles.tickMinor]}
                />
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    right: 0,
    height: 2,
    width: 56,
    backgroundColor: OnboardingColors.primary,
    zIndex: 10,
    borderRadius: 1,
  },
  tickWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    gap: 6,
  },
  tick: { backgroundColor: OnboardingColors.ruler, height: 1.5, borderRadius: 1 },
  tickMinor: { width: 14 },
  tickMajor: { width: 28 },
  label: {
    fontSize: 14,
    color: OnboardingColors.textSecondary,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
});
