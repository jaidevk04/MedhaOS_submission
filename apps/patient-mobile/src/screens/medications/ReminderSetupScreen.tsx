/**
 * Reminder Setup Screen
 * Configure medication reminders with time and frequency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { theme } from '@theme';
import { useMedicationStore } from '@store';
import type { MedicationReminder } from '@store';

interface ReminderSetupScreenProps {
  navigation: any;
  route: {
    params: {
      medicationId: string;
    };
  };
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', name: 'Sunday' },
  { id: 1, label: 'Mon', name: 'Monday' },
  { id: 2, label: 'Tue', name: 'Tuesday' },
  { id: 3, label: 'Wed', name: 'Wednesday' },
  { id: 4, label: 'Thu', name: 'Thursday' },
  { id: 5, label: 'Fri', name: 'Friday' },
  { id: 6, label: 'Sat', name: 'Saturday' },
];

const PRESET_TIMES = [
  { label: 'Morning', time: '08:00' },
  { label: 'Afternoon', time: '14:00' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '22:00' },
];

const ReminderSetupScreen: React.FC<ReminderSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const { medicationId } = route.params;
  const { medications, addReminder, updateReminder, deleteReminder, toggleReminder } =
    useMedicationStore();

  const medication = medications.find((med) => med.id === medicationId);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderDays, setNewReminderDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri

  if (!medication) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Medication not found</Text>
      </View>
    );
  }

  const handleAddReminder = () => {
    if (newReminderDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    const reminder: MedicationReminder = {
      id: `rem_${Date.now()}`,
      medicationId: medication.id,
      time: newReminderTime,
      enabled: true,
      days: newReminderDays,
    };

    addReminder(medicationId, reminder);
    setIsAddingNew(false);
    setNewReminderTime('08:00');
    setNewReminderDays([1, 2, 3, 4, 5]);
    Alert.alert('Success', 'Reminder added successfully');
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReminder(medicationId, reminderId),
        },
      ]
    );
  };

  const toggleDay = (dayId: number) => {
    setNewReminderDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const renderReminderItem = (reminder: MedicationReminder) => {
    const selectedDays = DAYS_OF_WEEK.filter((day) => reminder.days.includes(day.id));
    const daysText =
      selectedDays.length === 7
        ? 'Every day'
        : selectedDays.length === 5 &&
          !reminder.days.includes(0) &&
          !reminder.days.includes(6)
        ? 'Weekdays'
        : selectedDays.map((d) => d.label).join(', ');

    return (
      <View key={reminder.id} style={styles.reminderItem}>
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderTime}>{reminder.time}</Text>
          <Text style={styles.reminderDays}>{daysText}</Text>
        </View>
        <View style={styles.reminderActions}>
          <Switch
            value={reminder.enabled}
            onValueChange={() => toggleReminder(medicationId, reminder.id)}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.primary[500],
            }}
            thumbColor={theme.colors.background.primary}
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReminder(reminder.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Medication Reminders</Text>
      <Text style={styles.medicationName}>{medication.drugName}</Text>

      {/* Existing Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Reminders</Text>
        {medication.reminders.length > 0 ? (
          medication.reminders.map(renderReminderItem)
        ) : (
          <Text style={styles.noRemindersText}>No reminders set yet</Text>
        )}
      </View>

      {/* Add New Reminder */}
      {!isAddingNew ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingNew(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Reminder</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.newReminderContainer}>
          <Text style={styles.sectionTitle}>New Reminder</Text>

          {/* Preset Times */}
          <View style={styles.presetsContainer}>
            <Text style={styles.label}>Quick Select:</Text>
            <View style={styles.presetButtons}>
              {PRESET_TIMES.map((preset) => (
                <TouchableOpacity
                  key={preset.time}
                  style={[
                    styles.presetButton,
                    newReminderTime === preset.time && styles.presetButtonActive,
                  ]}
                  onPress={() => setNewReminderTime(preset.time)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      newReminderTime === preset.time && styles.presetButtonTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.presetTimeText,
                      newReminderTime === preset.time && styles.presetTimeTextActive,
                    ]}
                  >
                    {preset.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Time */}
          <View style={styles.timeContainer}>
            <Text style={styles.label}>Selected Time:</Text>
            <Text style={styles.selectedTime}>{newReminderTime}</Text>
          </View>

          {/* Days Selection */}
          <View style={styles.daysContainer}>
            <Text style={styles.label}>Repeat on:</Text>
            <View style={styles.daysButtons}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    newReminderDays.includes(day.id) && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      newReminderDays.includes(day.id) && styles.dayButtonTextActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsAddingNew(false);
                setNewReminderTime('08:00');
                setNewReminderDays([1, 2, 3, 4, 5]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddReminder}
            >
              <Text style={styles.saveButtonText}>Save Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📱 Reminder Notifications</Text>
        <Text style={styles.infoText}>
          You'll receive notifications at the scheduled times via:
        </Text>
        <Text style={styles.infoItem}>• Push notifications</Text>
        <Text style={styles.infoItem}>• SMS (if enabled)</Text>
        <Text style={styles.infoItem}>• WhatsApp (if enabled)</Text>
      </View>
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
    marginBottom: theme.spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.medium,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  medicationName: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  reminderDays: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  noRemindersText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  addButton: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  newReminderContainer: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  presetsContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  presetButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  presetButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  presetTimeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  presetTimeTextActive: {
    color: theme.colors.text.inverse,
  },
  timeContainer: {
    marginBottom: theme.spacing.lg,
  },
  selectedTime: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
  },
  daysContainer: {
    marginBottom: theme.spacing.lg,
  },
  daysButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dayButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  dayButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  saveButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  infoSection: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    marginLeft: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error[500],
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});

export default ReminderSetupScreen;
