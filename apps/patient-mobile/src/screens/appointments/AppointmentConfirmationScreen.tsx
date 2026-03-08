/**
 * Appointment Confirmation Screen
 * Review and confirm appointment booking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { Doctor, TimeSlot } from '@types';
import { apiClient } from '@utils/api';

interface AppointmentConfirmationScreenProps {
  navigation: any;
  route: any;
}

export const AppointmentConfirmationScreen: React.FC<
  AppointmentConfirmationScreenProps
> = ({ navigation, route }) => {
  const { facilityId, facilityName, doctor, slot, urgencyScore } = route.params;
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConfirmAppointment = async () => {
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // TODO: Call API to book appointment
      const response = await apiClient.post('/appointments', {
        facilityId,
        doctorId: doctor.id,
        slotId: slot.id,
        urgencyScore,
      });

      if (response.success) {
        // Navigate to success screen or home
        Alert.alert(
          'Appointment Confirmed! ✅',
          `Your appointment with ${doctor.name} is confirmed for ${formatDate(slot.date)} at ${slot.time}`,
          [
            {
              text: 'View Appointments',
              onPress: () => navigation.navigate('Appointments'),
            },
            {
              text: 'Go Home',
              onPress: () => navigation.navigate('HomeScreen'),
            },
          ]
        );
      } else {
        Alert.alert('Booking Failed', response.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUrgencyColor = () => {
    if (!urgencyScore) return theme.colors.neutral[500];
    if (urgencyScore >= 70) return theme.colors.urgency.critical;
    if (urgencyScore >= 40) return theme.colors.urgency.urgent;
    return theme.colors.urgency.routine;
  };

  const getUrgencyLabel = () => {
    if (!urgencyScore) return 'Routine';
    if (urgencyScore >= 70) return 'High Priority';
    if (urgencyScore >= 40) return 'Moderate Priority';
    return 'Routine';
  };

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
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Appointment</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>📅</Text>
            </View>
            <Text style={styles.iconLabel}>Almost Done!</Text>
          </View>

          {/* Appointment Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Appointment Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Facility</Text>
              <Text style={styles.summaryValue}>🏥 {facilityName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor</Text>
              <View style={styles.doctorInfo}>
                <Text style={styles.summaryValue}>{doctor.name}</Text>
                <Text style={styles.summarySubtext}>{doctor.specialty}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <View style={styles.dateTimeInfo}>
                <Text style={styles.summaryValue}>{formatDate(slot.date)}</Text>
                <Text style={styles.summarySubtext}>⏰ {slot.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consultation Fee</Text>
              <Text style={styles.feeValue}>₹{doctor.consultationFee}</Text>
            </View>

            {urgencyScore && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Priority</Text>
                  <View
                    style={[
                      styles.urgencyBadge,
                      { backgroundColor: getUrgencyColor() },
                    ]}
                  >
                    <Text style={styles.urgencyText}>{getUrgencyLabel()}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Important Information */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>📋 Important Information</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                • Please arrive 15 minutes before your appointment time
              </Text>
              <Text style={styles.infoItem}>
                • Bring your ABHA card and any relevant medical records
              </Text>
              <Text style={styles.infoItem}>
                • Wear a mask and maintain social distancing
              </Text>
              <Text style={styles.infoItem}>
                • Cancellation must be done at least 2 hours in advance
              </Text>
            </View>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
              ]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>terms and conditions</Text> and{' '}
              <Text style={styles.termsLink}>cancellation policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Payment Information */}
          <View style={styles.paymentCard}>
            <Text style={styles.cardTitle}>💳 Payment</Text>
            <Text style={styles.paymentText}>
              Payment can be made at the facility after consultation
            </Text>
            <View style={styles.paymentMethods}>
              <Text style={styles.paymentMethod}>💵 Cash</Text>
              <Text style={styles.paymentMethod}>💳 Card</Text>
              <Text style={styles.paymentMethod}>📱 UPI</Text>
            </View>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!agreedToTerms || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmAppointment}
            disabled={!agreedToTerms || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.neutral[0]} />
            ) : (
              <Text style={styles.confirmButtonText}>
                Confirm Appointment
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.primary[600],
  },
  backText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  headerTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconText: {
    fontSize: 48,
  },
  iconLabel: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  cardTitle: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  summaryLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'right',
  },
  summarySubtext: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  doctorInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateTimeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  feeValue: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.bold,
  },
  urgencyBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  urgencyText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.info + '10',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  infoList: {
    gap: theme.spacing.sm,
  },
  infoItem: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  checkmark: {
    color: theme.colors.neutral[0],
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  termsText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  termsLink: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  paymentCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  paymentText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  paymentMethod: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  confirmButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: 16,
  },
});
