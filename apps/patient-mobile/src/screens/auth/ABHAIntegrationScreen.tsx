/**
 * ABHA Integration Screen
 * Link or create ABHA (Ayushman Bharat Health Account) ID
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@navigation/types';
import { Button, Input } from '@components';
import { theme } from '@theme';
import { useAuthStore } from '@store';
import { apiClient } from '@utils';

type Props = NativeStackScreenProps<AuthStackParamList, 'ABHAIntegration'>;

export const ABHAIntegrationScreen: React.FC<Props> = ({ navigation }) => {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [abhaId, setAbhaId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkABHA = async () => {
    if (!abhaId.trim()) {
      setError('Please enter your ABHA ID');
      return;
    }

    setLoading(true);
    try {
      // Mock ABHA linking - replace with actual ABDM API integration
      const response = await apiClient.post('/auth/link-abha', { abhaId });
      
      if (response.success) {
        updateUser({ abhaId });
        // Navigation will be handled by RootNavigator based on auth state
      } else {
        setError(response.error || 'Failed to link ABHA ID');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // User can skip ABHA integration and link it later
    // Navigation will be handled by RootNavigator
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏥</Text>
          </View>
          <Text style={styles.title}>Link Your ABHA ID</Text>
          <Text style={styles.subtitle}>
            Connect your Ayushman Bharat Health Account to access your health records across India
          </Text>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Benefits of linking ABHA:</Text>
          <BenefitItem text="Access health records from any hospital" />
          <BenefitItem text="Share records securely with doctors" />
          <BenefitItem text="Faster registration at healthcare facilities" />
          <BenefitItem text="Digital prescriptions and lab reports" />
        </View>

        <View style={styles.form}>
          <Input
            label="ABHA ID"
            placeholder="Enter your 14-digit ABHA ID"
            value={abhaId}
            onChangeText={setAbhaId}
            error={error}
            keyboardType="number-pad"
            maxLength={14}
          />

          <Text style={styles.helpText}>
            Don't have an ABHA ID?{' '}
            <Text style={styles.link}>Create one now</Text>
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Link ABHA ID"
          onPress={handleLinkABHA}
          fullWidth
          size="large"
          loading={loading}
        />
        <Button
          title="Skip for now"
          onPress={handleSkip}
          variant="text"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const BenefitItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitIcon}>✓</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  benefits: {
    marginVertical: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  benefitsTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  benefitIcon: {
    color: theme.colors.success,
    fontSize: 18,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  benefitText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  helpText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  link: {
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
