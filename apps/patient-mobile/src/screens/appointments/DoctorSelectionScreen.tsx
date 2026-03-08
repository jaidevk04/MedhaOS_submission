/**
 * Doctor Selection Screen
 * Select doctor and available time slot
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { Doctor, TimeSlot } from '@types';
import { apiClient } from '@utils/api';

interface DoctorSelectionScreenProps {
  navigation: any;
  route: any;
}

export const DoctorSelectionScreen: React.FC<DoctorSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { facilityId, facilityName, urgencyScore } = route.params;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    // TODO: Fetch doctors from API
    // For now, using mock data
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        name: 'Dr. Anjali Verma',
        specialty: 'Cardiology',
        qualifications: ['MBBS', 'MD (Cardiology)', 'DM (Interventional Cardiology)'],
        experience: 15,
        rating: 4.8,
        consultationFee: 1500,
        languages: ['English', 'Hindi', 'Tamil'],
        availableSlots: [
          { id: '1', date: '2026-02-27', time: '10:00 AM', available: true },
          { id: '2', date: '2026-02-27', time: '11:00 AM', available: true },
          { id: '3', date: '2026-02-27', time: '02:00 PM', available: false },
          { id: '4', date: '2026-02-27', time: '03:00 PM', available: true },
          { id: '5', date: '2026-02-28', time: '10:00 AM', available: true },
          { id: '6', date: '2026-02-28', time: '11:00 AM', available: true },
        ],
      },
      {
        id: '2',
        name: 'Dr. Rajesh Kumar',
        specialty: 'General Medicine',
        qualifications: ['MBBS', 'MD (Internal Medicine)'],
        experience: 12,
        rating: 4.6,
        consultationFee: 1000,
        languages: ['English', 'Hindi', 'Telugu'],
        availableSlots: [
          { id: '7', date: '2026-02-27', time: '09:00 AM', available: true },
          { id: '8', date: '2026-02-27', time: '10:00 AM', available: true },
          { id: '9', date: '2026-02-27', time: '11:00 AM', available: true },
        ],
      },
      {
        id: '3',
        name: 'Dr. Priya Sharma',
        specialty: 'Cardiology',
        qualifications: ['MBBS', 'MD (Cardiology)'],
        experience: 10,
        rating: 4.7,
        consultationFee: 1200,
        languages: ['English', 'Hindi'],
        availableSlots: [
          { id: '10', date: '2026-02-27', time: '02:00 PM', available: true },
          { id: '11', date: '2026-02-27', time: '03:00 PM', available: true },
          { id: '12', date: '2026-02-27', time: '04:00 PM', available: true },
        ],
      },
    ];

    setDoctors(mockDoctors);
    setLoading(false);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    // Get unique dates from available slots
    const dates = [...new Set(doctor.availableSlots.map((slot) => slot.date))];
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedSlot(slot);
    }
  };

  const handleContinue = () => {
    if (selectedDoctor && selectedSlot) {
      navigation.navigate('AppointmentConfirmation', {
        facilityId,
        facilityName,
        doctor: selectedDoctor,
        slot: selectedSlot,
        urgencyScore,
      });
    }
  };

  const getAvailableDates = () => {
    if (!selectedDoctor) return [];
    return [...new Set(selectedDoctor.availableSlots.map((slot) => slot.date))];
  };

  const getSlotsForDate = (date: string) => {
    if (!selectedDoctor) return [];
    return selectedDoctor.availableSlots.filter((slot) => slot.date === date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
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
          <Text style={styles.headerTitle}>Select Doctor</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Facility Info */}
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>🏥 {facilityName}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Doctors List */}
            <Text style={styles.sectionTitle}>Available Doctors</Text>
            {doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={[
                  styles.doctorCard,
                  selectedDoctor?.id === doctor.id && styles.doctorCardSelected,
                ]}
                onPress={() => handleDoctorSelect(doctor)}
              >
                <View style={styles.doctorHeader}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarText}>
                      {doctor.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                    <View style={styles.doctorMeta}>
                      <Text style={styles.metaText}>⭐ {doctor.rating}</Text>
                      <Text style={styles.metaText}>•</Text>
                      <Text style={styles.metaText}>{doctor.experience} years exp</Text>
                    </View>
                  </View>
                  <View style={styles.feeContainer}>
                    <Text style={styles.feeLabel}>Fee</Text>
                    <Text style={styles.feeAmount}>₹{doctor.consultationFee}</Text>
                  </View>
                </View>

                <View style={styles.qualificationsContainer}>
                  {doctor.qualifications.map((qual, index) => (
                    <View key={index} style={styles.qualificationBadge}>
                      <Text style={styles.qualificationText}>{qual}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.languagesContainer}>
                  <Text style={styles.languagesLabel}>Languages: </Text>
                  <Text style={styles.languagesText}>
                    {doctor.languages.join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Time Slots */}
            {selectedDoctor && (
              <View style={styles.slotsSection}>
                <Text style={styles.sectionTitle}>Select Date & Time</Text>

                {/* Date Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateScroll}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {getAvailableDates().map((date) => (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateButton,
                        selectedDate === date && styles.dateButtonSelected,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          selectedDate === date && styles.dateTextSelected,
                        ]}
                      >
                        {formatDate(date)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time Slots */}
                <View style={styles.slotsGrid}>
                  {getSlotsForDate(selectedDate).map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotButton,
                        !slot.available && styles.slotButtonDisabled,
                        selectedSlot?.id === slot.id && styles.slotButtonSelected,
                      ]}
                      onPress={() => handleSlotSelect(slot)}
                      disabled={!slot.available}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          !slot.available && styles.slotTextDisabled,
                          selectedSlot?.id === slot.id && styles.slotTextSelected,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Continue Button */}
        {selectedDoctor && selectedSlot && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue to Confirmation</Text>
            </TouchableOpacity>
          </View>
        )}
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
  facilityInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  facilityName: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  doctorCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  doctorCardSelected: {
    borderColor: theme.colors.primary[500],
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  doctorAvatarText: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  doctorSpecialty: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.xs,
  },
  doctorMeta: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  feeContainer: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  feeAmount: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  qualificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  qualificationBadge: {
    backgroundColor: theme.colors.secondary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  qualificationText: {
    ...theme.typography.styles.caption,
    color: theme.colors.secondary[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languagesLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  languagesText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  slotsSection: {
    marginTop: theme.spacing.lg,
  },
  dateScroll: {
    marginBottom: theme.spacing.md,
  },
  dateScrollContent: {
    gap: theme.spacing.sm,
  },
  dateButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateButtonSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  dateText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dateTextSelected: {
    color: theme.colors.neutral[0],
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  slotButton: {
    width: '30%',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[0],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  slotButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
    opacity: 0.5,
  },
  slotButtonSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  slotText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  slotTextDisabled: {
    color: theme.colors.text.disabled,
  },
  slotTextSelected: {
    color: theme.colors.neutral[0],
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  continueButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  continueButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
