import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocationStore } from '@/store/location.store';
import { useAuthStore } from '@/store/auth.store';
import { locationService } from '@/services/location';
import { apiService } from '@/services/api';
import Button from '@/components/common/Button';
import { colors } from '@/constants';

type SearchResult = { latitude: number; longitude: number; name: string };

export default function SetLocationScreen() {
  const router = useRouter();
  const { requestPermission, getCurrentLocation, hasPermission: permissionGranted } = useLocationStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const searchLocation = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    const list = await locationService.geocodeAddress(query.trim());
    setResults(list);
    setSearching(false);
  }, [query]);

  const handleConfirm = async () => {
    if (selected) {
      setLoading(true);
      try {
        await apiService.updateLocation({
          latitude: selected.latitude,
          longitude: selected.longitude,
          location_name: selected.name,
        });
        await apiService.completeOnboarding();
        useAuthStore.getState().updateUser({
          ...useAuthStore.getState().user!,
          onboarding_completed: true,
          latitude: selected.latitude,
          longitude: selected.longitude,
          location_name: selected.name,
        });
        router.replace('/(main)/(tabs)/home');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    const granted = await requestPermission();
    if (!granted) return;
    await getCurrentLocation();
    const loc = useLocationStore.getState().currentLocation;
    const name = useLocationStore.getState().locationName;
    if (loc) {
      setSelected({ latitude: loc.latitude, longitude: loc.longitude, name: name || 'Current Location' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set your location</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for building, area, or street"
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchLocation}
          returnKeyType="search"
        />

        <View style={styles.nearby}>
          <Text style={styles.pin}>📍</Text>
          <View style={styles.nearbyText}>
            <Text style={styles.currentLabel}>Current Location</Text>
            <Text style={styles.status}>{permissionGranted ? 'Available' : 'Location Access is off'}</Text>
          </View>
          <TouchableOpacity style={styles.turnOn} onPress={handleUseCurrentLocation}>
            <Text style={styles.turnOnText}>Turn On</Text>
          </TouchableOpacity>
        </View>

        {searching ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultRow, selected?.latitude === item.latitude && styles.resultRowSelected]}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.resultPin}>📍</Text>
                <Text style={styles.resultName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={query.length > 2 ? <Text style={styles.noResults}>No results. Try different keywords.</Text> : null}
          />
        )}

        {selected && (
          <Button
            title="Confirm"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleConfirm}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  content: { flex: 1, paddingHorizontal: 20 },
  searchInput: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  nearby: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pin: { fontSize: 24, marginRight: 12 },
  nearbyText: { flex: 1 },
  currentLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  status: { fontSize: 14, color: colors.textSecondary },
  turnOn: { paddingVertical: 8, paddingHorizontal: 16 },
  turnOnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  loader: { marginVertical: 24 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultRowSelected: { backgroundColor: colors.primaryLight + '40' },
  resultPin: { marginRight: 12, fontSize: 18 },
  resultName: { flex: 1, fontSize: 16, color: colors.text },
  noResults: { padding: 24, textAlign: 'center', color: colors.textSecondary },
});
