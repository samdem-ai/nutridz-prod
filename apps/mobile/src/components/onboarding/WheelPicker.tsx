import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { OnboardingColors } from '../../constants/onboardingTheme';

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  itemHeight?: number;
  visibleCount?: number;
  /** Infinite scroll. Uses N virtual copies + virtualized FlatList + silent recenter. */
  loop?: boolean;
}

// Number of virtual copies for loop mode. FlatList virtualizes,
// so we only render ~visibleCount × windowSize items at once.
const LOOPS = 100;
const EDGE_MARGIN = 10; // items before edge triggers recenter

export default function WheelPicker({
  values,
  value,
  onChange,
  itemHeight = 72,
  visibleCount = 5,
  loop = false,
}: Props) {
  const listRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastEmitted = useRef(value);
  const padding = ((visibleCount - 1) / 2) * itemHeight;

  const len = values.length;

  // Data = looped values when loop=true
  const data = useMemo(() => {
    if (!loop) return values;
    const out: number[] = [];
    for (let i = 0; i < LOOPS; i++) out.push(...values);
    return out;
  }, [values, loop]);

  const middleStart = loop ? Math.floor(LOOPS / 2) * len : 0;
  const initialLocalIdx = Math.max(0, values.indexOf(value));
  const initialIdx = middleStart + initialLocalIdx;

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: initialIdx * itemHeight,
        animated: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    const virtIdx = Math.round(y / itemHeight);
    const localIdx = ((virtIdx % len) + len) % len;
    const v = values[localIdx];
    if (v !== undefined && v !== lastEmitted.current) {
      lastEmitted.current = v;
      onChange(v);
    }
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!loop) return;
    const y = e.nativeEvent.contentOffset.y;
    const virtIdx = Math.round(y / itemHeight);
    const total = LOOPS * len;
    if (virtIdx < EDGE_MARGIN || virtIdx > total - EDGE_MARGIN - visibleCount) {
      const localIdx = ((virtIdx % len) + len) % len;
      const recenter = (middleStart + localIdx) * itemHeight;
      listRef.current?.scrollToOffset({ offset: recenter, animated: false });
    }
  };

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const center = index * itemHeight;
    const opacity = scrollY.interpolate({
      inputRange: [center - itemHeight * 2, center, center + itemHeight * 2],
      outputRange: [0.2, 1, 0.2],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.item, { height: itemHeight, opacity }]}>
        <Text style={styles.text}>{item.toString().padStart(2, '0')}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { height: itemHeight * visibleCount }]}>
      <View
        pointerEvents="none"
        style={[styles.selector, { height: itemHeight, marginTop: -itemHeight / 2 }]}
      />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        initialScrollIndex={initialIdx}
        contentContainerStyle={{ paddingVertical: padding }}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={visibleCount + 4}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  selector: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    borderWidth: 1.5,
    borderColor: OnboardingColors.primary,
    borderRadius: 999,
    backgroundColor: OnboardingColors.primaryMuted,
    zIndex: 0,
  },
  item: { alignItems: 'center', justifyContent: 'center' },
  text: {
    fontSize: 32,
    color: OnboardingColors.text,
    fontWeight: '800',
    includeFontPadding: false as any,
    textAlignVertical: 'center',
  },
});
