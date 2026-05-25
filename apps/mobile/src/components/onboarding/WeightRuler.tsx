import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  min: number;
  max: number;
  /** Tick spacing in units. 0.1 = 1 tick per 100g */
  step?: number;
  /** Major label every N units (e.g. 5 = label every 5 kg) */
  majorEvery?: number;
  value: number;
  onChange: (v: number) => void;
  /** Px between adjacent ticks. Bigger = easier to fine-tune */
  tickWidth?: number;
}

const SCREEN_W = Dimensions.get('window').width;

/**
 * Smooth horizontal weight ruler.
 * Uses FlatList virtualization (handles thousands of ticks on both platforms).
 * Snaps to ticks; emits onChange live during scroll.
 */
export default function WeightRuler({
  min,
  max,
  step = 0.1,
  majorEvery = 5,
  value,
  onChange,
  tickWidth = 12,
}: Props) {
  const listRef = useRef<FlatList>(null);
  const lastEmitted = useRef(value);

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(2));
  }, [min, max, step]);

  // How many ticks per major label
  const ticksPerMajor = Math.max(1, Math.round(majorEvery / step));
  const sidePad = SCREEN_W / 2 - tickWidth / 2;

  const valueIdx = Math.round((value - min) / step);

  useEffect(() => {
    // Scroll to initial value after layout
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: valueIdx * tickWidth,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / tickWidth);
    const v = +(min + idx * step).toFixed(2);
    const clamped = Math.max(min, Math.min(max, v));
    if (clamped !== lastEmitted.current) {
      lastEmitted.current = clamped;
      onChange(clamped);
    }
  };

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const isMajor = index % ticksPerMajor === 0;
    return (
      <View style={[styles.col, { width: tickWidth }]}>
        <View style={[styles.tick, isMajor ? styles.tickMajor : styles.tickMinor]} />
        {isMajor ? (
          <View style={styles.labelWrap} pointerEvents="none">
            <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
              {Math.round(item)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={ticks}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={tickWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        getItemLayout={(_, index) => ({
          length: tickWidth,
          offset: tickWidth * index,
          index,
        })}
        initialScrollIndex={valueIdx}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
        removeClippedSubviews
        windowSize={11}
        initialNumToRender={40}
        maxToRenderPerBatch={40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    left: SCREEN_W / 2 - 2,
    top: 6,
    bottom: 36,
    width: 4,
    backgroundColor: OnboardingColors.primary,
    zIndex: 10,
    borderRadius: 2,
  },
  col: { alignItems: 'center', justifyContent: 'flex-end', height: 84, overflow: 'visible' },
  tick: { backgroundColor: OnboardingColors.ruler, width: 1.5, borderRadius: 1 },
  tickMinor: { height: 18 },
  tickMajor: { height: 38, backgroundColor: OnboardingColors.text },
  labelWrap: {
    // 60px wrap centered under 12px column → left = (12 - 60) / 2
    position: 'absolute',
    bottom: -26,
    width: 60,
    left: -24,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: OnboardingColors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
