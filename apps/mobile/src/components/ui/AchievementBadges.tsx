import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export interface Badge {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  earned: boolean;
  description: string;
}

interface AchievementBadgesProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
}

const BADGE_COLORS: Record<string, string> = {
  flame: Colors.warning,
  nutrition: Colors.primary,
  water: Colors.info,
  restaurant: Colors.warning,
  camera: Colors.macros.proteines,
};

function getBadgeColor(icon: string): string {
  return BADGE_COLORS[icon] ?? Colors.primary;
}

export default function AchievementBadges({ badges, onBadgePress }: AchievementBadgesProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Succès</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {badges.map((badge) => {
          const color = getBadgeColor(badge.icon);
          return (
            <TouchableOpacity
              key={badge.id}
              style={styles.badgeItem}
              activeOpacity={0.7}
              onPress={() => onBadgePress?.(badge)}
            >
              <View style={[
                styles.iconCircle,
                badge.earned
                  ? { backgroundColor: color + '22', borderColor: color }
                  : { backgroundColor: Colors.surfaceLight, borderColor: Colors.surfaceBorder },
              ]}>
                <Ionicons
                  name={badge.earned ? badge.icon : 'lock-closed'}
                  size={24}
                  color={badge.earned ? color : Colors.textMuted}
                />
              </View>
              <Text
                style={[styles.title, { color: badge.earned ? Colors.text : Colors.textMuted }]}
                numberOfLines={1}
              >
                {badge.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...Theme.darkCard,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  heading: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  scroll: {
    gap: Theme.spacing.lg,
  },
  badgeItem: {
    alignItems: 'center',
    width: 68,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    textAlign: 'center',
  },
});
