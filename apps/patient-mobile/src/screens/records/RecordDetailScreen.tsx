/**
 * Record Detail Screen
 * Displays detailed information about a specific health record
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordsStackParamList } from '@/navigation/types';
import { HealthRecord, MedicalCondition, Medication } from '@/types';

type RecordDetailRouteProp = RouteProp<RecordsStackParamList, 'RecordDetail'>;

// Mock data - in production, this would come from API
const mockRecordDetails: Record<string, HealthRecord & { 
  detailedSummary?: string;
  vitals?: Record<string, string>;
  diagnoses?: string[];
  medications?: Medication[];
}> = {
  '1': {
    id: '1',
    patientId: 'patient-1',
    type: 'consultation',
    title: 'Cardiology Consultation',
    date: '2026-02-20',
    facility: 'Apollo Hospital',
    doctor: 'Dr. Anjali Verma',
    summary: 'Follow-up for previous MI. Patient stable, medications adjusted.',
    detailedSummary: `Patient presented for routine follow-up after myocardial infarction in 2020. 

Current Status:
- Patient reports feeling well with no chest pain
- Compliance with medications is good
- Regular exercise as recommended

Physical Examination:
- BP: 130/85 mmHg
- Heart Rate: 72 bpm
- No signs of heart failure
- Lungs clear

Assessment:
Patient is stable and recovering well. Continue current medication regimen with minor adjustments to statin dosage.

Plan:
- Continue Aspirin 75mg daily
- Increase Atorvastatin to 40mg nightly
- Follow-up in 3 months
- Lipid profile in 6 weeks`,
    vitals: {
      'Blood Pressure': '130/85 mmHg',
      'Heart Rate': '72 bpm',
      'Temperature': '98.2°F',
      'SpO2': '98%',
      'Weight': '75 kg',
    },
    diagnoses: [
      'Coronary Artery Disease (CAD)',
      'Previous Myocardial Infarction',
      'Type 2 Diabetes Mellitus',
      'Hypertension',
    ],
    medications: [
      {
        id: 'med-1',
        drugName: 'Aspirin',
        dosage: '75mg',
        frequency: 'Once daily',
        startDate: '2020-03-15',
        instructions: 'Take after breakfast',
      },
      {
        id: 'med-2',
        drugName: 'Atorvastatin',
        dosage: '40mg',
        frequency: 'Once daily',
        startDate: '2026-02-20',
        instructions: 'Take at bedtime',
      },
      {
        id: 'med-3',
        drugName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: '2015-06-10',
        instructions: 'Take with meals',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Consultation_Notes.pdf',
        type: 'application/pdf',
        url: 'https://example.com/doc1.pdf',
        uploadedAt: '2026-02-20T10:30:00Z',
      },
      {
        id: 'doc-2',
        name: 'ECG_Report.pdf',
        type: 'application/pdf',
        url: 'https://example.com/ecg.pdf',
        uploadedAt: '2026-02-20T10:35:00Z',
      },
    ],
  },
  '2': {
    id: '2',
    patientId: 'patient-1',
    type: 'diagnostic',
    title: 'ECG Report',
    date: '2026-02-15',
    facility: 'Apollo Hospital',
    doctor: 'Dr. Anjali Verma',
    summary: 'Normal sinus rhythm. No ST elevation.',
    detailedSummary: `12-Lead Electrocardiogram Report

Indication: Routine cardiac assessment

Findings:
- Rate: 72 bpm
- Rhythm: Normal sinus rhythm
- Axis: Normal
- PR Interval: 160 ms (normal)
- QRS Duration: 90 ms (normal)
- QT/QTc: 400/420 ms (normal)

Interpretation:
Normal 12-lead ECG. No evidence of acute ischemia, previous infarction, or conduction abnormalities.

Recommendation:
Continue current management. No immediate concerns.`,
    documents: [
      {
        id: 'doc-2',
        name: 'ECG_Report.pdf',
        type: 'application/pdf',
        url: 'https://example.com/ecg.pdf',
        uploadedAt: '2026-02-15T14:20:00Z',
      },
      {
        id: 'doc-2b',
        name: 'ECG_Image.jpg',
        type: 'image/jpeg',
        url: 'https://example.com/ecg.jpg',
        uploadedAt: '2026-02-15T14:20:00Z',
      },
    ],
  },
};

const InfoRow: React.FC<{ label: string; value: string; icon?: string }> = ({ 
  label, 
  value, 
  icon 
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>
      {icon && `${icon} `}{label}
    </Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const SectionHeader: React.FC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>
      {icon && `${icon} `}{title}
    </Text>
  </View>
);

const DocumentCard: React.FC<{ 
  document: { id: string; name: string; type: string; url: string; uploadedAt: string };
  onPress: () => void;
}> = ({ document, onPress }) => {
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <TouchableOpacity style={styles.documentCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.documentIcon}>{getFileIcon(document.type)}</Text>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>{document.name}</Text>
        <Text style={styles.documentDate}>
          {new Date(document.uploadedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={styles.documentAction}>→</Text>
    </TouchableOpacity>
  );
};

export const RecordDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RecordDetailRouteProp>();
  const { recordId } = route.params;

  const record = mockRecordDetails[recordId];

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Record not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.errorButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDocumentPress = (url: string, name: string) => {
    Alert.alert(
      'Open Document',
      `Would you like to open ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to open document');
            });
          }
        },
      ]
    );
  };

  const handleDiagnosticReportPress = () => {
    if (record.type === 'diagnostic') {
      navigation.navigate('DiagnosticReport', { reportId: record.id });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{record.title}</Text>
        <Text style={styles.headerSubtitle}>
          {new Date(record.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Basic Information */}
        <View style={styles.card}>
          <InfoRow label="Facility" value={record.facility} icon="🏥" />
          {record.doctor && <InfoRow label="Doctor" value={record.doctor} icon="👨‍⚕️" />}
          <InfoRow 
            label="Type" 
            value={record.type.charAt(0).toUpperCase() + record.type.slice(1)} 
            icon="📋" 
          />
        </View>

        {/* Vitals (if available) */}
        {record.vitals && Object.keys(record.vitals).length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Vital Signs" icon="❤️" />
            {Object.entries(record.vitals).map(([key, value]) => (
              <InfoRow key={key} label={key} value={value} />
            ))}
          </View>
        )}

        {/* Diagnoses (if available) */}
        {record.diagnoses && record.diagnoses.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Diagnoses" icon="🔍" />
            {record.diagnoses.map((diagnosis, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemBullet}>•</Text>
                <Text style={styles.listItemText}>{diagnosis}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Detailed Summary */}
        {record.detailedSummary && (
          <View style={styles.card}>
            <SectionHeader title="Clinical Notes" icon="📝" />
            <Text style={styles.detailedSummary}>{record.detailedSummary}</Text>
          </View>
        )}

        {/* Medications (if available) */}
        {record.medications && record.medications.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Medications Prescribed" icon="💊" />
            {record.medications.map((med) => (
              <View key={med.id} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{med.drugName}</Text>
                <Text style={styles.medicationDetails}>
                  {med.dosage} • {med.frequency}
                </Text>
                {med.instructions && (
                  <Text style={styles.medicationInstructions}>{med.instructions}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Documents */}
        {record.documents && record.documents.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Attached Documents" icon="📎" />
            {record.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPress={() => handleDocumentPress(doc.url, doc.name)}
              />
            ))}
          </View>
        )}

        {/* View Diagnostic Report Button (for diagnostic records) */}
        {record.type === 'diagnostic' && (
          <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={handleDiagnosticReportPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#11998E', '#38EF7D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.diagnosticButtonGradient}
            >
              <Text style={styles.diagnosticButtonText}>🔬 View Detailed Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8C8C8C',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#667EEA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  detailedSummary: {
    fontSize: 14,
    color: '#595959',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemBullet: {
    fontSize: 16,
    color: '#667EEA',
    marginRight: 8,
    marginTop: 2,
  },
  listItemText: {
    fontSize: 14,
    color: '#595959',
    flex: 1,
    lineHeight: 20,
  },
  medicationItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 13,
    color: '#595959',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#8C8C8C',
    fontStyle: 'italic',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  documentAction: {
    fontSize: 18,
    color: '#667EEA',
    fontWeight: '600',
  },
  diagnosticButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#11998E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  diagnosticButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  diagnosticButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: '#667EEA',
  },
});
