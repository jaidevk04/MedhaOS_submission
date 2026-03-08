/**
 * Medication Detail Screen
 * Shows detailed information about a specific medication including reminders and adherence
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '@theme';
import { useMedicationStore } from '@store';
import type { MedicationAdherence } from '@store';

interface MedicationDetailScreenProps {
  navigation: any;
  route: {
    params: {
      medicationId: string;
    };
  };
}

const MedicationDetailScreen: React.FC<MedicationDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { medicationId } = route.params;
  const {
    medications,
    getAdherenceForMedication,
    getAdherenceRate,
    recordAdherence,
    updateMedication,
  } = useMedicationStore();

  const medication = medications.find((med) => med.id === medicationId);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(7);

  if (!medication) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Medication not found</Text>
      </View>
    );
  }

  const adherenceHistory = getAdherenceForMedication(medicationId, selectedPeriod);
  const adherenceRate = getAdherenceRate(medicationId, selectedPeriod);

  const handleMarkAsTaken = () => {
    const adherence: MedicationAdherence = {
      id: `adh_${Date.now()}`,
      medicationId: medication.id,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      verificationMethod: 'manual',
    };
    recordAdherence(adherence);
    Alert.alert('Success', 'Medication marked as taken');
  };

  const handleScanPill = () => {
    navigation.navigate('PillScanner', { medicationId: medication.id });
  };

  const handleManageReminders = () => {
    navigation.navigate('ReminderSetup', { medicationId: medication.id });
  };

  const renderAdherenceItem = (item: MedicationAdherence) => {
    const date = new Date(item.scheduledTime);
    const statusColors = {
      taken: theme.colors.success[500],
      missed: theme.colors.error[500],
      skipped: theme.colors.neutral[400],
      pending: theme.colors.warning[500],
    };

    return (
      <View key={item.id} style={styles.adherenceItem}>
        <View style={styles.adherenceDate}>
          <Text style={styles.adherenceDateText}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.adherenceTimeText}>
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.adherenceStatus, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.adherenceStatusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        {item.verificationMethod === 'scanned' && (
          <Text style={styles.verificationBadge}>✓ Verified</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Medication Info */}
      <View style={styles.section}>
        <Text style={styles.medicationName}>{medication.drugName}</Text>
        {medication.genericName && (
          <Text style={styles.genericName}>({medication.genericName})</Text>
        )}
        <View style={styles.dosageContainer}>
          <Text style={styles.dosageText}>{medication.dosage}</Text>
          <Text style={styles.frequencyText}>{medication.frequency}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleMarkAsTaken}>
          <Text style={styles.actionButtonIcon}>✓</Text>
          <Text style={styles.actionButtonText}>Mark as Taken</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanPill}>
          <Text style={styles.actionButtonIcon}>📷</Text>
          <Text style={styles.actionButtonText}>Scan Pill</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      {medication.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>{medication.instructions}</Text>
        </View>
      )}

      {/* Purpose */}
      {medication.purpose && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose</Text>
          <Text style={styles.infoText}>{medication.purpose}</Text>
        </View>
      )}

      {/* Prescribed By */}
      {medication.prescribedBy && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prescribed by:</Text>
          <Text style={styles.infoValue}>{medication.prescribedBy}</Text>
        </View>
      )}

      {/* Duration */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Duration:</Text>
        <Text style={styles.infoValue}>
          {new Date(medication.startDate).toLocaleDateString()} -{' '}
          {medication.endDate ? new Date(medication.endDate).toLocaleDateString() : 'Ongoing'}
        </Text>
      </View>

      {/* Reminders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <TouchableOpacity onPress={handleManageReminders}>
            <Text style={styles.manageLink}>Manage</Text>
          </TouchableOpacity>
        </View>
        {medication.reminders.length > 0 ? (
          medication.reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <Text style={styles.reminderTime}>{reminder.time}</Text>
              <Text style={[
                styles.reminderStatus,
                reminder.enabled ? styles.reminderEnabled : styles.reminderDisabled
              ]}>
                {reminder.enabled ? 'Active' : 'Inactive'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noRemindersText}>No reminders set</Text>
        )}
      </View>

      {/* Adherence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adherence Tracking</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 7 && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(7)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 7 && styles.periodButtonTextActive
            ]}>
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 30 && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(30)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 30 && styles.periodButtonTextActive
            ]}>
              30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Adherence Rate */}
        <View style={styles.adherenceRateContainer}>
          <Text style={styles.adherenceRateLabel}>Adherence Rate</Text>
          <Text style={[
            styles.adherenceRateValue,
            adherenceRate >= 80 ? styles.adherenceGood :
            adherenceRate >= 60 ? styles.adherenceWarning :
            styles.adherencePoor
          ]}>
            {adherenceRate}%
          </Text>
        </View>

        {/* Adherence History */}
        <View style={styles.adherenceHistory}>
          {adherenceHistory.length > 0 ? (
            adherenceHistory.slice(0, 10).map(renderAdherenceItem)
          ) : (
            <Text style={styles.noHistoryText}>No adherence history yet</Text>
          )}
        </View>
      </View>

      {/* Side Effects */}
      {medication.sideEffects && medication.sideEffects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possible Side Effects</Text>
          {medication.sideEffects.map((effect, index) => (
            <Text key={index} style={styles.sideEffectText}>• {effect}</Text>
          ))}
        </View>
      )}

      {/* Refill Information */}
      {medication.refillDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refill Information</Text>
          <View style={styles.refillInfo}>
            <Text style={styles.infoLabel}>Next refill date:</Text>
            <Text style={styles.infoValue}>
              {new Date(medication.refillDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.refillInfo}>
            <Text style={styles.infoLabel}>Refill reminders:</Text>
            <Text style={styles.infoValue}>
              {medication.refillReminder ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.medium,
  },
  medicationName: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  genericName: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dosageText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  frequencyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  actionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  manageLink: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.medium,
  },
  instructionsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  infoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  reminderTime: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  reminderStatus: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  reminderEnabled: {
    color: theme.colors.success[600],
  },
  reminderDisabled: {
    color: theme.colors.neutral[400],
  },
  noRemindersText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  periodButton: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  adherenceRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  adherenceRateLabel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  adherenceRateValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  adherenceGood: {
    color: theme.colors.success[600],
  },
  adherenceWarning: {
    color: theme.colors.warning[600],
  },
  adherencePoor: {
    color: theme.colors.error[600],
  },
  adherenceHistory: {
    gap: theme.spacing.sm,
  },
  adherenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  adherenceDate: {
    flex: 1,
  },
  adherenceDateText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  adherenceTimeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  adherenceStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  adherenceStatusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  verificationBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  noHistoryText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  sideEffectText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  refillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error[500],
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});

export default MedicationDetailScreen;
