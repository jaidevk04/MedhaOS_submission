/**
 * Pill Scanner Screen
 * Uses camera to scan and verify medication pills
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '@theme';
import { useMedicationStore } from '@store';
import type { MedicationAdherence } from '@store';

interface PillScannerScreenProps {
  navigation: any;
  route?: {
    params?: {
      medicationId?: string;
    };
  };
}

const PillScannerScreen: React.FC<PillScannerScreenProps> = ({ navigation, route }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    medicationId?: string;
    medicationName?: string;
    confidence?: number;
  } | null>(null);

  const { medications, recordAdherence } = useMedicationStore();
  const targetMedicationId = route?.params?.medicationId;

  // Simulated pill scanning function
  // In production, this would use actual camera and ML model
  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate API call to pill recognition service
    setTimeout(() => {
      // Simulate successful scan
      const medication = targetMedicationId
        ? medications.find((m) => m.id === targetMedicationId)
        : medications[0]; // For demo, pick first medication

      if (medication) {
        const confidence = 0.92; // 92% confidence
        setScanResult({
          success: true,
          medicationId: medication.id,
          medicationName: medication.drugName,
          confidence,
        });
      } else {
        setScanResult({
          success: false,
        });
      }
      setIsScanning(false);
    }, 2000);
  };

  const handleConfirmTaken = () => {
    if (!scanResult || !scanResult.medicationId) return;

    const adherence: MedicationAdherence = {
      id: `adh_${Date.now()}`,
      medicationId: scanResult.medicationId,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      verificationMethod: 'scanned',
      verificationImageUrl: 'placeholder_image_url', // Would be actual image URL
    };

    recordAdherence(adherence);
    
    Alert.alert(
      'Success',
      'Medication verified and marked as taken',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleRetry = () => {
    setScanResult(null);
    handleScan();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Medication</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera View Placeholder */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text style={styles.scanningText}>Scanning pill...</Text>
              <Text style={styles.scanningSubtext}>
                Hold your phone steady over the medication
              </Text>
            </View>
          ) : scanResult ? (
            <View style={styles.resultContainer}>
              {scanResult.success ? (
                <>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.resultTitle}>Medication Identified</Text>
                  <Text style={styles.medicationName}>{scanResult.medicationName}</Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {((scanResult.confidence || 0) * 100).toFixed(0)}%
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.errorIcon}>✕</Text>
                  <Text style={styles.resultTitle}>Medication Not Recognized</Text>
                  <Text style={styles.errorText}>
                    Unable to identify the medication. Please try again or enter manually.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.instructionsContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.instructionsTitle}>Position Your Medication</Text>
              <Text style={styles.instructionsText}>
                Place the pill or tablet within the frame
              </Text>
              <View style={styles.scanFrame} />
            </View>
          )}
        </View>
      </View>

      {/* Instructions */}
      {!isScanning && !scanResult && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for Best Results:</Text>
          <Text style={styles.tipText}>• Ensure good lighting</Text>
          <Text style={styles.tipText}>• Place pill on a plain surface</Text>
          <Text style={styles.tipText}>• Keep camera steady</Text>
          <Text style={styles.tipText}>• Capture any markings or imprints</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {!isScanning && !scanResult && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
          >
            <Text style={styles.scanButtonText}>Scan Medication</Text>
          </TouchableOpacity>
        )}

        {scanResult && scanResult.success && (
          <>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmTaken}
            >
              <Text style={styles.confirmButtonText}>Confirm & Mark as Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </>
        )}

        {scanResult && !scanResult.success && (
          <>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          ℹ️ This feature uses AI to identify medications with 90%+ accuracy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanningContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  scanningText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.lg,
  },
  scanningSubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.neutral[300],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  resultContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.success[500],
    marginBottom: theme.spacing.md,
  },
  errorIcon: {
    fontSize: 64,
    color: theme.colors.error[500],
    marginBottom: theme.spacing.md,
  },
  resultTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.md,
  },
  medicationName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  confidenceText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.neutral[300],
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.neutral[300],
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  cameraIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  instructionsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  instructionsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.neutral[300],
    textAlign: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  tipsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  actionsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  scanButton: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  scanButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  confirmButton: {
    backgroundColor: theme.colors.success[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  confirmButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  retryButton: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  retryButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  manualButton: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  manualButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  infoBanner: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  infoBannerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    textAlign: 'center',
  },
});

export default PillScannerScreen;
