import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useLocationStore } from '../../../store/location.store';
import { useDogs } from '../../../hooks/useDogs';
import { colors, RADIUS_OPTIONS } from '../../../constants';

export default function NearMeScreen() {
  const router = useRouter();
  const { currentLocation, getCurrentLocation } = useLocationStore();
  const [radius, setRadius] = useState(5);
  const lat = currentLocation?.latitude ?? 28.5355;
  const lng = currentLocation?.longitude ?? 77.3910;

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const { useNearbyDogs } = useDogs();
  const { data: dogs } = useNearbyDogs({
    latitude: lat,
    longitude: lng,
    radius,
  });

  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: radius * 0.05,
    longitudeDelta: radius * 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Near Me</Text>
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
            onCalloutPress={() => router.push(`/(main)/dog/${dog.id}`)}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  radiusRow: { flexDirection: 'row', marginBottom: 8 },
  radiusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  radiusBtnActive: { backgroundColor: colors.primary },
  radiusText: { fontSize: 14, fontWeight: '600', color: colors.text },
  radiusTextActive: { color: colors.textOnPrimary },
  map: { flex: 1, width: '100%' },
});
