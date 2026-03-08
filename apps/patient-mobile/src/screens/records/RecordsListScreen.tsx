/**
 * Records List Screen
 * Displays patient's health records including medical history, diagnostics, and documents
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { HealthRecord } from '@/types';

// Mock data - in production, this would come from API
const mockRecords: HealthRecord[] = [
  {
    id: '1',
    patientId: 'patient-1',
    type: 'consultation',
    title: 'Cardiology Consultation',
    date: '2026-02-20',
    facility: 'Apollo Hospital',
    doctor: 'Dr. Anjali Verma',
    summary: 'Follow-up for previous MI. Patient stable, medications adjusted.',
    documents: [
      {
        id: 'doc-1',
        name: 'Consultation Notes.pdf',
        type: 'application/pdf',
        url: 'https://example.com/doc1.pdf',
        uploadedAt: '2026-02-20T10:30:00Z',
      },
    ],
  },
  {
    id: '2',
    patientId: 'patient-1',
    type: 'diagnostic',
    title: 'ECG Report',
    date: '2026-02-15',
    facility: 'Apollo Hospital',
    doctor: 'Dr. Anjali Verma',
    summary: 'Normal sinus rhythm. No ST elevation.',
    documents: [
      {
        id: 'doc-2',
        name: 'ECG_Report.pdf',
        type: 'application/pdf',
        url: 'https://example.com/ecg.pdf',
        uploadedAt: '2026-02-15T14:20:00Z',
      },
    ],
  },
  {
    id: '3',
    patientId: 'patient-1',
    type: 'diagnostic',
    title: 'Blood Test - Lipid Profile',
    date: '2026-02-10',
    facility: 'Apollo Diagnostics',
    summary: 'LDL: 110 mg/dL, HDL: 45 mg/dL, Triglycerides: 150 mg/dL',
    documents: [
      {
        id: 'doc-3',
        name: 'Lipid_Profile.pdf',
        type: 'application/pdf',
        url: 'https://example.com/lipid.pdf',
        uploadedAt: '2026-02-10T09:15:00Z',
      },
    ],
  },
  {
    id: '4',
    patientId: 'patient-1',
    type: 'prescription',
    title: 'Cardiac Medications',
    date: '2026-02-20',
    facility: 'Apollo Hospital',
    doctor: 'Dr. Anjali Verma',
    summary: 'Aspirin 75mg, Atorvastatin 40mg, Metformin 500mg',
    documents: [],
  },
];

const RecordTypeIcon: React.FC<{ type: HealthRecord['type'] }> = ({ type }) => {
  const icons = {
    consultation: '👨‍⚕️',
    diagnostic: '🔬',
    prescription: '💊',
    vaccination: '💉',
  };
  return <Text style={styles.recordIcon}>{icons[type]}</Text>;
};

const RecordCard: React.FC<{ record: HealthRecord; onPress: () => void }> = ({
  record,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.recordCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recordHeader}>
        <RecordTypeIcon type={record.type} />
        <View style={styles.recordHeaderText}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.recordDate}>
            {new Date(record.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
      
      <View style={styles.recordBody}>
        <Text style={styles.recordFacility}>📍 {record.facility}</Text>
        {record.doctor && (
          <Text style={styles.recordDoctor}>👨‍⚕️ {record.doctor}</Text>
        )}
        {record.summary && (
          <Text style={styles.recordSummary} numberOfLines={2}>
            {record.summary}
          </Text>
        )}
        {record.documents && record.documents.length > 0 && (
          <View style={styles.documentBadge}>
            <Text style={styles.documentBadgeText}>
              📄 {record.documents.length} document{record.documents.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.recordFooter}>
        <Text style={styles.viewDetailsText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
};

export const RecordsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState<'all' | HealthRecord['type']>('all');

  const filteredRecords = selectedFilter === 'all' 
    ? mockRecords 
    : mockRecords.filter(r => r.type === selectedFilter);

  const handleRecordPress = (recordId: string) => {
    navigation.navigate('RecordDetail', { recordId });
  };

  const handleUploadPress = () => {
    navigation.navigate('DocumentUpload');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Health Records</Text>
        <Text style={styles.headerSubtitle}>Your complete medical history</Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
            All Records
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'consultation' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('consultation')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'consultation' && styles.filterTabTextActive]}>
            👨‍⚕️ Consultations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'diagnostic' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('diagnostic')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'diagnostic' && styles.filterTabTextActive]}>
            🔬 Diagnostics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'prescription' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('prescription')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'prescription' && styles.filterTabTextActive]}>
            💊 Prescriptions
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Records List */}
      <ScrollView style={styles.recordsList} contentContainerStyle={styles.recordsListContent}>
        {filteredRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onPress={() => handleRecordPress(record.id)}
          />
        ))}
        
        {filteredRecords.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No records found</Text>
            <Text style={styles.emptyStateSubtext}>
              Your {selectedFilter === 'all' ? 'health' : selectedFilter} records will appear here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.uploadButtonGradient}
        >
          <Text style={styles.uploadButtonText}>📤 Upload Document</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterTabActive: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595959',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    padding: 20,
    paddingBottom: 100,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  recordHeaderText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 13,
    color: '#8C8C8C',
  },
  recordBody: {
    marginBottom: 12,
  },
  recordFacility: {
    fontSize: 14,
    color: '#595959',
    marginBottom: 4,
  },
  recordDoctor: {
    fontSize: 14,
    color: '#595959',
    marginBottom: 8,
  },
  recordSummary: {
    fontSize: 14,
    color: '#8C8C8C',
    lineHeight: 20,
    marginBottom: 8,
  },
  documentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentBadgeText: {
    fontSize: 12,
    color: '#1890FF',
    fontWeight: '600',
  },
  recordFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
