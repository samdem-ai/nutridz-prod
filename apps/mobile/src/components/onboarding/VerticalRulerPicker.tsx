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
  tickSpacing = 14,
  height = SCREEN_H * 0.55,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastEmitted = useRef(value);

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(2));
  }, [min, max, step]);

  const sidePad = height / 2;

  useEffect(() => {
    const idx = Math.round((max - value) / step);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * tickSpacing, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    const idx = Math.round(y / tickSpacing);
    const v = +(max - idx * step).toFixed(2);
    const clamped = Math.max(min, Math.min(max, v));
    if (clamped !== lastEmitted.current) {
      lastEmitted.current = clamped;
      onChange(clamped);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.indicator} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={tickSpacing}
        decelerationRate={0.9}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingVertical: sidePad - tickSpacing / 2 }}
      >
        {ticks
          .slice()
          .reverse()
          .map((t, i) => {
            const realIdx = ticks.length - 1 - i;
            const isLabel = realIdx % labelEvery === 0;
            const center = i * tickSpacing;
            const opacity = scrollY.interpolate({
              inputRange: [center - tickSpacing * 8, center, center + tickSpacing * 8],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <View key={i} style={[styles.tickRow, { height: tickSpacing }]}>
                {isLabel ? (
                  <Text style={styles.label}>{Math.round(t)}</Text>
                ) : (
                  <View style={styles.labelSpacer} />
                )}
                <Animated.View
                  style={[
                    styles.tick,
                    isLabel ? styles.tickMajor : styles.tickMinor,
                    { opacity },
                  ]}
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
    width: 110,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    overflow: 'visible',
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    right: 0,
    height: 3,
    width: 64,
    marginTop: -1.5,
    backgroundColor: OnboardingColors.primary,
    zIndex: 10,
    borderRadius: 2,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    gap: 8,
    overflow: 'visible',
  },
  labelSpacer: { width: 32 },
  label: {
    fontSize: 14,
    color: OnboardingColors.textSecondary,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
  tick: { backgroundColor: OnboardingColors.ruler, height: 1.5, borderRadius: 1 },
  tickMinor: { width: 18 },
  tickMajor: { width: 36, backgroundColor: OnboardingColors.text },
});
