import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '../../src/components/onboarding/OnboardingHeader';
import PrimaryButton from '../../src/components/onboarding/PrimaryButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingColors, OnboardingShadows } from '../../src/constants/onboardingTheme';

const STEPS = 10;
const PACE_VALUES = Array.from({ length: STEPS }, (_, i) => +((i + 1) * 0.1).toFixed(1));

const THUMB_SIZE = 30;
const TRACK_PADDING = 12;

export default function PaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  // SELECTIVE subscriptions — avoid re-render when other store slices change
  const paceKgPerWeek = useOnboardingStore((s) => s.paceKgPerWeek);
  const setPaceStore = useOnboardingStore((s) => s.setPace);
  const goal = useOnboardingStore((s) => s.goal);

  const sign = goal === 'GAIN' ? 1 : -1;

  const initialIdx = Math.max(
    0,
    Math.min(STEPS - 1, Math.round(Math.abs(paceKgPerWeek) * 10) - 1)
  );

  // Local idx (drives display + tone). Store write deferred to release for smoothness.
  const [idx, setIdx] = useState(initialIdx);
  const idxRef = useRef(initialIdx);

  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  // Animated thumb position (continuous, JS-driven for width interpolation)
  const thumbX = useRef(new Animated.Value(0)).current;

  // Position thumb after layout
  useEffect(() => {
    if (trackWidthRef.current <= 0) return;
    const usable = trackWidthRef.current - 2 * TRACK_PADDING - THUMB_SIZE;
    thumbX.setValue((initialIdx / (STEPS - 1)) * usable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const xToIdx = (rawLocalX: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return 0;
    const usable = w - 2 * TRACK_PADDING - THUMB_SIZE;
    const clamped = Math.max(0, Math.min(usable, rawLocalX - TRACK_PADDING - THUMB_SIZE / 2));
    return Math.round((clamped / usable) * (STEPS - 1));
  };

  // Tap (grant) — spring-animate thumb to tapped position
  const onGestureGrant = (e: GestureResponderEvent) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const usable = w - 2 * TRACK_PADDING - THUMB_SIZE;
    const newIdx = xToIdx(e.nativeEvent.locationX);
    const target = (newIdx / (STEPS - 1)) * usable;
    Animated.spring(thumbX, {
      toValue: target,
      useNativeDriver: false,
      friction: 6,
      tension: 160,
    }).start();
    if (newIdx !== idxRef.current) {
      idxRef.current = newIdx;
      setIdx(newIdx);
    }
  };

  // Drag — kill spring, follow finger live
  const onGestureMove = (e: GestureResponderEvent) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const usable = w - 2 * TRACK_PADDING - THUMB_SIZE;
    const clamped = Math.max(0, Math.min(usable, e.nativeEvent.locationX - TRACK_PADDING - THUMB_SIZE / 2));
    thumbX.stopAnimation();
    thumbX.setValue(clamped);
    const newIdx = Math.round((clamped / usable) * (STEPS - 1));
    if (newIdx !== idxRef.current) {
      idxRef.current = newIdx;
      setIdx(newIdx);
    }
  };

  const onGestureRelease = (e: GestureResponderEvent) => {
    const newIdx = xToIdx(e.nativeEvent.locationX);
    const usable = trackWidthRef.current - 2 * TRACK_PADDING - THUMB_SIZE;
    Animated.spring(thumbX, {
      toValue: (newIdx / (STEPS - 1)) * usable,
      useNativeDriver: false,
      friction: 7,
      tension: 140,
    }).start();
    idxRef.current = newIdx;
    setIdx(newIdx);
    const v = +(sign * PACE_VALUES[newIdx]).toFixed(2);
    if (v !== paceKgPerWeek) setPaceStore(v);
  };

  const tapToIdx = (i: number) => {
    const safe = Math.max(0, Math.min(STEPS - 1, i));
    const usable = trackWidthRef.current - 2 * TRACK_PADDING - THUMB_SIZE;
    Animated.spring(thumbX, {
      toValue: (safe / (STEPS - 1)) * usable,
      useNativeDriver: false,
      friction: 7,
      tension: 140,
    }).start();
    idxRef.current = safe;
    setIdx(safe);
    setPaceStore(+(sign * PACE_VALUES[safe]).toFixed(2));
  };

  const tone =
    idx <= 3
      ? t('onboarding.paceBalanced')
      : idx <= 6
      ? t('onboarding.paceSteady')
      : t('onboarding.paceAggressive');
  const recommended = idx <= 3;

  // Fill width interpolates so green ends at thumb center (which moves 0..usable).
  // Track itself is inside paddingHorizontal TRACK_PADDING, so fill is relative to track left.
  const usableForFill = Math.max(1, trackWidth - 2 * TRACK_PADDING - THUMB_SIZE);
  const fillWidth = thumbX.interpolate({
    inputRange: [0, usableForFill],
    outputRange: [THUMB_SIZE / 2, usableForFill + THUMB_SIZE / 2],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader progress={9 / 10} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {sign < 0 ? t('onboarding.paceTitleLose') : t('onboarding.paceTitleGain')}
        </Text>

        <View style={styles.toneCard}>
          <Text style={styles.toneTitle}>{tone}</Text>
          {recommended ? (
            <Text style={styles.recommended}>{t('onboarding.paceRecommended')}</Text>
          ) : (
            <Text style={styles.notRecommended}>
              {t('onboarding.paceNotRecommended')}
            </Text>
          )}
        </View>

        <View style={styles.valueWrap}>
          <View style={[styles.valuePill, OnboardingShadows.card]}>
            <Text style={styles.valueLabel}>{t('onboarding.perWeek')}</Text>
            <Text style={styles.valueText}>
              {sign < 0 ? '−' : '+'}
              {PACE_VALUES[idx].toFixed(1)} kg
            </Text>
          </View>
        </View>

        <View
          style={styles.sliderArea}
          onLayout={onTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={onGestureGrant}
          onResponderMove={onGestureMove}
          onResponderRelease={onGestureRelease}
          onResponderTerminate={onGestureRelease}
          onResponderTerminationRequest={() => false}
        >
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: fillWidth }]} />
          </View>

          <View style={styles.dotRow} pointerEvents="none">
            {PACE_VALUES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i <= idx ? styles.dotFilled : null]}
              />
            ))}
          </View>

          <Animated.View
            pointerEvents="none"
            style={[styles.thumb, { transform: [{ translateX: thumbX }] }]}
          />
        </View>

        <View style={styles.bounds}>
          <Text style={styles.boundText}>
            {sign < 0 ? '−' : '+'}0.1 kg
          </Text>
          <Text style={styles.boundText}>
            {sign < 0 ? '−' : '+'}1.0 kg
          </Text>
        </View>

        <View style={styles.chipsRow}>
          {[0, 2, 5, 9].map((i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={() => tapToIdx(i)}
              style={[styles.chip, idx === i && styles.chipActive]}
            >
              <Text style={[styles.chipText, idx === i && styles.chipTextActive]}>
                {sign < 0 ? '−' : '+'}{PACE_VALUES[i].toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('common.next')}
          onPress={() => router.push('/(onboarding)/reminders')}
        />
        <TouchableOpacity style={styles.sourceRow}>
          <Text style={styles.sourceText}>{t('common.sourceRecommendations')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OnboardingColors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: OnboardingColors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  toneCard: {
    backgroundColor: OnboardingColors.primaryLight,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  toneTitle: { fontSize: 15, color: OnboardingColors.textSecondary, fontWeight: '700' },
  recommended: { fontSize: 20, color: OnboardingColors.success, fontWeight: '800', marginTop: 4 },
  notRecommended: { fontSize: 13, color: OnboardingColors.warning, fontWeight: '700', marginTop: 4 },
  valueWrap: { alignItems: 'center', marginBottom: 24 },
  valuePill: {
    backgroundColor: OnboardingColors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OnboardingColors.border,
    minWidth: 140,
  },
  valueLabel: { fontSize: 11, color: OnboardingColors.textSecondary },
  valueText: { fontSize: 22, fontWeight: '800', color: OnboardingColors.text, marginTop: 2 },

  sliderArea: {
    height: 56,
    paddingHorizontal: TRACK_PADDING,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 16,
    backgroundColor: OnboardingColors.trackBg,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: 16,
    backgroundColor: OnboardingColors.success,
    borderRadius: 999,
  },
  dotRow: {
    position: 'absolute',
    left: TRACK_PADDING + THUMB_SIZE / 2 - 3,
    right: TRACK_PADDING + THUMB_SIZE / 2 - 3,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OnboardingColors.textMuted,
    opacity: 0.55,
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: OnboardingColors.success,
    top: '50%',
    marginTop: -THUMB_SIZE / 2,
    left: TRACK_PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  bounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: TRACK_PADDING,
  },
  boundText: { color: OnboardingColors.textSecondary, fontSize: 12, fontWeight: '700' },

  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: OnboardingColors.surface,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: OnboardingColors.primary,
    borderColor: OnboardingColors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: OnboardingColors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
  sourceRow: { alignItems: 'center' },
  sourceText: { color: OnboardingColors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
