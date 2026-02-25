import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLocationStore } from '../../store/location.store';
import { SavedLocation } from '../../types';
import { colors } from '../../constants';

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
    locationName,
  } = useLocationStore();

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [labelError, setLabelError] = useState('');

  useEffect(() => {
    if (!savedLocationsLoaded) loadSavedLocations();
  }, []);

  const handleAdd = useCallback(async () => {
    if (!label.trim()) { setLabelError('Enter a label'); return; }
    if (!currentLocation) { setLabelError('No current location. Go back and set your location first.'); return; }
    setLabelError('');
    setSaving(true);
    try {
      await saveLocation({
        label: label.trim(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_name: locationName ?? undefined,
      });
      setAdding(false);
      setLabel('');
    } catch (err: any) {
      setLabelError(err?.error?.error ?? err?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }, [label, currentLocation, locationName, saveLocation]);

  const handleDelete = useCallback((item: SavedLocation) => {
    Alert.alert('Delete Location', `Delete "${item.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
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
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{item.label}</Text>
          {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
        </View>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.location_name ?? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUse(item)}>
          <Text style={styles.actionUse}>Use</Text>
        </TouchableOpacity>
        {!item.is_default && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item)}>
            <Text style={styles.actionDefault}>Set default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.actionDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setAdding(true); setLabel(''); setLabelError(''); }}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {!savedLocationsLoaded ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : savedLocations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyText}>No saved locations yet.</Text>
          <Text style={styles.emptyHint}>
            Tap "+ Add" to save your current location with a label like "Home" or "Office".
          </Text>
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

      {/* Add location modal */}
      <Modal visible={adding} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save Current Location</Text>
            {currentLocation ? (
              <Text style={styles.modalSub}>
                {locationName ?? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}
              </Text>
            ) : (
              <Text style={[styles.modalSub, { color: colors.error }]}>
                No current location detected. Please set your location first.
              </Text>
            )}
            <TextInput
              style={styles.input}
              placeholder='Label (e.g. "Home", "Colony Gate")'
              placeholderTextColor={colors.textLight}
              value={label}
              onChangeText={setLabel}
              maxLength={60}
              autoFocus
            />
            {labelError ? <Text style={styles.inputError}>{labelError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setAdding(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSave, (saving || !currentLocation) && styles.disabled]}
                onPress={handleAdd}
                disabled={saving || !currentLocation}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 22, color: colors.text },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardInfo: { gap: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '700', color: colors.text },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  locationName: { fontSize: 13, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  actionUse: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  actionDefault: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  actionDelete: { fontSize: 13, color: colors.error, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { fontSize: 13, color: colors.error },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancel: { backgroundColor: colors.surface },
  modalSave: { backgroundColor: colors.primary },
  disabled: { opacity: 0.5 },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
