import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  size = 200,
  strokeWidth = 14,
}: CalorieRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(target, 1), 1);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const remaining = Math.max(target - consumed, 0);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.primary}
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
        <Text style={styles.labelText}>/ {target} kcal</Text>
        <Text style={styles.remainingText}>{remaining} restant</Text>
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
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  labelText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  remainingText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
