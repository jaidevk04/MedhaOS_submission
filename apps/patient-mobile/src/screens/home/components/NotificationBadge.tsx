/**
 * Notification Badge Component
 * Displays notification icon with count badge
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface NotificationBadgeProps {
  count: number;
  onPress?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: theme.spacing.xs,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neutral[0],
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
