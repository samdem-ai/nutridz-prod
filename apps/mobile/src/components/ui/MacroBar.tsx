import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  icon?: string;
  unit?: string;
}

export default function MacroBar({
  label,
  current,
  target,
  color,
  unit = 'g',
}: MacroBarProps) {
  const progress = Math.min(current / Math.max(target, 1), 1);
  const remaining = Math.max(target - current, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>
          <Text style={{ color }}>{Math.round(current)}</Text>
          <Text style={styles.target}>/{target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.remaining}>
        {remaining > 0 ? `${Math.round(remaining)}${unit} restant` : 'Objectif atteint!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    fontWeight: Theme.fontWeight.medium,
  },
  value: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    fontWeight: Theme.fontWeight.semibold,
  },
  target: {
    color: Colors.textMuted,
    fontWeight: Theme.fontWeight.regular,
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  remaining: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
});
