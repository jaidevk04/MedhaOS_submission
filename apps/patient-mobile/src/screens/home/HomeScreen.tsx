/**
 * Home Screen
 * Main dashboard for authenticated patients
 */

import React from 'react';
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
import { useAuthStore } from '@store/authStore';
import { QuickActionCard } from './components/QuickActionCard';
import { NotificationBadge } from './components/NotificationBadge';
import { HealthTipsCarousel } from './components/HealthTipsCarousel';
import { UpcomingAppointmentCard } from './components/UpcomingAppointmentCard';
import { MedicationReminderCard } from './components/MedicationReminderCard';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [notificationCount] = React.useState(2);

  const handleVoiceInput = () => {
    // Navigate to triage screen
    (navigation as any).navigate('Triage');
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // TODO: Navigate to respective screens
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E3F2FD', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.appName}>MedhaOS</Text>
          </View>
          <View style={styles.headerRight}>
            <NotificationBadge count={notificationCount} />
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
              <Text style={styles.profileName}>{user?.name?.split(' ')[0] || 'User'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Voice Input Section */}
          <View style={styles.voiceSection}>
            <Text style={styles.greeting}>
              Namaste, {user?.name?.split(' ')[0] || 'User'} 🙏
            </Text>
            <Text style={styles.voicePrompt}>Tell me your symptoms...</Text>
            
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.voiceButtonGradient}
              >
                <Text style={styles.voiceIcon}>🎤</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.voiceHint}>Tap to speak</Text>
            
            {/* Language Selector */}
            <View style={styles.languageSelector}>
              <TouchableOpacity style={styles.languageButton}>
                <Text style={styles.languageText}>हिंदी</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.languageButton, styles.languageButtonActive]}>
                <Text style={[styles.languageText, styles.languageTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.languageButton}>
                <Text style={styles.languageText}>ಕನ್ನಡ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.languageButton}>
                <Text style={styles.languageText}>தமிழ்</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                icon="📅"
                title="Book Appointment"
                onPress={() => handleQuickAction('book')}
              />
              <QuickActionCard
                icon="📋"
                title="My Records"
                onPress={() => handleQuickAction('records')}
              />
              <QuickActionCard
                icon="💊"
                title="Medications"
                onPress={() => handleQuickAction('medications')}
              />
              <QuickActionCard
                icon="🚨"
                title="Emergency"
                onPress={() => handleQuickAction('emergency')}
                variant="urgent"
              />
            </View>
          </View>

          {/* Upcoming Appointments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <UpcomingAppointmentCard
              date="Tomorrow, 10:00 AM"
              doctor="Dr. Anjali Verma"
              specialty="Cardiology"
              hospital="Apollo Hospital"
              distance="2.3 km"
            />
          </View>

          {/* Medication Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Reminders</Text>
            <MedicationReminderCard
              time="2:00 PM Today"
              medication="Clopidogrel 75mg"
            />
          </View>

          {/* Health Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Tips 💡</Text>
            <HealthTipsCarousel />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  menuIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  appName: {
    ...theme.typography.styles.h3,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.bold,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  profileIcon: {
    fontSize: 20,
  },
  profileName: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['2xl'],
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  greeting: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  voicePrompt: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  voiceButton: {
    marginBottom: theme.spacing.md,
  },
  voiceButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.large,
  },
  voiceIcon: {
    fontSize: 36,
  },
  voiceHint: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  languageButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  languageButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  languageText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  languageTextActive: {
    color: theme.colors.neutral[0],
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
