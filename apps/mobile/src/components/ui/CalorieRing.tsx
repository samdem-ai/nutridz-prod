import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export default function CalorieRing({
  consumed,
  target,
  size = 220,
  strokeWidth = 16,
}: CalorieRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(target, 1), 1);
  const remaining = Math.max(target - consumed, 0);
  const isOver = consumed > target;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: progress,
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isOver ? Colors.error : Colors.primary} />
            <Stop offset="1" stopColor={isOver ? '#F97316' : '#84CC16'} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={styles.consumedText}>{consumed}</Text>
        <Text style={styles.unitText}>kcal</Text>
        <View style={styles.remainingPill}>
          <Text style={[styles.remainingText, isOver && { color: Colors.error }]}>
            {isOver ? `+${consumed - target}` : `-${remaining}`} restant
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumedText: {
    fontSize: 36,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  unitText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  remainingPill: {
    marginTop: 8,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  remainingText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Theme.fontWeight.medium,
  },
});
