/**
 * Triage Result Screen
 * Display urgency score and recommendation with facility selection
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';

interface TriageResultScreenProps {
  navigation: any;
  route: any;
}

export const TriageResultScreen: React.FC<TriageResultScreenProps> = ({
  navigation,
  route,
}) => {
  const { urgencyScore, recommendation } = route.params;

  const getUrgencyColor = () => {
    if (urgencyScore >= 70) return theme.colors.urgency.critical;
    if (urgencyScore >= 40) return theme.colors.urgency.urgent;
    return theme.colors.urgency.routine;
  };

  const getUrgencyLabel = () => {
    if (urgencyScore >= 70) return 'HIGH RISK';
    if (urgencyScore >= 40) return 'MODERATE RISK';
    return 'LOW RISK';
  };

  const getRecommendationType = () => {
    if (urgencyScore >= 70) return 'Emergency Department (ED)';
    if (urgencyScore >= 40) return 'Outpatient Department (OPD)';
    return 'General Consultation';
  };

  const getPossibleConditions = () => {
    // Mock data - in real app, this would come from AI analysis
    if (urgencyScore >= 70) {
      return [
        'Cardiac event (chest pain)',
        'Requires urgent assessment',
        'Immediate medical attention needed',
      ];
    } else if (urgencyScore >= 40) {
      return [
        'Moderate symptoms requiring evaluation',
        'Specialist consultation recommended',
      ];
    } else {
      return ['Routine medical consultation', 'General health assessment'];
    }
  };

  const handleBookAppointment = () => {
    navigation.navigate('FacilitySelection', { urgencyScore });
  };

  const handleCallAmbulance = () => {
    // TODO: Implement emergency call functionality
    console.log('Calling ambulance...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Triage Complete</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Urgency Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>Urgency Score</Text>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: getUrgencyColor() },
              ]}
            >
              <Text style={[styles.scoreValue, { color: getUrgencyColor() }]}>
                {urgencyScore}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getUrgencyColor() },
              ]}
            >
              <Text style={styles.riskText}>{getUrgencyLabel()}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${urgencyScore}%`,
                      backgroundColor: getUrgencyColor(),
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0</Text>
                <Text style={styles.progressLabel}>100</Text>
              </View>
            </View>
          </View>

          {/* Recommendation Card */}
          <View style={styles.recommendationCard}>
            <Text style={styles.cardTitle}>⚠️ Recommendation</Text>
            <Text style={styles.recommendationText}>
              Based on your symptoms, we recommend{' '}
              <Text style={styles.recommendationHighlight}>
                {getRecommendationType()}
              </Text>{' '}
              evaluation.
            </Text>

            <View style={styles.conditionsContainer}>
              <Text style={styles.conditionsTitle}>Possible conditions:</Text>
              {getPossibleConditions().map((condition, index) => (
                <Text key={index} style={styles.conditionItem}>
                  • {condition}
                </Text>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          {urgencyScore >= 70 ? (
            <>
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={handleCallAmbulance}
              >
                <Text style={styles.emergencyButtonText}>
                  🚨 Call Ambulance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleBookAppointment}
              >
                <Text style={styles.primaryButtonText}>
                  Find Nearest Emergency Facility
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBookAppointment}
            >
              <Text style={styles.primaryButtonText}>
                Book Appointment
              </Text>
            </TouchableOpacity>
          )}

          {/* Important Note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>📋 Important Note</Text>
            <Text style={styles.noteText}>
              This is an AI-assisted assessment and should not replace
              professional medical advice. If you experience severe symptoms or
              feel your condition is worsening, please seek immediate medical
              attention.
            </Text>
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
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  scoreTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    ...theme.shadows.large,
  },
  scoreValue: {
    ...theme.typography.styles.h1,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: 56,
  },
  scoreMax: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.secondary,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  riskText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  recommendationCard: {
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
  recommendationText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  recommendationHighlight: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  conditionsContainer: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  conditionsTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  conditionItem: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
  },
  emergencyButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  emergencyButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  primaryButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: 16,
  },
  noteCard: {
    backgroundColor: theme.colors.warning + '10',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  noteTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
