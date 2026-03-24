import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../store/location.store';
import { SavedLocation } from '../../types';
import { colors } from '../../constants';

const { width, height } = Dimensions.get('window');

// Reverse geocode using expo-location
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results.length > 0) {
      const r = results[0];
      return [r.name, r.street, r.city, r.region].filter(Boolean).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  } catch {/* ignore */}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ─── Map picker modal ─────────────────────────────────────────────
function MapPickerModal({
  visible,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, name: string) => void;
  initialLat: number;
  initialLng: number;
}) {
  const [pin, setPin] = useState({ latitude: initialLat, longitude: initialLng });
  const [label, setLabel] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (visible) {
      setPin({ latitude: initialLat, longitude: initialLng });
      handleResolve(initialLat, initialLng);
    }
  }, [visible, initialLat, initialLng]);

  const handleResolve = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    const name = await reverseGeocode(lat, lng);
    setResolvedName(name);
    setResolving(false);
  }, []);

  const handleMapPress = useCallback((e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    handleResolve(latitude, longitude);
  }, [handleResolve]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setPin({ latitude, longitude });
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
      handleResolve(latitude, longitude);
    } catch {
      Alert.alert('Error', 'Could not get current location');
    }
  }, [handleResolve]);

  const handleConfirm = useCallback(async () => {
    if (!label.trim()) {
      Alert.alert('Label required', 'Please enter a name for this location (e.g. Home, Colony Gate)');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(pin.latitude, pin.longitude, label.trim());
    } finally {
      setSaving(false);
    }
  }, [label, pin, onConfirm]);

  const region: Region = {
    latitude: pin.latitude,
    longitude: pin.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.header}>
          <TouchableOpacity onPress={onClose} style={mapStyles.headerBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={mapStyles.headerTitle}>Pin Location on Map</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={mapStyles.mapWrap}>
          <MapView
            ref={mapRef}
            style={mapStyles.map}
            initialRegion={region}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setPin({ latitude, longitude });
                handleResolve(latitude, longitude);
              }}
              pinColor={colors.primary}
            />
          </MapView>

          {/* Current location button */}
          <TouchableOpacity style={mapStyles.locateBtn} onPress={handleUseCurrentLocation}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>

          {/* Hint */}
          <View style={mapStyles.hintBox}>
            <Ionicons name="information-circle-outline" size={14} color="#fff" />
            <Text style={mapStyles.hintText}>Tap map or drag pin to choose location</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={mapStyles.bottom}>
            {/* Resolved address */}
            <View style={mapStyles.addressBox}>
              <Ionicons name="location" size={16} color={colors.primary} />
              {resolving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={mapStyles.addressText} numberOfLines={2}>{resolvedName}</Text>
              )}
            </View>

            {/* Coordinates */}
            <Text style={mapStyles.coordText}>
              {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
            </Text>

            {/* Label input */}
            <TextInput
              style={mapStyles.labelInput}
              placeholder='Label: e.g. "Home", "Colony Gate", "Vet Clinic"'
              placeholderTextColor={colors.textLight}
              value={label}
              onChangeText={setLabel}
              maxLength={60}
            />

            <TouchableOpacity
              style={[mapStyles.saveBtn, (saving || !label.trim()) && mapStyles.saveBtnDisabled]}
              onPress={handleConfirm}
              disabled={saving || !label.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="bookmark" size={18} color="#fff" />
                  <Text style={mapStyles.saveBtnText}>Save This Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const mapStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  headerBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  locateBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  hintBox: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  hintText: { flex: 1, fontSize: 12, color: '#fff' },
  bottom: {
    backgroundColor: colors.card,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 10,
  },
  addressBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: 10, padding: 10,
  },
  addressText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500' },
  coordText: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  labelInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, backgroundColor: colors.surface,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Main screen ──────────────────────────────────────────────────
export default function SavedLocationsScreen() {
  const router = useRouter();
  const {
    savedLocations,
    savedLocationsLoaded,
    loadSavedLocations,
    saveLocation,
    deleteSavedLocation,
    setDefaultLocation,
    useLocation,
    currentLocation,
  } = useLocationStore();

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!savedLocationsLoaded) loadSavedLocations();
  }, []);

  const handleMapConfirm = useCallback(async (lat: number, lng: number, label: string) => {
    setSaving(true);
    try {
      const name = await reverseGeocode(lat, lng);
      await saveLocation({ label, latitude: lat, longitude: lng, location_name: name });
      setMapPickerVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save location');
    } finally {
      setSaving(false);
    }
  }, [saveLocation]);

  const handleDelete = useCallback((item: SavedLocation) => {
    Alert.alert('Delete Location', `Delete "${item.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteSavedLocation(item.id); }
          catch (err: any) { Alert.alert('Error', err?.message ?? 'Failed to delete'); }
        },
      },
    ]);
  }, [deleteSavedLocation]);

  const handleSetDefault = useCallback(async (item: SavedLocation) => {
    try { await setDefaultLocation(item.id); }
    catch (err: any) { Alert.alert('Error', err?.message ?? 'Failed'); }
  }, [setDefaultLocation]);

  const handleUse = useCallback((item: SavedLocation) => {
    useLocation(item);
    router.back();
  }, [useLocation, router]);

  const renderItem = ({ item }: { item: SavedLocation }) => (
    <View style={[styles.card, item.is_default && styles.cardDefault]}>
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={item.is_default ? 'star' : 'location'}
            size={20}
            color={item.is_default ? '#F59E0B' : colors.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.locationName} numberOfLines={2}>
            {item.location_name || `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}
          </Text>
          <Text style={styles.coordsText}>
            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.useBtn]} onPress={() => handleUse(item)}>
          <Text style={styles.useBtnText}>Use</Text>
        </TouchableOpacity>
        {!item.is_default && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item)}>
            <Ionicons name="star-outline" size={18} color="#F59E0B" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const defaultLat = currentLocation?.latitude ?? 28.6139;
  const defaultLng = currentLocation?.longitude ?? 77.2090;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setMapPickerVisible(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {!savedLocationsLoaded ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : savedLocations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={72} color={colors.border} />
          <Text style={styles.emptyText}>No saved locations yet</Text>
          <Text style={styles.emptyHint}>
            Tap "Add" to pin any location on the map. Your phone's GPS will auto-fill the coordinates.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setMapPickerVisible(true)}>
            <Ionicons name="map" size={18} color="#fff" />
            <Text style={styles.emptyAddBtnText}>Open Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <MapPickerModal
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={handleMapConfirm}
        initialLat={defaultLat}
        initialLng={defaultLng}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  backBtn: { padding: 6, borderRadius: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardDefault: { borderColor: '#F59E0B', backgroundColor: '#FFFDF5' },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  defaultBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  defaultText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  locationName: { fontSize: 13, color: colors.textSecondary, marginBottom: 2, lineHeight: 18 },
  coordsText: { fontSize: 11, color: colors.textLight, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  useBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 14, width: 'auto' as any },
  useBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 14 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
  },
  emptyAddBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
