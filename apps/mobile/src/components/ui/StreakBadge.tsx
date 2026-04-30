import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface StreakBadgeProps {
  days: number;
  compact?: boolean;
}

export default function StreakBadge({ days, compact = false }: StreakBadgeProps) {
  const isActive = days > 0;
  const isMilestone = days >= 7;

  if (compact) {
    return (
      <View style={[styles.compactContainer, isActive && styles.compactActive]}>
        <Ionicons name="flame" size={16} color={isActive ? Colors.warning : Colors.textMuted} />
        <Text style={[styles.compactText, { color: isActive ? Colors.warning : Colors.textMuted }]}>
          {days}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMilestone && styles.milestoneContainer]}>
      <View style={[styles.flameCircle, isActive && styles.flameCircleActive]}>
        <Ionicons
          name="flame"
          size={22}
          color={isActive ? '#FFF' : Colors.textMuted}
        />
      </View>
      <View>
        <Text style={[styles.days, { color: isActive ? Colors.warning : Colors.textMuted }]}>
          {days} jour{days !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.label}>serie en cours</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 10,
  },
  milestoneContainer: {
    borderColor: Colors.warning + '40',
    backgroundColor: Colors.warning + '10',
  },
  flameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameCircleActive: {
    backgroundColor: Colors.warning,
  },
  days: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
  },
  label: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 4,
  },
  compactActive: {
    borderColor: Colors.warning + '40',
    backgroundColor: Colors.warning + '10',
  },
  compactText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
});
