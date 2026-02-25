import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLocationStore } from '../../store/location.store';
import { useAuthStore } from '../../store/auth.store';
import { apiService } from '../../services/api';
import Button from '../../components/common/Button';
import { colors } from '../../constants';
import { SavedLocation } from '../../types';

export default function LocationScreen() {
  const router = useRouter();
  const {
    requestPermission,
    getCurrentLocation,
    savedLocations,
    savedLocationsLoaded,
    loadSavedLocations,
    useLocation: useSavedLocation,
  } = useLocationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!savedLocationsLoaded) loadSavedLocations();
  }, []);

  const handleUseMyLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const granted = await requestPermission();
      if (!granted) {
        setError('Location permission is required to show nearby dogs.');
        setLoading(false);
        return;
      }
      await getCurrentLocation();
      const loc = useLocationStore.getState().currentLocation;
      const name = useLocationStore.getState().locationName;
      if (loc) {
        await apiService.updateLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          location_name: name || undefined,
        });
        useAuthStore.getState().updateUser({
          ...useAuthStore.getState().user!,
          latitude: loc.latitude,
          longitude: loc.longitude,
          location_name: name || undefined,
        });
        router.replace('/(onboarding)/role-selection');
      } else {
        setError('Could not get location. Try manual entry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSaved = async (item: SavedLocation) => {
    setLoading(true);
    setError(null);
    try {
      useSavedLocation(item);
      await apiService.updateLocation({
        latitude: item.latitude,
        longitude: item.longitude,
        location_name: item.location_name ?? item.label,
      });
      useAuthStore.getState().updateUser({
        ...useAuthStore.getState().user!,
        latitude: item.latitude,
        longitude: item.longitude,
        location_name: item.location_name ?? item.label,
      });
      router.replace('/(onboarding)/role-selection');
    } catch (err: any) {
      setError(err?.message || 'Failed to use location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoSmall}>
          <Text style={styles.logoEmoji}>🐕</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Where do you care for strays?</Text>
        <Text style={styles.subtitle}>
          We'll use your location to show nearby dogs, community members and updates.
        </Text>

        <View style={styles.illustration}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.pinEmoji}>📍</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={loading ? '' : 'Use My Current Location'}
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          onPress={handleUseMyLocation}
        />
        <Button
          title="Enter Location Manually"
          variant="outline"
          size="large"
          fullWidth
          onPress={() => router.push('/(onboarding)/set-location')}
        />

        {savedLocations.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>Use a saved location</Text>
            {savedLocations.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.savedItem}
                onPress={() => handleUseSaved(loc)}
                disabled={loading}
              >
                <View style={styles.savedItemInfo}>
                  <Text style={styles.savedLabel}>{loc.label}</Text>
                  {loc.location_name ? (
                    <Text style={styles.savedName} numberOfLines={1}>{loc.location_name}</Text>
                  ) : null}
                </View>
                {loc.is_default && (
                  <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
                )}
                <Text style={styles.savedArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 24,
  },
  backButton: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: colors.text },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 22 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40 },
  illustration: {
    height: 200,
    backgroundColor: colors.primaryLight + '40',
    borderRadius: 24,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapEmoji: { fontSize: 64 },
  pinEmoji: { fontSize: 48, marginTop: 8 },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 12 },
  savedSection: { marginTop: 24, gap: 8 },
  savedTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  savedItemInfo: { flex: 1, gap: 2 },
  savedLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  savedName: { fontSize: 13, color: colors.textSecondary },
  savedArrow: { fontSize: 20, color: colors.textLight },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
});
