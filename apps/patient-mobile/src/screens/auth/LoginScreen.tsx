/**
 * Login Screen
 * User login with phone number and OTP, with biometric authentication support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@navigation/types';
import { Button, Input } from '@components';
import { theme } from '@theme';
import { useAuthStore } from '@store';
import { apiClient, biometricAuth } from '@utils';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const login = useAuthStore((state) => state.login);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await biometricAuth.isAvailable();
    setBiometricAvailable(available);
  };

  const handleBiometricLogin = async () => {
    const result = await biometricAuth.authenticate('Login with biometrics');
    if (result.success) {
      // Mock biometric login - replace with actual API call
      // In production, you would retrieve stored credentials securely
      setLoading(true);
      try {
        const response = await apiClient.post('/auth/biometric-login', {});
        if (response.success && response.data) {
          login(response.data.user, response.data.token);
        }
      } catch (error) {
        setErrors({ general: 'Biometric login failed' });
      } finally {
        setLoading(false);
      }
    } else {
      setErrors({ general: result.error || 'Biometric authentication failed' });
    }
  };

  const validatePhone = (): boolean => {
    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrors({ phone: 'Please enter a valid 10-digit phone number' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    try {
      // Mock OTP send - replace with actual API call
      const response = await apiClient.post('/auth/send-otp', { phone });
      
      if (response.success) {
        setOtpSent(true);
        setErrors({});
      } else {
        setErrors({ general: response.error || 'Failed to send OTP' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'Please enter OTP' });
      return;
    }

    setLoading(true);
    try {
      // Mock OTP verification - replace with actual API call
      const response = await apiClient.post('/auth/verify-otp', { phone, otp });
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
      } else {
        setErrors({ general: response.error || 'Invalid OTP' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {otpSent
                ? 'Enter the OTP sent to your phone'
                : 'Login with your phone number'}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!otpSent}
            />

            {otpSent && (
              <Input
                label="OTP"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                error={errors.otp}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}

            {errors.general && (
              <Text style={styles.errorText}>{errors.general}</Text>
            )}

            {otpSent && (
              <Button
                title="Resend OTP"
                onPress={handleSendOTP}
                variant="text"
                size="small"
              />
            )}
          </View>

          {biometricAvailable && !otpSent && (
            <View style={styles.biometricSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.biometricIcon}>👆</Text>
                <Text style={styles.biometricText}>Login with Biometrics</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={otpSent ? 'Verify & Login' : 'Send OTP'}
            onPress={otpSent ? handleVerifyOTP : handleSendOTP}
            fullWidth
            size="large"
            loading={loading}
          />
          <Button
            title="Don't have an account? Register"
            onPress={() => navigation.navigate('Register')}
            variant="text"
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  biometricSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },
  biometricButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  biometricIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  biometricText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
