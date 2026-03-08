/**
 * Health Tips Carousel Component
 * Displays scrollable health tips with videos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface HealthTip {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  language: string;
}

const healthTips: HealthTip[] = [
  {
    id: '1',
    title: 'हृदय रोग के बाद आहार',
    duration: '5:30',
    thumbnail: '🎥',
    language: 'Hindi',
  },
  {
    id: '2',
    title: 'Diabetes Management Tips',
    duration: '4:15',
    thumbnail: '🎥',
    language: 'English',
  },
  {
    id: '3',
    title: 'ಮಧುಮೇಹ ನಿರ್ವಹಣೆ',
    duration: '6:00',
    thumbnail: '🎥',
    language: 'Kannada',
  },
];

export const HealthTipsCarousel: React.FC = () => {
  const handlePlayVideo = (tipId: string) => {
    console.log('Play video:', tipId);
    // TODO: Navigate to video player
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={CARD_WIDTH + theme.spacing.md}
      decelerationRate="fast"
    >
      {healthTips.map((tip) => (
        <TouchableOpacity
          key={tip.id}
          style={styles.card}
          onPress={() => handlePlayVideo(tip.id)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4FACFE', '#00F2FE']}
            style={styles.gradient}
          >
            <View style={styles.thumbnailContainer}>
              <Text style={styles.thumbnail}>{tip.thumbnail}</Text>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
            </View>
            
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {tip.title}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.duration}>{tip.duration}</Text>
                <Text style={styles.language}>{tip.language}</Text>
              </View>
              <TouchableOpacity style={styles.watchButton}>
                <Text style={styles.watchButtonText}>▶️ Watch now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: theme.spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  gradient: {
    flex: 1,
  },
  thumbnailContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  thumbnail: {
    fontSize: 48,
  },
  playButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  playIcon: {
    fontSize: 24,
  },
  content: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  duration: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  language: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  watchButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  watchButtonText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
