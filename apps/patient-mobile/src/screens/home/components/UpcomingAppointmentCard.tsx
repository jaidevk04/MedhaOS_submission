/**
 * Upcoming Appointment Card Component
 * Displays next appointment details
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@theme';

interface UpcomingAppointmentCardProps {
  date: string;
  doctor: string;
  specialty: string;
  hospital: string;
  distance: string;
  onViewDetails?: () => void;
  onNavigate?: () => void;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  date,
  doctor,
  specialty,
  hospital,
  distance,
  onViewDetails,
  onNavigate,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.doctor}>{doctor} • {specialty}</Text>
        <Text style={styles.hospital}>{hospital}, {distance}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={onViewDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onNavigate}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Navigate</Text>
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
  date: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  doctor: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  hospital: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
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
    backgroundColor: theme.colors.primary[500],
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
