import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useReports } from '@/hooks/useReports';
import { useLocationStore } from '@/store/location.store';
import { useImageUpload } from '@/hooks/useImageUpload';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { colors } from '@/constants';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReportFoundScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dog_id?: string }>();
  const { useCreateReport } = useReports();
  const createReport = useCreateReport();
  const { currentLocation } = useLocationStore();
  const { pickImage, uploadImage, isUploading } = useImageUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  const handlePickImage = async () => {
    const asset = await pickImage();
    if (asset?.uri) {
      try {
        const url = await uploadImage(asset.uri, 'reports');
        setImageUrl(url);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    const lat = currentLocation?.latitude ?? 28.5355;
    const lng = currentLocation?.longitude ?? 77.3910;
    try {
      await createReport.mutateAsync({
        type: 'found',
        title: data.title,
        description: data.description,
        image_url: imageUrl || undefined,
        latitude: lat,
        longitude: lng,
        dog_id: params.dog_id,
      });
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Found</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.photoBox} onPress={handlePickImage}>
          <Text style={styles.photoText}>{imageUrl ? 'Photo added' : 'PHOTO (optional)'}</Text>
        </TouchableOpacity>
        <Controller control={control} name="title" render={({ field }) => <Input label="Title" placeholder="Brief title" value={field.value} onChangeText={field.onChange} error={errors.title?.message} />} />
        <Controller control={control} name="description" render={({ field }) => <Input label="Description" placeholder="Details" value={field.value} onChangeText={field.onChange} />} />
        <Text style={styles.hint}>Location will be attached automatically.</Text>
        <Button title="Submit" variant="primary" size="large" fullWidth loading={createReport.isPending || isUploading} onPress={handleSubmit(onSubmit)} />
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
  photoBox: { height: 120, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  photoText: { fontSize: 14, color: colors.textSecondary },
  hint: { fontSize: 12, color: colors.textLight, marginBottom: 16 },
});
