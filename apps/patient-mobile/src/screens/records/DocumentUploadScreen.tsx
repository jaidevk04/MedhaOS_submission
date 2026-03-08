/**
 * Document Upload Screen
 * Allows patients to upload medical documents, prescriptions, and reports
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
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
}

const documentTypes = [
  { id: 'prescription', label: '💊 Prescription', icon: '💊' },
  { id: 'lab_report', label: '🔬 Lab Report', icon: '🔬' },
  { id: 'radiology', label: '🩻 Radiology Report', icon: '🩻' },
  { id: 'discharge_summary', label: '📋 Discharge Summary', icon: '📋' },
  { id: 'vaccination', label: '💉 Vaccination Record', icon: '💉' },
  { id: 'insurance', label: '🏥 Insurance Document', icon: '🏥' },
  { id: 'other', label: '📄 Other', icon: '📄' },
];

export const DocumentUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [facility, setFacility] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handlePickDocument = () => {
    // In a real app, this would use expo-document-picker or react-native-image-picker
    Alert.alert(
      'Select Document Source',
      'Choose where to get your document from',
      [
        {
          text: 'Camera',
          onPress: () => handleCameraCapture(),
        },
        {
          text: 'Gallery',
          onPress: () => handleGalleryPick(),
        },
        {
          text: 'Files',
          onPress: () => handleFilePick(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraCapture = () => {
    // Mock camera capture
    const mockFile: UploadedDocument = {
      id: Date.now().toString(),
      name: `Document_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: 2048000, // 2MB
      uri: 'https://via.placeholder.com/400x600/667EEA/FFFFFF?text=Captured+Document',
    };
    setUploadedFiles([...uploadedFiles, mockFile]);
    Alert.alert('Success', 'Document captured successfully');
  };

  const handleGalleryPick = () => {
    // Mock gallery pick
    const mockFile: UploadedDocument = {
      id: Date.now().toString(),
      name: `Gallery_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: 1536000, // 1.5MB
      uri: 'https://via.placeholder.com/400x600/764BA2/FFFFFF?text=Gallery+Image',
    };
    setUploadedFiles([...uploadedFiles, mockFile]);
    Alert.alert('Success', 'Document selected from gallery');
  };

  const handleFilePick = () => {
    // Mock file pick
    const mockFile: UploadedDocument = {
      id: Date.now().toString(),
      name: `Report_${Date.now()}.pdf`,
      type: 'application/pdf',
      size: 512000, // 512KB
      uri: 'https://example.com/document.pdf',
    };
    setUploadedFiles([...uploadedFiles, mockFile]);
    Alert.alert('Success', 'Document selected successfully');
  };

  const handleRemoveFile = (fileId: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
          },
        },
      ]
    );
  };

  const handleUpload = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }
    if (!documentTitle.trim()) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }
    if (uploadedFiles.length === 0) {
      Alert.alert('Error', 'Please add at least one document');
      return;
    }

    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert(
        'Success',
        'Your document has been uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
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
        <Text style={styles.headerTitle}>Upload Document</Text>
        <Text style={styles.headerSubtitle}>Add to your health records</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Type *</Text>
          <View style={styles.typeGrid}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive,
                ]}
                onPress={() => handleDocumentTypeSelect(type.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelActive,
                  ]}
                  numberOfLines={2}
                >
                  {type.label.replace(/^[^\s]+\s/, '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Blood Test Report"
              value={documentTitle}
              onChangeText={setDocumentTitle}
              placeholderTextColor="#BFBFBF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={documentDate}
              onChangeText={setDocumentDate}
              placeholderTextColor="#BFBFBF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Facility/Hospital</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Apollo Hospital"
              value={facility}
              onChangeText={setFacility}
              placeholderTextColor="#BFBFBF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#BFBFBF"
            />
          </View>
        </View>

        {/* File Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Files *</Text>
          
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handlePickDocument}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadIcon}>📤</Text>
            <Text style={styles.uploadText}>Tap to add document</Text>
            <Text style={styles.uploadSubtext}>
              Camera • Gallery • Files
            </Text>
          </TouchableOpacity>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <View style={styles.filesList}>
              {uploadedFiles.map((file) => (
                <View key={file.id} style={styles.fileCard}>
                  <Text style={styles.fileIcon}>{getFileIcon(file.type)}</Text>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFile(file.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tips for better uploads:</Text>
            <Text style={styles.infoText}>
              • Ensure documents are clear and readable{'\n'}
              • Supported formats: PDF, JPG, PNG{'\n'}
              • Maximum file size: 10 MB per file{'\n'}
              • All documents are encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isUploading ? ['#BFBFBF', '#8C8C8C'] : ['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadButtonGradient}
          >
            <Text style={styles.uploadButtonText}>
              {isUploading ? '⏳ Uploading...' : '✓ Upload Document'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  typeCardActive: {
    borderColor: '#667EEA',
    backgroundColor: '#F0F2FF',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#595959',
    textAlign: 'center',
    fontWeight: '600',
  },
  typeLabelActive: {
    color: '#667EEA',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595959',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#262626',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#8C8C8C',
  },
  filesList: {
    marginTop: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#FF4D4F',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E6F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#91D5FF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0050B3',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#096DD9',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    shadowOpacity: 0.1,
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
