/**
 * Medications List Screen
 * Displays all current medications with reminders and adherence status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '@theme';
import { useMedicationStore } from '@store';
import type { MedicationDetails } from '@store';
import { sampleMedications, sampleAdherenceHistory } from '@utils/sampleMedicationData';

interface MedicationsListScreenProps {
  navigation: any;
}

const MedicationsListScreen: React.FC<MedicationsListScreenProps> = ({ navigation }) => {
  const { medications, getAdherenceRate, getMedicationsNeedingRefill, initializeData } = useMedicationStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'refill'>('all');

  // Initialize with sample data on first mount
  useEffect(() => {
    if (medications.length === 0) {
      initializeData(sampleMedications, sampleAdherenceHistory);
    }
  }, []);

  const filteredMedications = React.useMemo(() => {
    if (filter === 'refill') {
      return getMedicationsNeedingRefill();
    }
    if (filter === 'active') {
      return medications.filter((med) => !med.endDate || new Date(med.endDate) >= new Date());
    }
    return medications;
  }, [medications, filter, getMedicationsNeedingRefill]);

  const renderMedicationCard = ({ item }: { item: MedicationDetails }) => {
    const adherenceRate = getAdherenceRate(item.id, 7);
    const isActive = !item.endDate || new Date(item.endDate) >= new Date();
    const needsRefill = item.refillDate && new Date(item.refillDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
      <TouchableOpacity
        style={styles.medicationCard}
        onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{item.drugName}</Text>
            {item.genericName && (
              <Text style={styles.genericName}>({item.genericName})</Text>
            )}
          </View>
          {!isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>

        <View style={styles.dosageRow}>
          <Text style={styles.dosageText}>
            {item.dosage} • {item.frequency}
          </Text>
        </View>

        {item.instructions && (
          <Text style={styles.instructions} numberOfLines={2}>
            {item.instructions}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.adherenceContainer}>
            <Text style={styles.adherenceLabel}>7-day adherence:</Text>
            <View style={[
              styles.adherenceBadge,
              adherenceRate >= 80 ? styles.adherenceGood :
              adherenceRate >= 60 ? styles.adherenceWarning :
              styles.adherencePoor
            ]}>
              <Text style={styles.adherenceText}>{adherenceRate}%</Text>
            </View>
          </View>

          {needsRefill && (
            <View style={styles.refillBadge}>
              <Text style={styles.refillText}>🔔 Refill Soon</Text>
            </View>
          )}
        </View>

        {item.reminders.length > 0 && (
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderText}>
              ⏰ {item.reminders.filter(r => r.enabled).length} reminder(s) active
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💊</Text>
      <Text style={styles.emptyTitle}>No Medications</Text>
      <Text style={styles.emptyText}>
        Your medications will appear here once prescribed by your doctor.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('PillScanner')}
        >
          <Text style={styles.scanButtonText}>📷 Scan Pill</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({medications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterButtonText, filter === 'active' && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'refill' && styles.filterButtonActive]}
          onPress={() => setFilter('refill')}
        >
          <Text style={[styles.filterButtonText, filter === 'refill' && styles.filterButtonTextActive]}>
            Need Refill ({getMedicationsNeedingRefill().length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredMedications}
        renderItem={renderMedicationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scanButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  scanButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: theme.spacing.md,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  medicationCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  genericName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.neutral[200],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  inactiveBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  dosageRow: {
    marginBottom: theme.spacing.sm,
  },
  dosageText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  instructions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  adherenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  adherenceLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  adherenceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  adherenceGood: {
    backgroundColor: theme.colors.success[100],
  },
  adherenceWarning: {
    backgroundColor: theme.colors.warning[100],
  },
  adherencePoor: {
    backgroundColor: theme.colors.error[100],
  },
  adherenceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  refillBadge: {
    backgroundColor: theme.colors.warning[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  refillText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
  reminderInfo: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  reminderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

export default MedicationsListScreen;
