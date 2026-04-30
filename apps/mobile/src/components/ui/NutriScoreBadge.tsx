import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

type Score = 'A' | 'B' | 'C' | 'D' | 'E';

interface NutriScoreBadgeProps {
  score: Score;
  size?: 'sm' | 'md';
}

export default function NutriScoreBadge({ score, size = 'md' }: NutriScoreBadgeProps) {
  const bgColor = Colors.nutriScore[score];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bgColor },
      isSmall && styles.badgeSmall,
    ]}>
      <Text style={[styles.text, isSmall && styles.textSmall]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  textSmall: {
    fontSize: Theme.fontSize.xs,
  },
});
