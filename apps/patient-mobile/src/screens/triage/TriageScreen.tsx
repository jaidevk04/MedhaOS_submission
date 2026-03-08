/**
 * Triage Screen
 * Voice-based symptom assessment with real-time transcription
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { VoiceInputButton } from './components/VoiceInputButton';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { QuestionnaireUI } from './components/QuestionnaireUI';
import { UrgencyScoreDisplay } from './components/UrgencyScoreDisplay';

interface TriageScreenProps {
  navigation: any;
}

export const TriageScreen: React.FC<TriageScreenProps> = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcription, setTranscription] = useState({ hindi: '', english: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [urgencyScore, setUrgencyScore] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleVoicePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscription({ hindi: '', english: '' });
    // TODO: Integrate with expo-av or react-native-audio-recorder
    console.log('Starting voice recording...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    simulateAnalysis();
  };

  const simulateAnalysis = () => {
    // Mock transcription
    setTranscription({
      hindi: 'मुझे सीने में दर्द है',
      english: 'I have chest pain',
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAnalysisProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsAnalyzing(false);
        showQuestionnaire();
      }
    }, 200);
  };

  const showQuestionnaire = () => {
    setCurrentQuestion({
      id: 1,
      question: 'When did the pain start?',
      options: [
        { id: 'a', label: 'Just now' },
        { id: 'b', label: '2 hours ago' },
        { id: 'c', label: 'This morning' },
        { id: 'd', label: 'Yesterday' },
      ],
    });
  };

  const handleAnswerSelect = (answerId: string) => {
    console.log('Answer selected:', answerId);
    // TODO: Send to AI triage agent
    
    // Simulate next question or completion
    setTimeout(() => {
      setCurrentQuestion({
        id: 2,
        question: 'How would you describe the pain?',
        options: [
          { id: 'a', label: 'Sharp pain' },
          { id: 'b', label: 'Pressure/squeezing' },
          { id: 'c', label: 'Burning sensation' },
          { id: 'd', label: 'Dull ache' },
        ],
      });
    }, 500);
  };

  const handleVoiceAnswer = () => {
    console.log('Voice answer requested');
    startRecording();
  };

  const handleContinue = () => {
    // Simulate urgency calculation
    setUrgencyScore(78);
  };

  const handleViewResults = () => {
    navigation.navigate('TriageResult', {
      urgencyScore: urgencyScore || 78,
      recommendation: 'Emergency Department evaluation recommended',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Triage</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Voice Input Section */}
          <View style={styles.voiceSection}>
            <VoiceInputButton
              isRecording={isRecording}
              onPress={handleVoicePress}
            />
            
            {isRecording && (
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingText}>
                  🎤 Recording: {formatDuration(recordingDuration)}
                </Text>
                <WaveformVisualizer isActive={isRecording} />
              </View>
            )}
          </View>

          {/* Transcription Display */}
          {transcription.english && (
            <TranscriptionDisplay
              hindi={transcription.hindi}
              english={transcription.english}
            />
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <View style={styles.analysisSection}>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisTitle}>
                  ⚕️ Understanding your symptoms
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${analysisProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{analysisProgress}%</Text>
              </View>
            </View>
          )}

          {/* Questionnaire */}
          {currentQuestion && !urgencyScore && (
            <QuestionnaireUI
              question={currentQuestion}
              onAnswerSelect={handleAnswerSelect}
              onVoiceAnswer={handleVoiceAnswer}
              onContinue={handleContinue}
            />
          )}

          {/* Urgency Score */}
          {urgencyScore && (
            <UrgencyScoreDisplay
              score={urgencyScore}
              onViewResults={handleViewResults}
            />
          )}
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
    paddingBottom: theme.spacing['2xl'],
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  recordingInfo: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  recordingText: {
    ...theme.typography.styles.body,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  analysisSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  analysisCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  analysisTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
  },
  progressText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
