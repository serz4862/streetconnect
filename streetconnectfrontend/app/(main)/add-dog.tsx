import React, { useState } from 'react';
import { View, Text, StyleSheet,  ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDogs } from '../../hooks/useDogs';
import { useLocationStore } from '../../store/location.store';
import { useImageUpload } from '../../hooks/useImageUpload';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../constants';
import { apiService } from '../../services/api';

const schema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  is_sterilized: z.boolean(),
  age_approx: z.number().min(0).max(30).optional(),
  health_status: z.enum(['healthy', 'sick', 'injured', 'critical', 'unknown']),
  health_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddDogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { useCreateDog, useUpdateDog } = useDogs();
  const createDog = useCreateDog();
  const updateDog = useUpdateDog();
  const { currentLocation } = useLocationStore();
  const { pickImage, takePhoto, uploadImage, isUploading } = useImageUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageValidating, setImageValidating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'unknown',
      is_sterilized: false,
      health_status: 'unknown',
    },
  });

  const processImage = async (uri: string) => {
    setImageError(null);
    setImageUrl(null);
    setImageValidating(true);
    try {
      const url = await uploadImage(uri, 'dogs');
      // Validate right after upload — before user fills the form
      try {
        await apiService.validateDogImage(url);
        setImageUrl(url);
      } catch (err: any) {
        const msg = err?.error?.error ?? err?.message ?? 'This is not a dog. Please upload a photo of a dog.';
        setImageError(msg);
      }
    } catch (err: any) {
      setImageError(err?.message ?? 'Failed to upload image.');
    } finally {
      setImageValidating(false);
    }
  };

  const handlePickImage = async () => {
    const asset = await pickImage();
    if (asset?.uri) await processImage(asset.uri);
  };

  const handleTakePhoto = async () => {
    const asset = await takePhoto();
    if (asset?.uri) await processImage(asset.uri);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    const lat = currentLocation?.latitude ?? 28.5355;
    const lng = currentLocation?.longitude ?? 77.3910;
    try {
      if (params.id) {
        await updateDog.mutateAsync({ id: params.id, data: { ...data, image_url: imageUrl || undefined, latitude: lat, longitude: lng } });
        router.replace(`/(main)/dog/${params.id}`);
      } else {
        const res: any = await createDog.mutateAsync({
          ...data,
          image_url: imageUrl || undefined,
          latitude: lat,
          longitude: lng,
        });
        router.replace(`/(main)/dog/${res.dog?.id}`);
      }
    } catch (err: any) {
      const message = err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Something went wrong.';
      setSubmitError(message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Dog</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBox} onPress={handleTakePhoto} disabled={imageValidating || isUploading}>
            <Text style={styles.photoText}>
              {imageValidating || isUploading ? 'Checking...' : imageUrl ? 'Retake photo' : 'Take photo'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBox} onPress={handlePickImage} disabled={imageValidating || isUploading}>
            <Text style={styles.photoText}>
              {imageValidating || isUploading ? 'Checking...' : imageUrl ? 'Change from gallery' : 'Choose from gallery'}
            </Text>
          </TouchableOpacity>
        </View>
        {imageUrl ? (
          <Text style={styles.imageSuccess}>Dog photo added</Text>
        ) : null}
        {imageError ? (
          <Text style={styles.errorText}>{imageError}</Text>
        ) : null}

        <Controller control={control} name="name" render={({ field }) => <Input label="Name" placeholder="Dog name" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller control={control} name="color" render={({ field }) => <Input label="Color" placeholder="e.g. Golden" value={field.value} onChangeText={field.onChange} />} />
        <View style={styles.row}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.radioRow}>
            {(['male', 'female', 'unknown'] as const).map((g) => (
              <Controller
                key={g}
                control={control}
                name="gender"
                render={({ field }) => (
                  <TouchableOpacity style={[styles.radio, field.value === g && styles.radioActive]} onPress={() => field.onChange(g)}>
                    <Text style={[styles.radioText, field.value === g && styles.radioTextActive]}>{g}</Text>
                  </TouchableOpacity>
                )}
              />
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sterilized</Text>
          <View style={styles.radioRow}>
            <Controller
              control={control}
              name="is_sterilized"
              render={({ field }) => (
                <>
                  <TouchableOpacity style={[styles.radio, field.value && styles.radioActive]} onPress={() => field.onChange(true)}>
                    <Text style={[styles.radioText, field.value && styles.radioTextActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.radio, !field.value && styles.radioActive]} onPress={() => field.onChange(false)}>
                    <Text style={[styles.radioText, !field.value && styles.radioTextActive]}>No</Text>
                  </TouchableOpacity>
                </>
              )}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="age_approx"
          render={({ field }) => (
            <Input
              label="Approx. Age (years)"
              placeholder="0"
              value={field.value != null ? String(field.value) : ''}
              onChangeText={(t) => field.onChange(t ? parseInt(t, 10) : undefined)}
              keyboardType="number-pad"
            />
          )}
        />
        <Controller control={control} name="health_notes" render={({ field }) => <Input label="Health notes" placeholder="Optional" value={field.value} onChangeText={field.onChange} />} />

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <Button
          title="Add Dog"
          variant="primary"
          size="large"
          fullWidth
          loading={createDog.isPending || isUploading || imageValidating}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBox: { flex: 1, height: 120, backgroundColor: colors.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  photoText: { fontSize: 14, color: colors.textSecondary },
  row: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  radioRow: { flexDirection: 'row', gap: 12 },
  radio: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface },
  radioActive: { backgroundColor: colors.primary },
  radioText: { fontSize: 14, color: colors.text },
  radioTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  errorText: { fontSize: 14, color: colors.error, marginBottom: 8 },
  imageSuccess: { fontSize: 13, color: colors.success, marginBottom: 8 },
});
