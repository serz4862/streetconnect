import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useLocationStore } from '../../../store/location.store';
import { useDogs } from '../../../hooks/useDogs';
import DogCard from '../../../components/dog/DogCard';
import { colors, RADIUS_OPTIONS } from '../../../constants';
import { Dog } from '../../../types';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;

export default function NearMeScreen() {
  const router = useRouter();
  const { currentLocation, getCurrentLocation, locationName } = useLocationStore();
  const [radius, setRadius] = useState(5);
  // Default to South Delhi so you see data even if GPS permission is off
  const lat = currentLocation?.latitude ?? 28.5319;
  const lng = currentLocation?.longitude ?? 77.2195;

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const { useNearbyDogs } = useDogs();
  const { data: dogs, isLoading, refetch } = useNearbyDogs({
    latitude: lat,
    longitude: lng,
    radius,
  });

  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: radius * 0.02,
    longitudeDelta: radius * 0.02,
  };

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const renderDogCard = useCallback(({ item }: { item: Dog }) => (
    <DogCard dog={item} onPress={handleDogPress} />
  ), [handleDogPress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Near Me</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => {
            getCurrentLocation();
            refetch();
          }}>
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.location}>📍 {locationName || 'Getting location...'}</Text>
        
        {/* Radius Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radiusBtn, radius === opt.value && styles.radiusBtnActive]}
              onPress={() => setRadius(opt.value)}
            >
              <Text style={[styles.radiusText, radius === opt.value && styles.radiusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation
          showsMyLocationButton
        >
          {(dogs || []).map((dog) => (
            <Marker
              key={dog.id}
              coordinate={{
                latitude: Number(dog.latitude),
                longitude: Number(dog.longitude),
              }}
              title={dog.name || 'Dog'}
              description={`${dog.breed || 'Unknown breed'} • ${dog.color || 'Unknown color'}`}
              onCalloutPress={() => router.push(`/(main)/dog/${dog.id}`)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Text style={styles.markerText}>🐕</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Dogs List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Dogs in this area ({(dogs || []).length})
          </Text>
        </View>
        
        <FlatList
          data={dogs || []}
          renderItem={renderDogCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🐾</Text>
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading dogs...' : 'No dogs found in this area'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isLoading ? '' : 'Try increasing the radius or refreshing'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: colors.text,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },
  radiusRow: { 
    flexDirection: 'row',
    marginTop: 8,
  },
  radiusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusBtnActive: { 
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: colors.text 
  },
  radiusTextActive: { 
    color: colors.textOnPrimary 
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: colors.surface,
  },
  map: { 
    flex: 1, 
    width: '100%' 
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  list: { 
    paddingBottom: 24 
  },
  empty: { 
    padding: 60, 
    alignItems: 'center' 
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
