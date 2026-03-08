/**
 * Video Player Screen
 * Play educational videos with progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { useRecoveryStore } from '@store/recoveryStore';

interface VideoPlayerScreenProps {
  navigation: any;
  route: {
    params: {
      contentId: string;
    };
  };
}

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  navigation,
  route,
}) => {
  const { contentId } = route.params;
  const { recoveryPlan, markContentAsWatched, updateWatchProgress } =
    useRecoveryStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const content = recoveryPlan?.educationalContent.find((c) => c.id === contentId);

  useEffect(() => {
    // Simulate video progress
    let interval: NodeJS.Timeout;
    if (isPlaying && content?.duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= content.duration!) {
            setIsPlaying(false);
            markContentAsWatched(contentId);
            return content.duration!;
          }
          
          // Update progress every 5 seconds
          if (newTime % 5 === 0) {
            const progress = Math.round((newTime / content.duration!) * 100);
            updateWatchProgress(contentId, progress);
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, content]);

  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const progress = content.duration
    ? (currentTime / content.duration) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {content.title}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.videoGradient}
          >
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>

            {/* Video Controls Overlay */}
            <View style={styles.controlsOverlay}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(content.duration || 0)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Details */}
        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={styles.detailsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{content.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageText}>
                {content.language.toUpperCase()}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{content.category}</Text>
            </View>
            {content.watched && (
              <View style={styles.watchedBadge}>
                <Text style={styles.watchedText}>✓ Watched</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{content.description}</Text>

          {/* Tags */}
          {content.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Tags:</Text>
              <View style={styles.tags}>
                {content.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                markContentAsWatched(contentId);
                navigation.goBack();
              }}
            >
              <Text style={styles.actionButtonText}>Mark as Watched</Text>
            </TouchableOpacity>
          </View>

          {/* Related Content */}
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Content</Text>
            {recoveryPlan?.educationalContent
              .filter(
                (c) =>
                  c.id !== contentId &&
                  (c.category === content.category ||
                    c.tags.some((tag) => content.tags.includes(tag)))
              )
              .slice(0, 3)
              .map((relatedContent) => (
                <TouchableOpacity
                  key={relatedContent.id}
                  style={styles.relatedCard}
                  onPress={() => {
                    navigation.replace('VideoPlayer', {
                      contentId: relatedContent.id,
                    });
                  }}
                >
                  <View style={styles.relatedThumbnail}>
                    <Text style={styles.relatedIcon}>
                      {relatedContent.type === 'video' ? '▶️' : '📄'}
                    </Text>
                  </View>
                  <View style={styles.relatedInfo}>
                    <Text style={styles.relatedTitle} numberOfLines={2}>
                      {relatedContent.title}
                    </Text>
                    {relatedContent.duration && (
                      <Text style={styles.relatedDuration}>
                        {formatTime(relatedContent.duration)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
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
  headerTitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.neutral[900],
  },
  videoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 36,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  progressContainer: {
    gap: theme.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.borderRadius.full,
  },
  timeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neutral[0],
    textAlign: 'right',
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  languageBadge: {
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  languageText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  watchedBadge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  watchedText: {
    ...theme.typography.styles.caption,
    color: theme.colors.success[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  description: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  tagsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tagsLabel: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  actions: {
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  actionButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  relatedSection: {
    marginTop: theme.spacing.lg,
  },
  relatedTitle: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  relatedCard: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  relatedThumbnail: {
    width: 80,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedIcon: {
    fontSize: 24,
  },
  relatedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedDuration: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
