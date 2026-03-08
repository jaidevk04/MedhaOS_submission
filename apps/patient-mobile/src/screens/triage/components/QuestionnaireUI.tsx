/**
 * Questionnaire UI
 * Structured questionnaire with radio button selections
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@theme';

interface QuestionOption {
  id: string;
  label: string;
}

interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
}

interface QuestionnaireUIProps {
  question: Question;
  onAnswerSelect: (answerId: string) => void;
  onVoiceAnswer: () => void;
  onContinue: () => void;
}

export const QuestionnaireUI: React.FC<QuestionnaireUIProps> = ({
  question,
  onAnswerSelect,
  onVoiceAnswer,
  onContinue,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
    onAnswerSelect(answerId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Follow-up Questions:</Text>
      
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>
          Q{question.id}: {question.question}
        </Text>
        
        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioButton,
                  selectedAnswer === option.id && styles.radioButtonSelected,
                ]}
              >
                {selectedAnswer === option.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={onVoiceAnswer}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceButtonText}>🎤 Speak Answer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAnswer && styles.continueButtonDisabled,
          ]}
          onPress={onContinue}
          disabled={!selectedAnswer}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selectedAnswer && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  questionCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  questionText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
    fontSize: 16,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[500],
  },
  optionLabel: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  voiceButton: {
    flex: 1,
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  voiceButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  continueButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  continueButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});
