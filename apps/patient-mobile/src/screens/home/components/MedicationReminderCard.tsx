/**
 * Medication Reminder Card Component
 * Displays upcoming medication reminder
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@theme';

interface MedicationReminderCardProps {
  time: string;
  medication: string;
  onMarkTaken?: () => void;
  onSnooze?: () => void;
}

export const MedicationReminderCard: React.FC<MedicationReminderCardProps> = ({
  time,
  medication,
  onMarkTaken,
  onSnooze,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>⏰</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      
      <Text style={styles.medication}>{medication}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={onSnooze}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Snooze</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onMarkTaken}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Mark as Taken</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  time: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  medication: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonTextPrimary: {
    color: theme.colors.neutral[0],
  },
});
