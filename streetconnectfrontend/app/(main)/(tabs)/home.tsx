import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SwipeableDogCard from '../../../components/dog/SwipeableDogCard';
import { useAuthStore } from '../../../store/auth.store';
import { useLocationStore } from '../../../store/location.store';
import { useDogs } from '../../../hooks/useDogs';
import { colors, RADIUS_OPTIONS } from '../../../constants';
import { Dog } from '../../../types';
import { apiService } from '../../../services/api';
import { proxyImageUrl } from '../../../services/imageProxy';

const { width } = Dimensions.get('window');
const ALERT_CARD_WIDTH = width * 0.58;

// ─── Filter options ───────────────────────────────────────────────
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
  { value: 'all', label: 'Any' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'sick', label: 'Sick' },
  { value: 'injured', label: 'Injured' },
  { value: 'critical', label: 'Critical' },
] as const;

function shortLocation(full: string | null | undefined): string {
  if (!full) return 'Getting location...';
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  const locality = parts.length >= 2 ? parts[1] : parts[0];
  return (locality || full).replace(/\s+/g, ' ').slice(0, 24) || 'Location';
}

// ─── Reported dog compact card ────────────────────────────────────
const AlertDogCard = React.memo(({ dog, onPress }: { dog: Dog; onPress: (d: Dog) => void }) => {
  const isLost = dog.is_lost;
  const statusColor = isLost ? '#EF4444' : '#F59E0B';
  const reason = dog.health_notes || dog.description;

  return (
    <TouchableOpacity
      style={[styles.alertCard, { borderColor: statusColor + '60' }]}
      onPress={() => onPress(dog)}
      activeOpacity={0.8}
    >
      {dog.image_url ? (
        <Image source={{ uri: proxyImageUrl(dog.image_url) }} style={styles.alertImage} resizeMode="cover" />
      ) : (
        <View style={[styles.alertImage, styles.alertImagePlaceholder]}>
          <Text style={{ fontSize: 32 }}>🐕</Text>
        </View>
      )}
      <View style={[styles.alertBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.alertBadgeText}>{isLost ? 'LOST' : dog.health_status.toUpperCase()}</Text>
      </View>
      <View style={styles.alertInfo}>
        <Text style={styles.alertName} numberOfLines={1}>{dog.name || 'Unnamed'}</Text>
        {dog.color && <Text style={styles.alertColor} numberOfLines={1}>{dog.color}</Text>}
        {reason ? (
          <Text style={styles.alertReason} numberOfLines={2}>{reason}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

// ─── Location picker modal ────────────────────────────────────────
function LocationPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, name: string) => void;
}) {
  const {
    savedLocations,
    savedLocationsLoaded,
    loadSavedLocations,
    getCurrentLocation,
    locationName,
  } = useLocationStore();

  useEffect(() => {
    if (visible && !savedLocationsLoaded) loadSavedLocations();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>Choose Location</Text>

          <TouchableOpacity
            style={styles.pickerCurrentBtn}
            onPress={() => {
              getCurrentLocation();
              onClose();
            }}
          >
            <Ionicons name="locate" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerCurrentLabel}>Use Current Location</Text>
              {locationName ? (
                <Text style={styles.pickerCurrentSub} numberOfLines={1}>{shortLocation(locationName)}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {savedLocations.length > 0 && (
            <>
              <Text style={styles.pickerSectionLabel}>Saved Locations</Text>
              {savedLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.pickerLocRow}
                  onPress={() => {
                    onSelect(loc.latitude, loc.longitude, loc.location_name ?? loc.label);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={loc.is_default ? 'star' : 'location-outline'}
                    size={18}
                    color={loc.is_default ? '#F59E0B' : colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerLocLabel}>{loc.label}</Text>
                    {loc.location_name && (
                      <Text style={styles.pickerLocSub} numberOfLines={1}>{loc.location_name}</Text>
                    )}
                  </View>
                  {loc.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity
            style={styles.pickerManageBtn}
            onPress={() => onClose()}
          >
            <Text style={styles.pickerManageBtnText}>Manage Saved Locations</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentLocation,
    locationName,
    getCurrentLocation,
    useLocation: useSavedLocation,
  } = useLocationStore();

  const [selectedRadius, setSelectedRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
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
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  };

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const handleReportLost = useCallback(async (dog: Dog) => {
    try {
      await apiService.updateDog(dog.id, { is_lost: !dog.is_lost });
      refetch();
    } catch {
      // fallback: navigate to report screen
      router.push({ pathname: '/(main)/report/lost', params: { dog_id: dog.id } });
    }
  }, [router, refetch]);

  const handleReportIssue = useCallback((dog: Dog) => {
    router.push({ pathname: '/(main)/report/issue', params: { dog_id: dog.id } });
  }, [router]);

  const handleLocationSelect = useCallback((lat: number, lng: number, name: string) => {
    useSavedLocation({ id: '', user_id: '', label: name, latitude: lat, longitude: lng, location_name: name, is_default: false, created_at: '', updated_at: '' });
  }, [useSavedLocation]);

  // Partition dogs: alerts (lost/health issues) shown in horizontal slider first
  const allDogs = dogs || [];

  const alertDogs = allDogs.filter((d) => d.is_lost || ['sick', 'injured', 'critical'].includes(d.health_status));

  const filteredDogs = allDogs.filter((dog) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      dog.name?.toLowerCase().includes(q) ||
      dog.color?.toLowerCase().includes(q) ||
      dog.breed?.toLowerCase().includes(q) ||
      dog.location_name?.toLowerCase().includes(q);

    const matchesGender = filterGender === 'all' || dog.gender === filterGender;
    const matchesCondition = filterCondition === 'all' || dog.health_status === filterCondition;
    const matchesSterilized =
      filterSterilized === 'all' ||
      (filterSterilized === 'yes' && dog.is_sterilized) ||
      (filterSterilized === 'no' && !dog.is_sterilized);

    return matchesSearch && matchesGender && matchesCondition && matchesSterilized;
  });

  // Sort: lost/issue dogs first, then rest
  const sortedDogs = [
    ...filteredDogs.filter((d) => d.is_lost || ['sick', 'injured', 'critical'].includes(d.health_status)),
    ...filteredDogs.filter((d) => !d.is_lost && !['sick', 'injured', 'critical'].includes(d.health_status)),
  ];

  const hasActiveFilters = filterGender !== 'all' || filterCondition !== 'all' || filterSterilized !== 'all';

  const renderDogCard = useCallback(
    ({ item }: { item: Dog }) => (
      <SwipeableDogCard
        dog={item}
        onPress={handleDogPress}
        onReportLost={handleReportLost}
        onReportIssue={handleReportIssue}
      />
    ),
    [handleDogPress, handleReportLost, handleReportIssue]
  );

  const ListHeader = (
    <>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetSection}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}!</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/(main)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push('/(main)/profile')}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Location row */}
        <TouchableOpacity style={styles.locationRow} onPress={() => setLocationPickerVisible(true)}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {shortLocation(locationName)}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, colour, breed..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="options"
            size={20}
            color={hasActiveFilters ? '#fff' : colors.textOnPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Quick Actions: only Scan QR + Add Dog ── */}
      <View style={styles.actionsRow}>
        <ActionButton
          icon="qr-code-outline"
          label="Scan QR"
          color="#5856D6"
          onPress={() => router.push('/(main)/scan-qr')}
        />
        <ActionButton
          icon="add-circle-outline"
          label="Add Dog"
          color={colors.primary}
          onPress={() => router.push('/(main)/add-dog')}
        />
        <ActionButton
          icon="map-outline"
          label="Near Me"
          color="#FF9500"
          onPress={() => router.push('/(main)/(tabs)/near-me')}
        />
        <ActionButton
          icon="chatbubbles-outline"
          label="Community"
          color="#34C759"
          onPress={() => router.push('/(main)/(tabs)/people')}
        />
      </View>

      {/* ── Alert dogs slider (lost / health issues) ── */}
      {alertDogs.length > 0 && (
        <View style={styles.alertSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.alertTitleWrap}>
              <Ionicons name="alert-circle" size={18} color="#FF3B30" />
              <Text style={styles.alertTitle}>Needs Attention</Text>
              <View style={styles.alertCount}>
                <Text style={styles.alertCountText}>{alertDogs.length}</Text>
              </View>
            </View>
            <Text style={styles.seeAll}>Swipe to scroll</Text>
          </View>
          <FlatList
            data={alertDogs}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => d.id}
            contentContainerStyle={styles.alertList}
            renderItem={({ item }) => (
              <AlertDogCard dog={item} onPress={handleDogPress} />
            )}
          />
        </View>
      )}

      {/* ── Dogs Near You ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dogs Near You</Text>
        {!isLoading && (
          <Text style={styles.sectionCount}>{sortedDogs.length} found</Text>
        )}
      </View>

      {/* Radius selector */}
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
    </>
  );

  const ListEmpty = isLoading ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>🐾</Text>
      <Text style={styles.emptyText}>Loading dogs...</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>🐾</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? `No dogs found for "${searchQuery}"` : 'No dogs found nearby'}
      </Text>
      <Text style={styles.emptySub}>Try a wider radius or add the first dog!</Text>
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => { getCurrentLocation(); refetch(); }}
      >
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Filter modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter dogs</Text>
              <TouchableOpacity
                onPress={() => {
                  setFilterGender('all');
                  setFilterCondition('all');
                  setFilterSterilized('all');
                }}
              >
                <Text style={styles.filterReset}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Gender</Text>
            <View style={styles.chips}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, filterGender === opt.value && styles.chipActive]}
                  onPress={() => setFilterGender(opt.value)}
                >
                  <Text style={[styles.chipText, filterGender === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sterilization</Text>
            <View style={styles.chips}>
              {STERILIZED_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, filterSterilized === opt.value && styles.chipActive]}
                  onPress={() => setFilterSterilized(opt.value as any)}
                >
                  <Text style={[styles.chipText, filterSterilized === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Condition</Text>
            <View style={[styles.chips, { marginBottom: 24 }]}>
              {CONDITION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, filterCondition === opt.value && styles.chipActive]}
                  onPress={() => setFilterCondition(opt.value)}
                >
                  <Text style={[styles.chipText, filterCondition === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Location picker */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
      />

      <FlatList
        data={sortedDogs}
        renderItem={renderDogCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={sortedDogs.length === 0 ? styles.listEmpty : styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={10}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
      />
    </SafeAreaView>
  );
}

// ─── ActionButton ──────────────────────────────────────────────────
const ActionButton = ({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greetSection: {},
  greeting: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  profileBtn: {},
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },
  locationText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    maxWidth: width * 0.55,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.card,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: colors.secondary },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 54, height: 54, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },

  // Alert dogs slider
  alertSection: { marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  alertTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  alertCount: {
    backgroundColor: '#FF3B30',
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  alertCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  seeAll: { fontSize: 12, color: colors.textSecondary },
  alertList: { paddingHorizontal: 16, gap: 12 },
  alertCard: {
    width: ALERT_CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FF3B30' + '40',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  alertImage: {
    width: '100%',
    height: ALERT_CARD_WIDTH * 0.75,
    backgroundColor: colors.surface,
  },
  alertImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  alertBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  alertBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  alertInfo: { padding: 10 },
  alertName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  alertColor: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  alertReason: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },

  // Dogs section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionCount: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Radius
  radiusRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  radiusBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  radiusBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radiusText: { fontSize: 13, fontWeight: '600', color: colors.text },
  radiusTextActive: { color: '#fff' },

  list: { paddingBottom: 24 },
  listEmpty: { flexGrow: 1, paddingBottom: 24 },

  // Empty state
  emptyBox: { padding: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  refreshText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  filterModal: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  filterTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  filterReset: { fontSize: 14, color: colors.primary, fontWeight: '600', marginRight: 4 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#fff' },
  applyBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Location picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '70%',
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  pickerCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    marginBottom: 16,
  },
  pickerCurrentLabel: { fontSize: 15, fontWeight: '600', color: colors.primary },
  pickerCurrentSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  pickerSectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    marginBottom: 8,
  },
  pickerLocRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerLocLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  pickerLocSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  defaultBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  pickerManageBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pickerManageBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
});
