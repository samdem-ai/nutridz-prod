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
  /** value granularity: 0.1 means tick every 0.1 */
  step?: number;
  /** label every N ticks */
  labelEvery?: number;
  value: number;
  onChange: (v: number) => void;
  /** spacing per tick in px */
  tickSpacing?: number;
}

const SCREEN_W = Dimensions.get('window').width;

export default function RulerPicker({
  min,
  max,
  step = 0.1,
  labelEvery = 10,
  value,
  onChange,
  tickSpacing = 10,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(2));
  }, [min, max, step]);

  const sidePad = SCREEN_W / 2;

  useEffect(() => {
    const idx = Math.round((value - min) / step);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: idx * tickSpacing, animated: false });
    });
  }, []);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / tickSpacing);
    const v = +(min + idx * step).toFixed(2);
    if (v !== value) onChange(Math.max(min, Math.min(max, v)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={tickSpacing}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingHorizontal: sidePad - tickSpacing / 2 }}
      >
        <View style={styles.row}>
          {ticks.map((t, i) => {
            const isLabel = i % labelEvery === 0;
            return (
              <View key={i} style={[styles.tickWrap, { width: tickSpacing }]}>
                <View
                  style={[
                    styles.tick,
                    isLabel ? styles.tickMajor : styles.tickMinor,
                  ]}
                />
                {isLabel ? <Text style={styles.label}>{Math.round(t)}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 110, justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    left: SCREEN_W / 2 - 1,
    top: 0,
    bottom: 30,
    width: 2,
    backgroundColor: OnboardingColors.primary,
    zIndex: 10,
    borderRadius: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 80 },
  tickWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  tick: { backgroundColor: OnboardingColors.ruler, width: 1.5, borderRadius: 1 },
  tickMinor: { height: 14 },
  tickMajor: { height: 28 },
  label: {
    position: 'absolute',
    bottom: -22,
    fontSize: 14,
    color: OnboardingColors.textSecondary,
    fontWeight: '600',
  },
});
