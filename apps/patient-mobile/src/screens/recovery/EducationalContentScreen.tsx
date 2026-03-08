/**
 * Educational Content Screen
 * Browse and watch educational videos and articles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { useRecoveryStore } from '@store/recoveryStore';
import { EducationalContent } from '@store/recoveryStore';

interface EducationalContentScreenProps {
  navigation: any;
}

const categories = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'diet', label: 'Diet', icon: '🥗' },
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
  { id: 'medication', label: 'Medication', icon: '💊' },
  { id: 'wound-care', label: 'Wound Care', icon: '🩹' },
  { id: 'mental-health', label: 'Mental Health', icon: '🧘' },
];

export const EducationalContentScreen: React.FC<EducationalContentScreenProps> = ({
  navigation,
}) => {
  const { recoveryPlan } = useRecoveryStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredContent =
    selectedCategory === 'all'
      ? recoveryPlan?.educationalContent || []
      : recoveryPlan?.educationalContent.filter(
          (content) => content.category === selectedCategory
        ) || [];

  const renderContentCard = ({ item }: { item: EducationalContent }) => (
    <TouchableOpacity
      style={styles.contentCard}
      onPress={() => navigation.navigate('VideoPlayer', { contentId: item.id })}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.thumbnailGradient}
        >
          <Text style={styles.thumbnailIcon}>
            {item.type === 'video' ? '▶️' : '📄'}
          </Text>
          {item.type === 'video' && item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.contentDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.contentMeta}>
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>
              {item.language.toUpperCase()}
            </Text>
          </View>
          {item.watched && (
            <View style={styles.watchedBadge}>
              <Text style={styles.watchedText}>✓ Watched</Text>
            </View>
          )}
        </View>

        {/* Progress Bar for partially watched videos */}
        {item.type === 'video' &&
          item.watchProgress !== undefined &&
          item.watchProgress > 0 &&
          item.watchProgress < 100 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.watchProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{item.watchProgress}%</Text>
            </View>
          )}
      </View>
    </TouchableOpacity>
  );

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
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Educational Content</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content List */}
        <FlatList
          data={filteredContent}
          renderItem={renderContentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>
                No content available in this category
              </Text>
            </View>
          }
        />
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
    padding: theme.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  placeholder: {
    width: 40,
  },
  categoryScroll: {
    maxHeight: 60,
    marginTop: theme.spacing.md,
  },
  categoryContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoryLabelActive: {
    color: theme.colors.neutral[0],
  },
  contentList: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  contentCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  thumbnail: {
    height: 180,
    overflow: 'hidden',
  },
  thumbnailGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 48,
  },
  durationBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  durationText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  contentInfo: {
    padding: theme.spacing.md,
  },
  contentTitle: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  contentDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  contentMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    minWidth: 35,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
