import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
  width?: number;
  height?: number;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * Bowl with animated wavy water. Fills proportionally to value/target.
 * Overflow (>100%) → orange rim + droplets above + warning tint on text.
 */
export default function MacroBowl({
  label,
  value,
  target,
  unit = 'g',
  color,
  width = 140,
  height = 170,
}: Props) {
  const pct = target > 0 ? value / target : 0;
  const clamped = Math.min(pct, 1);
  const isOverflow = pct > 1;
  const overflowG = Math.max(0, value - target);

  const waveX = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const droplet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveX, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [waveX]);

  useEffect(() => {
    Animated.spring(fill, {
      toValue: clamped,
      tension: 16,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [clamped, fill]);

  useEffect(() => {
    if (isOverflow) {
      Animated.loop(
        Animated.timing(droplet, {
          toValue: 1,
          duration: 1400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        })
      ).start();
    } else {
      droplet.setValue(0);
    }
  }, [isOverflow, droplet]);

  // Bowl interior box dims
  const bowlW = width - 8;
  const bowlH = height - 26;
  const waterHeight = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bowlH],
  });

  // Wave anim: shift horizontally by one wave length
  const waveLen = bowlW;
  const translateX = waveX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -waveLen],
  });

  // SVG wave path (2× length so translate seamless)
  const amp = 4;
  const wavePath = `
    M 0 ${amp}
    Q ${waveLen / 4} 0 ${waveLen / 2} ${amp}
    T ${waveLen} ${amp}
    T ${waveLen * 1.5} ${amp}
    T ${waveLen * 2} ${amp}
    L ${waveLen * 2} 100
    L 0 100
    Z
  `.trim();

  const rimColor = isOverflow ? Colors.warning : color;

  return (
    <View style={[styles.container, { width }]}>
      <View style={[styles.bowlWrap, { width, height }]}>
        {/* Bowl rim (top edge) */}
        <View
          style={[
            styles.rim,
            { width: bowlW, backgroundColor: rimColor, left: 4 },
          ]}
        />

        {/* Bowl interior — clips water */}
        <View
          style={[
            styles.bowlInterior,
            {
              width: bowlW,
              height: bowlH,
              left: 4,
              top: 14,
              backgroundColor: Colors.surface,
              borderColor: rimColor + '40',
            },
          ]}
        >
          {/* Animated water */}
          <Animated.View
            style={[
              styles.water,
              {
                height: waterHeight,
                backgroundColor: color + 'CC',
              },
            ]}
          >
            {/* Wave surface — SVG path animated */}
            <Animated.View
              style={[
                styles.waveOverlay,
                { width: waveLen * 2, transform: [{ translateX }] },
              ]}
            >
              <Svg
                width={waveLen * 2}
                height={20}
                viewBox={`0 0 ${waveLen * 2} 20`}
                style={{ position: 'absolute', top: -8 }}
              >
                <Defs>
                  <LinearGradient id={`wave-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={color} stopOpacity={0.9} />
                    <Stop offset="1" stopColor={color} stopOpacity={0.4} />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M 0 ${amp} Q ${waveLen / 4} 0 ${waveLen / 2} ${amp} T ${waveLen} ${amp} T ${waveLen * 1.5} ${amp} T ${waveLen * 2} ${amp} L ${waveLen * 2} 20 L 0 20 Z`}
                  fill={`url(#wave-${label})`}
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Center text overlay — always white w/ shadow for readability */}
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.value}>
            {Math.round(value)}
            <Text style={styles.unit}>{unit}</Text>
          </Text>
          <Text style={styles.target}>
            / {Math.round(target)}{unit}
          </Text>
          <View
            style={[
              styles.pctBadge,
              { backgroundColor: isOverflow ? Colors.warning : color },
            ]}
          >
            <Text style={styles.pctText}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>

        {/* Overflow droplets above bowl */}
        {isOverflow && (
          <View style={styles.droplets} pointerEvents="none">
            {[0.2, 0.5, 0.8].map((leftPct, i) => {
              const offset = (i * 0.33) % 1;
              const phase = Animated.modulo(Animated.add(droplet, offset), 1);
              const ty = phase.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -22],
              });
              const opacity = phase.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.droplet,
                    {
                      left: width * leftPct - 4,
                      backgroundColor: color,
                      transform: [{ translateY: ty }],
                      opacity,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      <Text style={[styles.label, isOverflow && { color: Colors.warning }]} numberOfLines={1}>
        {label}
      </Text>
      {isOverflow ? (
        <Text style={styles.overflowText}>+{Math.round(overflowG)}{unit}</Text>
      ) : (
        <Text style={styles.remainingText}>
          −{Math.round(target - value)}{unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  bowlWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  rim: {
    position: 'absolute',
    top: 12,
    height: 4,
    borderRadius: 2,
    zIndex: 3,
  },
  bowlInterior: {
    position: 'absolute',
    overflow: 'hidden',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    borderWidth: 2,
  },
  water: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  waveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 20,
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  unit: { fontSize: 12, fontWeight: '700' },
  target: {
    fontSize: 11,
    color: '#F1F5F9',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pctBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pctText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overflowText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '800',
    marginTop: 2,
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  droplets: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 4,
  },
  droplet: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 4,
    top: 6,
  },
});
