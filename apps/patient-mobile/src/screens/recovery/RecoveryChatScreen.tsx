/**
 * Recovery Chat Screen
 * Quick question chat interface with AI assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '@theme';
import { useRecoveryStore, ChatMessage } from '@store/recoveryStore';

interface RecoveryChatScreenProps {
  navigation: any;
}

const quickReplies = [
  'Can I exercise today?',
  'What should I eat?',
  'Is this pain normal?',
  'When is my next appointment?',
];

export const RecoveryChatScreen: React.FC<RecoveryChatScreenProps> = ({
  navigation,
}) => {
  const { chatMessages, addMessage } = useRecoveryStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize with welcome message if empty
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-1',
        text: 'Hello! I\'m here to help with your recovery. You can ask me questions about your medications, exercises, diet, or any concerns you have.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'text',
        quickReplies,
      };
      addMessage(welcomeMessage);
    }
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    addMessage(userMessage);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(text);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'text',
        quickReplies: getContextualQuickReplies(text),
      };
      addMessage(aiMessage);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('exercise') || lowerQuestion.includes('walk')) {
      return 'Based on your current recovery phase, you should aim for 15-20 minutes of walking twice daily. Start slowly and gradually increase your pace. If you experience chest pain, shortness of breath, or dizziness, stop immediately and rest. Always listen to your body!';
    }

    if (lowerQuestion.includes('eat') || lowerQuestion.includes('diet') || lowerQuestion.includes('food')) {
      return 'Your heart-healthy diet should include:\n\n• Plenty of fruits and vegetables\n• Whole grains\n• Lean proteins (fish, chicken, legumes)\n• Low-fat dairy\n• Limit sodium to less than 2000mg per day\n• Avoid saturated fats and trans fats\n\nWould you like to watch our diet education video?';
    }

    if (lowerQuestion.includes('pain') || lowerQuestion.includes('hurt')) {
      return 'Some discomfort during recovery is normal, but certain types of pain require immediate attention:\n\n⚠️ Call your doctor if you experience:\n• Chest pain or pressure\n• Severe shortness of breath\n• Irregular heartbeat\n• Swelling in legs\n• Fever over 100.4°F\n\nFor mild discomfort, rest and take prescribed pain medication as directed.';
    }

    if (lowerQuestion.includes('appointment') || lowerQuestion.includes('doctor')) {
      return 'Your next appointment is on March 20th at 11:00 AM with Dr. Anjali Verma for an echocardiogram and progress review. Would you like directions to the hospital or to set a reminder?';
    }

    if (lowerQuestion.includes('medication') || lowerQuestion.includes('medicine')) {
      return 'You should continue taking your prescribed medications:\n\n• Aspirin 75mg - daily\n• Clopidogrel 75mg - daily\n• Atorvastatin 40mg - nightly\n• Metformin 500mg - twice daily\n\nNever skip doses. If you experience side effects, contact your doctor before stopping any medication.';
    }

    return 'I understand your concern. For specific medical advice, please consult with your healthcare provider. You can also:\n\n• Review your recovery plan\n• Watch educational videos\n• Call your doctor directly\n\nIs there anything else I can help you with?';
  };

  const getContextualQuickReplies = (question: string): string[] => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('exercise')) {
      return [
        'How long should I walk?',
        'Can I lift weights?',
        'What if I feel tired?',
      ];
    }

    if (lowerQuestion.includes('diet')) {
      return [
        'Can I eat spicy food?',
        'How much salt is okay?',
        'Show me diet videos',
      ];
    }

    return quickReplies;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {!isUser && (
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>🤖</Text>
            </View>
          )}
          <View style={styles.messageContent}>
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userText : styles.aiText,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.aiTimestamp,
              ]}
            >
              {new Date(item.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Quick Replies */}
        {item.quickReplies && item.quickReplies.length > 0 && (
          <View style={styles.quickRepliesContainer}>
            {item.quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleSendMessage(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Recovery Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'Typing...' : 'Online'}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotDelay1]} />
            <View style={[styles.typingDot, styles.typingDotDelay2]} />
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  headerSubtitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.success[600],
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.sm,
  },
  messageBubble: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
  },
  userText: {
    backgroundColor: theme.colors.primary[500],
    color: theme.colors.neutral[0],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomRightRadius: 4,
  },
  aiText: {
    backgroundColor: theme.colors.neutral[0],
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 4,
    ...theme.shadows.small,
  },
  messageText: {
    ...theme.typography.styles.body,
    lineHeight: 22,
  },
  timestamp: {
    ...theme.typography.styles.caption,
    marginTop: theme.spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: theme.colors.text.secondary,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginLeft: 44,
  },
  quickReplyButton: {
    backgroundColor: theme.colors.neutral[0],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
    ...theme.shadows.small,
  },
  quickReplyText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: 44,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[400],
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  input: {
    flex: 1,
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  sendIcon: {
    fontSize: 20,
    color: theme.colors.neutral[0],
  },
});
