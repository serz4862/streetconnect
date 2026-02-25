import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../hooks/useFeed';
import { useDogs } from '../../hooks/useDogs';
import { useLocationStore } from '../../store/location.store';
import { useImageUpload } from '../../hooks/useImageUpload';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../constants';
import { proxyImageUrl } from '../../services/imageProxy';

interface FormData {
  notes: string;
}

export default function LogFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dog_id?: string }>();
  const { useMyDogs } = useDogs();
  const { data: myDogs } = useMyDogs();
  const { useLogFeed } = useFeed();
  const logFeed = useLogFeed();
  const { currentLocation } = useLocationStore();
  const { pickImage, takePhoto, uploadImage, isUploading } = useImageUpload();

  const [selectedDogId, setSelectedDogId] = useState<string>(params.dog_id || '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLocalUri, setImageLocalUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { notes: '' },
  });

  const handlePickImage = async () => {
    try {
      const asset = await pickImage({ allowsEditing: true, quality: 0.8 });
      if (asset?.uri) {
        setImageLocalUri(asset.uri);
        const url = await uploadImage(asset.uri, 'feed');
        setImageUrl(url);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const asset = await takePhoto({ allowsEditing: true, quality: 0.8 });
      if (asset?.uri) {
        setImageLocalUri(asset.uri);
        const url = await uploadImage(asset.uri, 'feed');
        setImageUrl(url);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to take photo');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedDogId) {
      Alert.alert('Select a dog', 'Please select which dog you fed.');
      return;
    }
    try {
      await logFeed.mutateAsync({
        dog_id: selectedDogId,
        notes: data.notes || undefined,
        image_url: imageUrl || undefined,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      });
      setSubmitted(true);
      setTimeout(() => router.back(), 1200);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.error || e?.message || 'Failed to log feed.');
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.successTitle}>Feed Logged!</Text>
          <Text style={styles.successSub}>Going back...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Feed</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dog selector */}
        <Text style={styles.sectionLabel}>Which dog did you feed?</Text>
        {(myDogs || []).length === 0 ? (
          <Text style={styles.emptyText}>No dogs registered yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dogRow}>
            {(myDogs || []).map((dog) => (
              <TouchableOpacity
                key={dog.id}
                style={[styles.dogChip, selectedDogId === dog.id && styles.dogChipActive]}
                onPress={() => setSelectedDogId(dog.id)}
              >
                {dog.image_url ? (
                  <Image
                    source={{ uri: proxyImageUrl(dog.image_url) }}
                    style={styles.dogChipImg}
                  />
                ) : (
                  <View style={[styles.dogChipImg, styles.dogChipImgPlaceholder]}>
                    <Text style={{ fontSize: 20 }}>🐕</Text>
                  </View>
                )}
                <Text style={[styles.dogChipName, selectedDogId === dog.id && styles.dogChipNameActive]} numberOfLines={1}>
                  {dog.name || 'Unnamed'}
                </Text>
                {selectedDogId === dog.id && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Photo */}
        <Text style={styles.sectionLabel}>Photo (optional)</Text>
        {imageLocalUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: imageLocalUri }} style={styles.photoImg} resizeMode="cover" />
            {isUploading && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <TouchableOpacity style={styles.removePhoto} onPress={() => { setImageUrl(null); setImageLocalUri(null); }}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} disabled={isUploading}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage} disabled={isUploading}>
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Notes (optional)"
              placeholder="e.g. Fed dry food, ate well..."
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {currentLocation && (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationText}>Location will be recorded</Text>
          </View>
        )}

        <View style={{ height: 16 }} />

        <Button
          title="Log Feed"
          variant="primary"
          size="large"
          fullWidth
          loading={logFeed.isPending || isUploading}
          onPress={handleSubmit(onSubmit)}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },

  dogRow: { marginBottom: 20 },
  dogChip: {
    alignItems: 'center',
    marginRight: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    width: 80,
  },
  dogChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  dogChipImg: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  dogChipImgPlaceholder: { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  dogChipName: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  dogChipNameActive: { color: colors.primary },

  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  photoPreview: { position: 'relative', marginBottom: 20 },
  photoImg: { width: '100%', height: 180, borderRadius: 16 },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhoto: { position: 'absolute', top: 8, right: 8 },

  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  locationText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  successSub: { fontSize: 15, color: colors.textSecondary },
});
