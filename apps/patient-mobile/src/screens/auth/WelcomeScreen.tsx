/**
 * Welcome Screen
 * Initial screen with language selection and app introduction
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@navigation/types';
import { Button } from '@components';
import { theme } from '@theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Illustration */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>MedhaOS</Text>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to MedhaOS</Text>
          <Text style={styles.subtitle}>
            Your healthcare companion for better health outcomes
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="🗣️"
            text="Speak in your language"
          />
          <FeatureItem
            icon="🏥"
            text="Smart appointment booking"
          />
          <FeatureItem
            icon="💊"
            text="Medication reminders"
          />
          <FeatureItem
            icon="📱"
            text="Access health records anytime"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('LanguageSelection')}
          fullWidth
          size="large"
        />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
          variant="text"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...theme.typography.styles.h2,
    color: theme.colors.neutral[0],
  },
  textContainer: {
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  features: {
    marginTop: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  featureText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
});
