import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface StreakBadgeProps {
  days: number;
}

export default function StreakBadge({ days }: StreakBadgeProps) {
  const isActive = days > 0;

  return (
    <View style={[
      styles.container,
      isActive && Theme.glow.subtle,
    ]}>
      <Ionicons
        name="flame"
        size={18}
        color={isActive ? Colors.warning : Colors.textMuted}
      />
      <Text style={[
        styles.text,
        { color: isActive ? Colors.warning : Colors.textMuted },
      ]}>
        {days}j
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  text: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
});
