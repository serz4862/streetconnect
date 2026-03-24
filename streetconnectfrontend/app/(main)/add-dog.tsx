import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useDogs } from '../../hooks/useDogs';
import { useLocationStore } from '../../store/location.store';
import { useImageUpload } from '../../hooks/useImageUpload';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../constants';
import { apiService } from '../../services/api';
import { proxyImageUrl } from '../../services/imageProxy';

const schema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  is_sterilized: z.boolean(),
  age_approx: z.number().min(0).max(30).optional(),
  health_status: z.enum(['healthy', 'sick', 'injured', 'critical', 'unknown']),
  health_notes: z.string().optional(),
  description: z.string().optional(),
}).refine(
  (d) => !(d.gender === 'male' && d.is_sterilized),
  { message: 'Male dogs cannot be marked as sterilized', path: ['is_sterilized'] }
);

type FormData = z.infer<typeof schema>;

const GENDER_OPTIONS: { value: FormData['gender']; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'unknown', label: 'Unknown', icon: '?' },
];

const HEALTH_OPTIONS: { value: FormData['health_status']; label: string; color: string }[] = [
  { value: 'healthy', label: 'Healthy', color: colors.success },
  { value: 'sick', label: 'Sick', color: colors.statusSick },
  { value: 'injured', label: 'Injured', color: colors.statusInjured },
  { value: 'critical', label: 'Critical', color: colors.statusCritical },
  { value: 'unknown', label: 'Unknown', color: colors.textSecondary },
];

export default function AddDogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id || null;
  const isEditing = !!editId;

  const { useCreateDog, useUpdateDog, useDog } = useDogs();
  const createDog = useCreateDog();
  const updateDog = useUpdateDog();
  const { currentLocation } = useLocationStore();
  const { pickImage, takePhoto, uploadImage, isUploading } = useImageUpload();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLocalUri, setImageLocalUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageValidating, setImageValidating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Fetch existing dog for edit mode
  const { data: existingDog } = useDog(editId || '');

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'unknown',
      is_sterilized: false,
      health_status: 'unknown',
    },
  });

  const gender = useWatch({ control, name: 'gender' });

  // Pre-fill form with existing dog data when editing
  useEffect(() => {
    if (isEditing && existingDog && !prefilled) {
      reset({
        name: existingDog.name ?? '',
        color: existingDog.color ?? '',
        gender: existingDog.gender ?? 'unknown',
        is_sterilized: existingDog.is_sterilized ?? false,
        age_approx: existingDog.age_approx,
        health_status: existingDog.health_status ?? 'unknown',
        health_notes: existingDog.health_notes ?? '',
        description: existingDog.description ?? '',
      });
      if (existingDog.image_url) {
        setImageUrl(existingDog.image_url);
        setImageLocalUri(existingDog.image_url);
      }
      setPrefilled(true);
    }
  }, [existingDog, isEditing, prefilled, reset]);

  const processImage = async (uri: string) => {
    setImageError(null);
    setImageUrl(null);
    setImageLocalUri(uri);
    setImageValidating(true);
    try {
      const url = await uploadImage(uri, 'dogs');
      try {
        await apiService.validateDogImage(url);
        setImageUrl(url);
      } catch (err: any) {
        const msg =
          err?.error?.error ??
          err?.message ??
          'This is not a dog. Please upload a photo of a dog.';
        setImageError(msg);
        setImageLocalUri(null);
      }
    } catch (err: any) {
      setImageError(err?.message ?? 'Failed to upload image. Please try again.');
      setImageLocalUri(null);
    } finally {
      setImageValidating(false);
    }
  };

  const handlePickImage = async () => {
    const asset = await pickImage({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (asset?.uri) await processImage(asset.uri);
  };

  const handleTakePhoto = async () => {
    const asset = await takePhoto({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (asset?.uri) await processImage(asset.uri);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    const lat = currentLocation?.latitude ?? 28.5355;
    const lng = currentLocation?.longitude ?? 77.3910;
    try {
      if (isEditing && editId) {
        await updateDog.mutateAsync({
          id: editId,
          data: {
            ...data,
            ...(imageUrl !== existingDog?.image_url ? { image_url: imageUrl ?? undefined } : {}),
            latitude: lat,
            longitude: lng,
          },
        });
        router.replace(`/(main)/dog/${editId}`);
      } else {
        const res: any = await createDog.mutateAsync({
          ...data,
          image_url: imageUrl ?? undefined,
          latitude: lat,
          longitude: lng,
        });
        router.replace(`/(main)/dog/${res.dog?.id}`);
      }
    } catch (err: any) {
      const message =
        err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Something went wrong.';
      setSubmitError(message);
    }
  };

  const isProcessing = isUploading || imageValidating;
  const displayImageUri = imageLocalUri
    ? (imageLocalUri.startsWith('file://') || imageLocalUri.startsWith('data:')
        ? imageLocalUri
        : proxyImageUrl(imageLocalUri))
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Dog' : 'Add Dog'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location hint */}
        {currentLocation && (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationBannerText}>
              Location will be saved with this dog
            </Text>
          </View>
        )}

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoPreview}>
            {isProcessing ? (
              <View style={styles.photoPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>
                  {isUploading ? 'Uploading...' : "Checking if it's a dog..."}
                </Text>
              </View>
            ) : displayImageUri ? (
              <Image source={{ uri: displayImageUri }} style={styles.photoImage} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>🐕</Text>
                <Text style={styles.photoPlaceholderText}>Add a photo</Text>
              </View>
            )}
            {imageUrl && !isProcessing ? (
              <View style={styles.validBadge}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.validBadgeText}>Dog verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.photoBtn, isProcessing && styles.photoBtnDisabled]}
              onPress={handleTakePhoto}
              disabled={isProcessing}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoBtn, isProcessing && styles.photoBtnDisabled]}
              onPress={handlePickImage}
              disabled={isProcessing}
            >
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageError ? (
            <View style={styles.imageErrorBox}>
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <Text style={styles.imageErrorText}>{imageError}</Text>
            </View>
          ) : null}
        </View>

        {/* Name */}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Name (optional)"
              placeholder="e.g. Bruno"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.name?.message}
            />
          )}
        />

        {/* Color */}
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <Input
              label="Color"
              placeholder="e.g. Golden, Black & White"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              label="Description (optional)"
              placeholder="Distinctive marks, behaviour, area usually found..."
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {/* Gender */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Controller
                key={opt.value}
                control={control}
                name="gender"
                render={({ field }) => (
                  <TouchableOpacity
                    style={[styles.optionBtn, field.value === opt.value && styles.optionBtnActive]}
                    onPress={() => {
                      field.onChange(opt.value);
                      if (opt.value === 'male') setValue('is_sterilized', false);
                    }}
                  >
                    <Text style={styles.optionIcon}>{opt.icon}</Text>
                    <Text style={[styles.optionText, field.value === opt.value && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ))}
          </View>
        </View>

        {/* Sterilized — only for female or unknown */}
        {gender !== 'male' ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sterilized</Text>
            <View style={styles.optionRow}>
              <Controller
                control={control}
                name="is_sterilized"
                render={({ field }) => (
                  <>
                    <TouchableOpacity
                      style={[styles.optionBtn, field.value && styles.optionBtnActive]}
                      onPress={() => field.onChange(true)}
                    >
                      <Text style={[styles.optionText, field.value && styles.optionTextActive]}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionBtn, !field.value && styles.optionBtnActive]}
                      onPress={() => field.onChange(false)}
                    >
                      <Text style={[styles.optionText, !field.value && styles.optionTextActive]}>No</Text>
                    </TouchableOpacity>
                  </>
                )}
              />
            </View>
            {errors.is_sterilized && (
              <Text style={styles.fieldError}>{errors.is_sterilized.message}</Text>
            )}
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Male dogs are not marked as sterilized</Text>
          </View>
        )}

        {/* Age */}
        <Controller
          control={control}
          name="age_approx"
          render={({ field }) => (
            <Input
              label="Approx. Age (years)"
              placeholder="e.g. 3"
              value={field.value != null ? String(field.value) : ''}
              onChangeText={(t) => field.onChange(t ? parseInt(t, 10) : undefined)}
              keyboardType="number-pad"
            />
          )}
        />

        {/* Health Status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Health Status</Text>
          <View style={styles.optionRow}>
            {HEALTH_OPTIONS.map((opt) => (
              <Controller
                key={opt.value}
                control={control}
                name="health_status"
                render={({ field }) => (
                  <TouchableOpacity
                    style={[
                      styles.healthBtn,
                      field.value === opt.value && { backgroundColor: opt.color + '20', borderColor: opt.color },
                    ]}
                    onPress={() => field.onChange(opt.value)}
                  >
                    <Text
                      style={[
                        styles.healthBtnText,
                        field.value === opt.value && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ))}
          </View>
        </View>

        {/* Health Notes */}
        <Controller
          control={control}
          name="health_notes"
          render={({ field }) => (
            <Input
              label="Health Notes (optional)"
              placeholder="Any additional notes about the dog's health"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {submitError ? (
          <View style={styles.imageErrorBox}>
            <Ionicons name="warning" size={18} color={colors.error} />
            <Text style={styles.imageErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <View style={{ height: 16 }} />

        <Button
          title={isEditing ? 'Save Changes' : 'Add Dog'}
          variant="primary"
          size="large"
          fullWidth
          loading={(isEditing ? updateDog.isPending : createDog.isPending) || isProcessing}
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
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  locationBannerText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  // Photo
  photoSection: { marginBottom: 24 },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', gap: 8 },
  photoEmoji: { fontSize: 56 },
  photoPlaceholderText: { fontSize: 14, color: colors.textSecondary },
  processingText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  validBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  validBadgeText: { fontSize: 12, fontWeight: '600', color: colors.success },
  photoButtons: { flexDirection: 'row', gap: 12 },
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
  photoBtnDisabled: { opacity: 0.4 },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  imageErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '12',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  imageErrorText: { flex: 1, fontSize: 13, color: colors.error },

  // Fields
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  fieldError: { fontSize: 12, color: colors.error, marginTop: 4 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionIcon: { fontSize: 16 },
  optionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  infoText: { fontSize: 13, color: colors.textSecondary },

  // Health options
  healthBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  healthBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
});
