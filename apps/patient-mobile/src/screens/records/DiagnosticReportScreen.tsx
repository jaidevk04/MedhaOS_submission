/**
 * Diagnostic Report Screen
 * Displays detailed diagnostic reports with AI analysis and medical imaging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordsStackParamList } from '@/navigation/types';

type DiagnosticReportRouteProp = RouteProp<RecordsStackParamList, 'DiagnosticReport'>;

const { width } = Dimensions.get('window');

interface DiagnosticReport {
  id: string;
  patientId: string;
  reportType: 'radiology' | 'laboratory' | 'pathology';
  modality: string;
  date: string;
  facility: string;
  radiologist?: string;
  findings: string[];
  aiAnalysis?: {
    anomaliesDetected: Array<{
      type: string;
      location: string;
      confidence: number;
      severity: 'critical' | 'moderate' | 'minor';
    }>;
    draftReport: string;
    processingTimeSeconds: number;
  };
  radiologistReport: string;
  images?: string[];
  labResults?: Array<{
    test: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'high' | 'low';
  }>;
}

// Mock data
const mockReports: Record<string, DiagnosticReport> = {
  '2': {
    id: '2',
    patientId: 'patient-1',
    reportType: 'radiology',
    modality: 'ECG',
    date: '2026-02-15',
    facility: 'Apollo Hospital',
    radiologist: 'Dr. Rajesh Kumar',
    findings: [
      'Normal sinus rhythm',
      'Heart rate: 72 bpm',
      'No ST elevation or depression',
      'No T-wave abnormalities',
      'Normal QRS duration',
    ],
    aiAnalysis: {
      anomaliesDetected: [],
      draftReport: 'AI Analysis: Normal 12-lead ECG. No acute ischemic changes detected. Regular rhythm with normal intervals.',
      processingTimeSeconds: 3.2,
    },
    radiologistReport: `12-LEAD ELECTROCARDIOGRAM REPORT

CLINICAL INDICATION:
Routine cardiac assessment for patient with history of myocardial infarction.

TECHNIQUE:
Standard 12-lead ECG performed at rest.

FINDINGS:
- Rate: 72 beats per minute
- Rhythm: Normal sinus rhythm
- Axis: Normal (approximately +60 degrees)
- PR Interval: 160 milliseconds (normal)
- QRS Duration: 90 milliseconds (normal)
- QT/QTc Interval: 400/420 milliseconds (normal)
- P waves: Normal morphology in all leads
- QRS complexes: Normal morphology
- ST segments: No elevation or depression
- T waves: Normal morphology, no inversion

IMPRESSION:
Normal 12-lead electrocardiogram. No evidence of acute ischemia, previous infarction, or conduction abnormalities.

RECOMMENDATION:
Continue current cardiac management. No immediate concerns identified.`,
    images: [
      'https://via.placeholder.com/400x300/667EEA/FFFFFF?text=ECG+Lead+I-III',
      'https://via.placeholder.com/400x300/764BA2/FFFFFF?text=ECG+Lead+aVR-aVF',
      'https://via.placeholder.com/400x300/11998E/FFFFFF?text=ECG+Lead+V1-V6',
    ],
  },
  '3': {
    id: '3',
    patientId: 'patient-1',
    reportType: 'laboratory',
    modality: 'Blood Test',
    date: '2026-02-10',
    facility: 'Apollo Diagnostics',
    findings: [
      'Lipid profile within acceptable range',
      'LDL cholesterol slightly elevated',
      'HDL cholesterol low',
    ],
    radiologistReport: `LIPID PROFILE REPORT

CLINICAL INDICATION:
Monitoring for patient on statin therapy with history of CAD.

SPECIMEN:
Fasting blood sample collected on 10-Feb-2026 at 08:00 AM.

RESULTS:
See detailed results below.

INTERPRETATION:
Lipid profile shows LDL cholesterol slightly above target for high-risk cardiac patient. HDL cholesterol is suboptimal. Triglycerides are within normal range.

RECOMMENDATION:
Consider increasing statin dose. Encourage lifestyle modifications including regular exercise and dietary changes to improve HDL levels.`,
    labResults: [
      {
        test: 'Total Cholesterol',
        value: '185',
        unit: 'mg/dL',
        referenceRange: '< 200',
        status: 'normal',
      },
      {
        test: 'LDL Cholesterol',
        value: '110',
        unit: 'mg/dL',
        referenceRange: '< 100 (for high-risk)',
        status: 'high',
      },
      {
        test: 'HDL Cholesterol',
        value: '45',
        unit: 'mg/dL',
        referenceRange: '> 60',
        status: 'low',
      },
      {
        test: 'Triglycerides',
        value: '150',
        unit: 'mg/dL',
        referenceRange: '< 150',
        status: 'normal',
      },
      {
        test: 'VLDL Cholesterol',
        value: '30',
        unit: 'mg/dL',
        referenceRange: '< 30',
        status: 'normal',
      },
      {
        test: 'TC/HDL Ratio',
        value: '4.1',
        unit: '',
        referenceRange: '< 5.0',
        status: 'normal',
      },
    ],
  },
};

const SeverityBadge: React.FC<{ severity: 'critical' | 'moderate' | 'minor' }> = ({ severity }) => {
  const colors = {
    critical: { bg: '#FFF1F0', text: '#FF4D4F', border: '#FFCCC7' },
    moderate: { bg: '#FFF7E6', text: '#FAAD14', border: '#FFD591' },
    minor: { bg: '#F6FFED', text: '#52C41A', border: '#B7EB8F' },
  };

  const color = colors[severity];

  return (
    <View style={[styles.severityBadge, { backgroundColor: color.bg, borderColor: color.border }]}>
      <Text style={[styles.severityText, { color: color.text }]}>
        {severity.toUpperCase()}
      </Text>
    </View>
  );
};

const LabResultRow: React.FC<{ result: DiagnosticReport['labResults'][0] }> = ({ result }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return '#FF4D4F';
      case 'low': return '#FAAD14';
      default: return '#52C41A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return '⬆️';
      case 'low': return '⬇️';
      default: return '✓';
    }
  };

  return (
    <View style={styles.labResultRow}>
      <View style={styles.labResultHeader}>
        <Text style={styles.labTestName}>{result.test}</Text>
        <View style={[styles.labStatusBadge, { backgroundColor: `${getStatusColor(result.status)}15` }]}>
          <Text style={[styles.labStatusText, { color: getStatusColor(result.status) }]}>
            {getStatusIcon(result.status)} {result.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.labResultDetails}>
        <Text style={styles.labResultValue}>
          {result.value} {result.unit}
        </Text>
        <Text style={styles.labResultRange}>
          Reference: {result.referenceRange}
        </Text>
      </View>
    </View>
  );
};

export const DiagnosticReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DiagnosticReportRouteProp>();
  const { reportId } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const report = mockReports[reportId];

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Report not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.errorButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#11998E', '#38EF7D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnostic Report</Text>
        <Text style={styles.headerSubtitle}>{report.modality}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Report Info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(report.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Facility</Text>
            <Text style={styles.infoValue}>{report.facility}</Text>
          </View>
          {report.radiologist && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Radiologist</Text>
              <Text style={styles.infoValue}>{report.radiologist}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{report.reportType.toUpperCase()}</Text>
          </View>
        </View>

        {/* AI Analysis (if available) */}
        {report.aiAnalysis && (
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
              <Text style={styles.aiProcessingTime}>
                Processed in {report.aiAnalysis.processingTimeSeconds}s
              </Text>
            </View>
            
            {report.aiAnalysis.anomaliesDetected.length > 0 ? (
              <>
                <Text style={styles.aiSubtitle}>Anomalies Detected:</Text>
                {report.aiAnalysis.anomaliesDetected.map((anomaly, index) => (
                  <View key={index} style={styles.anomalyCard}>
                    <View style={styles.anomalyHeader}>
                      <Text style={styles.anomalyType}>{anomaly.type}</Text>
                      <SeverityBadge severity={anomaly.severity} />
                    </View>
                    <Text style={styles.anomalyLocation}>Location: {anomaly.location}</Text>
                    <View style={styles.confidenceBar}>
                      <View style={styles.confidenceBarBg}>
                        <View 
                          style={[
                            styles.confidenceBarFill, 
                            { width: `${anomaly.confidence * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.confidenceText}>
                        {Math.round(anomaly.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.noAnomaliesCard}>
                <Text style={styles.noAnomaliesIcon}>✓</Text>
                <Text style={styles.noAnomaliesText}>No anomalies detected</Text>
              </View>
            )}
            
            <View style={styles.aiReportCard}>
              <Text style={styles.aiReportText}>{report.aiAnalysis.draftReport}</Text>
            </View>
          </View>
        )}

        {/* Medical Images (if available) */}
        {report.images && report.images.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🖼️ Medical Images</Text>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: report.images[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </View>
            {report.images.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageThumbnails}
              >
                {report.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: image }}
                      style={[
                        styles.thumbnail,
                        selectedImageIndex === index && styles.thumbnailActive,
                      ]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Lab Results (if available) */}
        {report.labResults && report.labResults.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔬 Laboratory Results</Text>
            {report.labResults.map((result, index) => (
              <LabResultRow key={index} result={result} />
            ))}
          </View>
        )}

        {/* Key Findings */}
        {report.findings && report.findings.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔍 Key Findings</Text>
            {report.findings.map((finding, index) => (
              <View key={index} style={styles.findingItem}>
                <Text style={styles.findingBullet}>•</Text>
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Radiologist Report */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📋 {report.radiologist ? 'Radiologist' : 'Medical'} Report</Text>
          <Text style={styles.reportText}>{report.radiologistReport}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📥 Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  infoValue: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiProcessingTime: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  aiSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595959',
    marginBottom: 8,
  },
  anomalyCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD591',
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anomalyType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  anomalyLocation: {
    fontSize: 13,
    color: '#595959',
    marginBottom: 8,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#52C41A',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    color: '#595959',
    fontWeight: '600',
  },
  noAnomaliesCard: {
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B7EB8F',
  },
  noAnomaliesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noAnomaliesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#52C41A',
  },
  aiReportCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  aiReportText: {
    fontSize: 13,
    color: '#595959',
    lineHeight: 20,
  },
  imageContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  imageThumbnails: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#11998E',
  },
  labResultRow: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  labResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labTestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  labStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  labResultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labResultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  labResultRange: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  findingBullet: {
    fontSize: 16,
    color: '#11998E',
    marginRight: 8,
    marginTop: 2,
  },
  findingText: {
    fontSize: 14,
    color: '#595959',
    flex: 1,
    lineHeight: 20,
  },
  reportText: {
    fontSize: 14,
    color: '#595959',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 16,
  },
  errorButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11998E',
  },
});
