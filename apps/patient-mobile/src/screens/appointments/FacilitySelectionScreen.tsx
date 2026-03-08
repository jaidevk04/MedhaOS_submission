/**
 * Facility Selection Screen
 * Search and select healthcare facility with map view
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme';
import { Facility } from '@types';
import { apiClient } from '@utils/api';

interface FacilitySelectionScreenProps {
  navigation: any;
  route: any;
}

export const FacilitySelectionScreen: React.FC<FacilitySelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { urgencyScore } = route.params || {};
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearest' | 'emergency'>('all');

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    filterFacilities();
  }, [searchQuery, selectedFilter, facilities]);

  const loadFacilities = async () => {
    setLoading(true);
    // TODO: Get user location and fetch nearby facilities
    // For now, using mock data
    const mockFacilities: Facility[] = [
      {
        id: '1',
        name: 'Apollo Hospital',
        type: 'hospital',
        address: {
          street: 'Greams Road',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600006',
          country: 'India',
        },
        location: { latitude: 13.0569, longitude: 80.2497 },
        distance: 2.3,
        estimatedWaitTime: 5,
        availableSpecialties: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
        rating: 4.5,
        phone: '+91-44-28296000',
        emergencyAvailable: true,
      },
      {
        id: '2',
        name: 'Fortis Hospital',
        type: 'hospital',
        address: {
          street: 'Vadapalani',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600026',
          country: 'India',
        },
        location: { latitude: 13.0505, longitude: 80.2120 },
        distance: 4.1,
        estimatedWaitTime: 12,
        availableSpecialties: ['Cardiology', 'Gastroenterology', 'Oncology'],
        rating: 4.3,
        phone: '+91-44-33024444',
        emergencyAvailable: true,
      },
      {
        id: '3',
        name: 'MIOT International',
        type: 'hospital',
        address: {
          street: 'Manapakkam',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600089',
          country: 'India',
        },
        location: { latitude: 13.0067, longitude: 80.1653 },
        distance: 6.8,
        estimatedWaitTime: 8,
        availableSpecialties: ['Cardiology', 'Orthopedics', 'Nephrology'],
        rating: 4.6,
        phone: '+91-44-42002000',
        emergencyAvailable: true,
      },
    ];

    setFacilities(mockFacilities);
    setLoading(false);
  };

  const filterFacilities = () => {
    let filtered = [...facilities];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.address.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter === 'nearest') {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (selectedFilter === 'emergency') {
      filtered = filtered.filter((f) => f.emergencyAvailable);
    }

    setFilteredFacilities(filtered);
  };

  const handleFacilitySelect = (facility: Facility) => {
    navigation.navigate('DoctorSelection', {
      facilityId: facility.id,
      facilityName: facility.name,
      urgencyScore,
    });
  };

  const handleNavigate = (facility: Facility) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}?q=${facility.location.latitude},${facility.location.longitude}`,
      android: `${scheme}${facility.location.latitude},${facility.location.longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getUrgencyColor = () => {
    if (!urgencyScore) return theme.colors.neutral[500];
    if (urgencyScore >= 70) return theme.colors.urgency.critical;
    if (urgencyScore >= 40) return theme.colors.urgency.urgent;
    return theme.colors.urgency.routine;
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
          <Text style={styles.headerTitle}>Select Facility</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Urgency Banner */}
        {urgencyScore && (
          <View style={[styles.urgencyBanner, { backgroundColor: getUrgencyColor() }]}>
            <Text style={styles.urgencyText}>
              Urgency Score: {urgencyScore}/100 - {urgencyScore >= 70 ? 'High Priority' : 'Moderate Priority'}
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search facilities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'all' && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'nearest' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('nearest')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'nearest' && styles.filterTextActive,
              ]}
            >
              📍 Nearest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'emergency' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('emergency')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'emergency' && styles.filterTextActive,
              ]}
            >
              🚨 Emergency
            </Text>
          </TouchableOpacity>
        </View>

        {/* Facilities List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Finding nearby facilities...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredFacilities.map((facility) => (
              <TouchableOpacity
                key={facility.id}
                style={styles.facilityCard}
                onPress={() => handleFacilitySelect(facility)}
              >
                <View style={styles.facilityHeader}>
                  <View style={styles.facilityInfo}>
                    <Text style={styles.facilityName}>🏥 {facility.name}</Text>
                    {facility.rating && (
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>⭐ {facility.rating}</Text>
                      </View>
                    )}
                  </View>
                  {facility.emergencyAvailable && (
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyText}>🚨 ED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.facilityAddress}>
                  📍 {facility.address.street}, {facility.address.city}
                </Text>

                <View style={styles.facilityDetails}>
                  <Text style={styles.detailText}>
                    🚗 {facility.distance} km away
                  </Text>
                  <Text style={styles.detailText}>•</Text>
                  <Text style={styles.detailText}>
                    ⏱️ Wait: ~{facility.estimatedWaitTime} min
                  </Text>
                </View>

                <View style={styles.specialtiesContainer}>
                  {facility.availableSpecialties.slice(0, 3).map((specialty, index) => (
                    <View key={index} style={styles.specialtyBadge}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                  {facility.availableSpecialties.length > 3 && (
                    <Text style={styles.moreText}>
                      +{facility.availableSpecialties.length - 3} more
                    </Text>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleNavigate(facility)}
                  >
                    <Text style={styles.actionButtonText}>📍 Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCall(facility.phone)}
                  >
                    <Text style={styles.actionButtonText}>📞 Call</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {filteredFacilities.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No facilities found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
          </ScrollView>
        )}
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
  urgencyBanner: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  urgencyText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[0],
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  filterText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  facilityCard: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  emergencyBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  emergencyText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neutral[0],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  facilityAddress: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  facilityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  specialtyBadge: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  specialtyText: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
  moreText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    alignSelf: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[50],
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
});
