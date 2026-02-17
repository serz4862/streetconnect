import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DogCard from '../../../components/dog/DogCard';
import { useAuthStore } from '../../../store/auth.store';
import { useLocationStore } from '../../../store/location.store';
import { useDogs } from '../../../hooks/useDogs';
import { colors, RADIUS_OPTIONS } from '../../../constants';
import { Dog } from '../../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

// Schema-based filter options (dogs table)
const TYPE_OPTIONS = [
  { value: 'all', label: 'All dogs' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
] as const;
const GENDER_OPTIONS = [
  { value: 'all', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;
const STERILIZED_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'yes', label: 'Sterilized' },
  { value: 'no', label: 'Not sterilized' },
] as const;
const CONDITION_OPTIONS = [
  { value: 'all', label: 'Any condition' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'sick', label: 'Sick' },
  { value: 'injured', label: 'Injured' },
  { value: 'critical', label: 'Critical' },
  { value: 'unknown', label: 'Unknown' },
] as const;

/** Short location for header: e.g. "Green Park" or locality name, max ~20 chars */
function shortLocation(full: string | null | undefined): string {
  if (!full) return 'Getting location...';
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  const locality = parts.length >= 2 ? parts[1] : parts[0];
  const name = (locality || full).replace(/\s+/g, ' ').slice(0, 22);
  return name || 'Location';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentLocation, locationName, getCurrentLocation } = useLocationStore();
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterSterilized, setFilterSterilized] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const { useNearbyDogs } = useDogs();
  const { data: dogs, isLoading, refetch } = useNearbyDogs({
    latitude: currentLocation?.latitude || 28.5319,
    longitude: currentLocation?.longitude || 77.2195,
    radius: selectedRadius,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const filteredDogs = (dogs || []).filter((dog) => {
    const matchesSearch =
      !searchQuery.trim() ||
      dog.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'lost' && dog.is_lost) ||
      (filterType === 'found' && dog.is_found);

    const matchesGender =
      filterGender === 'all' || dog.gender === filterGender;

    const matchesCondition =
      filterCondition === 'all' || dog.health_status === filterCondition;

    const matchesSterilized =
      filterSterilized === 'all' ||
      (filterSterilized === 'yes' && dog.is_sterilized) ||
      (filterSterilized === 'no' && !dog.is_sterilized);

    return matchesSearch && matchesType && matchesGender && matchesCondition && matchesSterilized;
  });

  const renderDogCard = useCallback(
    ({ item }: { item: Dog }) => (
      <DogCard dog={item} onPress={handleDogPress} />
    ),
    [handleDogPress]
  );

  const ListHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'User'}!</Text>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🐕</Text>
            <Text style={styles.logoText}>StreetConnect</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(main)/profile')}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {shortLocation(locationName)}
          </Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for dogs"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <ActionButton icon="📷" label="Scan QR" onPress={() => router.push('/(main)/scan-qr')} />
        <ActionButton icon="➕" label="Add Dog" onPress={() => router.push('/(main)/add-dog')} />
        <ActionButton icon="🔴" label="Report Lost" onPress={() => router.push('/(main)/report/lost')} />
        <ActionButton icon="🟢" label="Report Found" onPress={() => router.push('/(main)/report/found')} />
      </View>

      {/* Dogs Near You title + radius */}
      <View style={styles.dogsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dogs Near You</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radiusRow}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radiusBtn, selectedRadius === opt.value && styles.radiusBtnActive]}
              onPress={() => setSelectedRadius(opt.value)}
            >
              <Text style={[styles.radiusText, selectedRadius === opt.value && styles.radiusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const ListEmpty = isLoading ? (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading dogs...</Text>
    </View>
  ) : (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🐾</Text>
      <Text style={styles.emptyText}>No dogs found nearby</Text>
      <Text style={styles.emptySubtext}>Try increasing the radius or add a new dog</Text>
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => { getCurrentLocation(); refetch(); }}
      >
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter dogs</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.filterSectionLabel}>Type</Text>
            <View style={styles.filterChips}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, filterType === opt.value && styles.filterChipActive]}
                  onPress={() => setFilterType(opt.value)}
                >
                  <Text style={[styles.filterChipText, filterType === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionLabel}>Gender</Text>
            <View style={styles.filterChips}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, filterGender === opt.value && styles.filterChipActive]}
                  onPress={() => setFilterGender(opt.value)}
                >
                  <Text style={[styles.filterChipText, filterGender === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionLabel}>Sterilization</Text>
            <View style={styles.filterChips}>
              {STERILIZED_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, filterSterilized === opt.value && styles.filterChipActive]}
                  onPress={() => setFilterSterilized(opt.value as any)}
                >
                  <Text style={[styles.filterChipText, filterSterilized === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionLabel}>Condition</Text>
            <View style={[styles.filterChips, styles.filterChipsWrap]}>
              {CONDITION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterChip, filterCondition === opt.value && styles.filterChipActive]}
                  onPress={() => setFilterCondition(opt.value)}
                >
                  <Text style={[styles.filterChipText, filterCondition === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.filterApplyText}>Show results</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={filteredDogs}
        renderItem={renderDogCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={filteredDogs.length === 0 ? styles.dogsListEmpty : styles.dogsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const ActionButton = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.actionIconContainer}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -60 }],
  },
  logo: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  profileBtn: {
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  dogsSection: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  radiusRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  radiusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  radiusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  radiusTextActive: {
    color: colors.textOnPrimary,
  },
  dogsList: {
    paddingBottom: 24,
  },
  dogsListEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  dogCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dogImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.surface,
  },
  dogImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogEmoji: {
    fontSize: 80,
  },
  dogCardBottom: {
    padding: 14,
  },
  dogName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  dogTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagColor: {
    backgroundColor: '#FEF3C7',
  },
  tagGender: {
    backgroundColor: '#D1FAE5',
  },
  tagSterilized: {
    backgroundColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dogCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dogLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  dogLastSeen: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  filterModal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  filterSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChipsWrap: {
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
  },
  filterApplyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  filterApplyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});
