import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth.store';
import { useLocationStore } from '../../../store/location.store';
import { useDogs } from '../../../hooks/useDogs';
import DogCard from '../../../components/dog/DogCard';
import { colors, RADIUS_OPTIONS } from '../../../constants';
import { Dog } from '../../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentLocation, locationName, getCurrentLocation } = useLocationStore();
  const [selectedRadius, setSelectedRadius] = useState(5);

  React.useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const { useNearbyDogs } = useDogs();
  const { data: dogs, isLoading } = useNearbyDogs({
    latitude: currentLocation?.latitude || 0,
    longitude: currentLocation?.longitude || 0,
    radius: selectedRadius,
  });

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const renderDogCard = useCallback(({ item }: { item: Dog }) => (
    <DogCard dog={item} onPress={handleDogPress} />
  ), [handleDogPress]);

  const keyExtractor = useCallback((item: Dog) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🐕</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(main)/notifications')}>
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(main)/profile')}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.location}>📍 {locationName || 'Getting location...'}</Text>
      </View>

      {/* Radius Selector */}
      <View style={styles.radiusContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RADIUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radiusButton,
                selectedRadius === option.value && styles.radiusButtonActive,
              ]}
              onPress={() => setSelectedRadius(option.value)}
            >
              <Text
                style={[
                  styles.radiusText,
                  selectedRadius === option.value && styles.radiusTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickAction
          icon="📷"
          label="Scan QR"
          onPress={() => router.push('/(main)/scan-qr')}
        />
        <QuickAction
          icon="➕"
          label="Add Dog"
          onPress={() => router.push('/(main)/add-dog')}
        />
        <QuickAction
          icon="🔴"
          label="Report Lost"
          onPress={() => router.push('/(main)/report/lost')}
        />
        <QuickAction
          icon="🟢"
          label="Report Found"
          onPress={() => router.push('/(main)/report/found')}
        />
      </View>

      {/* Dog List */}
      <FlatList
        data={dogs || []}
        renderItem={renderDogCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading dogs...' : 'No dogs found nearby'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={styles.quickActionLabel}>{label}</Text>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifBtn: { padding: 8 },
  notifIcon: { fontSize: 22 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  radiusContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  radiusButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  radiusTextActive: {
    color: colors.textOnPrimary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
