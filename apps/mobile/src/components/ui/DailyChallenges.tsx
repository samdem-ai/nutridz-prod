import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface Challenge {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
  target: number;
  unit: string;
  color: string;
  completed: boolean;
}

interface DailyChallengesProps {
  challenges?: Challenge[];
}

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: '1', title: 'Boire 8 verres d\'eau', icon: 'water', progress: 5, target: 8, unit: '', color: Colors.water, completed: false },
  { id: '2', title: 'Manger 5 fruits/legumes', icon: 'nutrition', progress: 2, target: 5, unit: '', color: Colors.primary, completed: false },
  { id: '3', title: 'Atteindre objectif fibres', icon: 'leaf', progress: 18, target: 25, unit: 'g', color: Colors.macros.fibres, completed: false },
];

function ChallengeRow({ challenge }: { challenge: Challenge }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const ratio = Math.min(challenge.progress / challenge.target, 1);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: ratio,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  const barWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.row, challenge.completed && styles.rowCompleted]}>
      <View style={[styles.iconWrap, { backgroundColor: challenge.color + '20' }]}>
        {challenge.completed ? (
          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
        ) : (
          <Ionicons name={challenge.icon} size={18} color={challenge.color} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, challenge.completed && styles.titleCompleted]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Text style={[styles.progressText, { color: challenge.completed ? Colors.primary : challenge.color }]}>
            {challenge.progress}/{challenge.target}{challenge.unit}
          </Text>
        </View>
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, {
            width: barWidth,
            backgroundColor: challenge.completed ? Colors.primary : challenge.color,
          }]} />
        </View>
      </View>
    </View>
  );
}

export default function DailyChallenges({ challenges = DEFAULT_CHALLENGES }: DailyChallengesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={20} color={Colors.warning} />
        <Text style={styles.headerText}>Defis du jour</Text>
      </View>
      {challenges.map((c) => (
        <ChallengeRow key={c.id} challenge={c} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Theme.darkCard,
    gap: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  headerText: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  rowCompleted: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text,
    flex: 1,
  },
  titleCompleted: {
    color: Colors.textMuted,
  },
  progressText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    marginLeft: Theme.spacing.sm,
  },
  barBg: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
