/**
 * Recovery Plan Screen
 * Timeline view of recovery phases with progress tracking
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { useRecoveryStore } from '@store/recoveryStore';
import { sampleRecoveryPlan } from '@utils/sampleRecoveryData';
import { RecoveryPhaseCard } from './components/RecoveryPhaseCard';
import { ProgressOverview } from './components/ProgressOverview';
import { UpcomingMilestonesCard } from './components/UpcomingMilestonesCard';

interface RecoveryPlanScreenProps {
  navigation: any;
}

export const RecoveryPlanScreen: React.FC<RecoveryPlanScreenProps> = ({ navigation }) => {
  const { recoveryPlan, setRecoveryPlan, calculateOverallProgress } = useRecoveryStore();

  useEffect(() => {
    // Initialize with sample data
    if (!recoveryPlan) {
      setRecoveryPlan(sampleRecoveryPlan);
    }
  }, []);

  if (!recoveryPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recovery plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recovery Plan</Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('RecoveryChat')}
          >
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Condition Banner */}
          <View style={styles.conditionBanner}>
            <Text style={styles.conditionTitle}>{recoveryPlan.condition}</Text>
            <Text style={styles.dischargeDate}>
              Discharged: {new Date(recoveryPlan.dischargeDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Progress Overview */}
          <ProgressOverview progress={overallProgress} />

          {/* Upcoming Milestones */}
          <UpcomingMilestonesCard navigation={navigation} />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EducationalContent')}
            >
              <Text style={styles.actionIcon}>🎥</Text>
              <Text style={styles.actionText}>Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('RecoveryChat')}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Ask Question</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Navigate to appointments or emergency contacts
              }}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Emergency</Text>
            </TouchableOpacity>
          </View>

          {/* Recovery Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery Timeline</Text>
            <View style={styles.timeline}>
              {recoveryPlan.phases.map((phase, index) => (
                <RecoveryPhaseCard
                  key={phase.id}
                  phase={phase}
                  isLast={index === recoveryPlan.phases.length - 1}
                  onPress={() =>
                    navigation.navigate('PhaseDetail', { phaseId: phase.id })
                  }
                />
              ))}
            </View>
          </View>

          {/* Follow-up Appointments */}
          {recoveryPlan.followUpAppointments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              {recoveryPlan.followUpAppointments
                .filter((appt) => appt.status === 'scheduled')
                .map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentIcon}>📅</Text>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentDate}>
                          {new Date(appointment.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          • {appointment.time}
                        </Text>
                        <Text style={styles.appointmentDoctor}>
                          {appointment.doctor} • {appointment.specialty}
                        </Text>
                        <Text style={styles.appointmentPurpose}>
                          {appointment.purpose}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {recoveryPlan.emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactCard}
                onPress={() => {
                  // Handle phone call
                }}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                {contact.available24x7 && (
                  <View style={styles.available24x7Badge}>
                    <Text style={styles.available24x7Text}>24×7</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  chatButton: {
    padding: theme.spacing.xs,
  },
  chatIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['2xl'],
  },
  conditionBanner: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  conditionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  dischargeDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
    minWidth: 100,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  actionText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  timeline: {
    gap: theme.spacing.md,
  },
  appointmentCard: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  appointmentHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  appointmentIcon: {
    fontSize: 24,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  appointmentDoctor: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  appointmentPurpose: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  contactRole: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  contactPhone: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  available24x7Badge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  available24x7Text: {
    ...theme.typography.styles.caption,
    color: theme.colors.success[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
});
