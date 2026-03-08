/**
 * Quick Action Card Component
 * Displays a quick action button with icon and title
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';

interface QuickActionCardProps {
  icon: string;
  title: string;
  onPress: () => void;
  variant?: 'default' | 'urgent';
  style?: ViewStyle;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  onPress,
  variant = 'default',
  style,
}) => {
  const gradientColors = variant === 'urgent' 
    ? ['#F093FB', '#F5576C'] 
    : ['#FFFFFF', '#F5F5F5'];

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[
          styles.title,
          variant === 'urgent' && styles.titleUrgent
        ]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  icon: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  titleUrgent: {
    color: theme.colors.neutral[0],
  },
});
