import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
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
}

const SCREEN_W = Dimensions.get('window').width;

export default function RulerPicker({
  min,
  max,
  step = 0.1,
  labelEvery = 10,
  value,
  onChange,
  tickSpacing = 14,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const lastEmitted = useRef(value);
  const scrollX = useRef(new Animated.Value(0)).current;

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
    // intentional: only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plain JS onScroll → reliable across platforms. Drives scrollX manually.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollX.setValue(x);
    const idx = Math.round(x / tickSpacing);
    const v = +(min + idx * step).toFixed(2);
    const clamped = Math.max(min, Math.min(max, v));
    if (clamped !== lastEmitted.current) {
      lastEmitted.current = clamped;
      onChange(clamped);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={tickSpacing}
        decelerationRate={0.9}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingHorizontal: sidePad - tickSpacing / 2 }}
      >
        <View style={styles.row}>
          {ticks.map((t, i) => {
            const isLabel = i % labelEvery === 0;
            const center = i * tickSpacing;
            const opacity = scrollX.interpolate({
              inputRange: [center - tickSpacing * 8, center, center + tickSpacing * 8],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <View key={i} style={[styles.tickWrap, { width: tickSpacing }]}>
                <Animated.View
                  style={[
                    styles.tick,
                    isLabel ? styles.tickMajor : styles.tickMinor,
                    { opacity },
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
  container: { height: 120, justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    left: SCREEN_W / 2 - 1.5,
    top: 8,
    bottom: 36,
    width: 3,
    backgroundColor: OnboardingColors.primary,
    zIndex: 10,
    borderRadius: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 84 },
  tickWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 84 },
  tick: { backgroundColor: OnboardingColors.ruler, width: 1.5, borderRadius: 1 },
  tickMinor: { height: 16 },
  tickMajor: { height: 34, backgroundColor: OnboardingColors.text },
  label: {
    position: 'absolute',
    bottom: -26,
    fontSize: 13,
    color: OnboardingColors.textSecondary,
    fontWeight: '700',
  },
});
