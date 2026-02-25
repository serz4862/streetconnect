import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useReports } from '../../../hooks/useReports';
import { useLocationStore } from '../../../store/location.store';
import { useImageUpload } from '../../../hooks/useImageUpload';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { colors } from '../../../constants';

// ─── Schema ───────────────────────────────────────────────────────
const ISSUE_TYPES = [
  { value: 'injury',     label: 'Injury',         icon: 'bandage',        color: '#FF3B30' },
  { value: 'illness',    label: 'Illness',         icon: 'thermometer',    color: '#FF9500' },
  { value: 'abuse',      label: 'Abuse',           icon: 'hand-left',      color: '#AF52DE' },
  { value: 'aggression', label: 'Aggression',      icon: 'warning',        color: '#FF6B35' },
  { value: 'starvation', label: 'Starvation',      icon: 'nutrition',      color: '#8B4513' },
  { value: 'roadkill',   label: 'Road accident',   icon: 'car',            color: '#FF2D55' },
  { value: 'trapped',    label: 'Trapped',         icon: 'grid',           color: '#5856D6' },
  { value: 'other',      label: 'Other',           icon: 'ellipsis-horizontal', color: '#8E8E93' },
] as const;

const SEVERITY_LEVELS = [
  { value: 'low',      label: 'Low',      desc: 'Minor, not urgent',         color: '#34C759' },
  { value: 'medium',   label: 'Medium',   desc: 'Needs attention soon',      color: '#FF9500' },
  { value: 'high',     label: 'High',     desc: 'Urgent care needed',        color: '#FF3B30' },
  { value: 'critical', label: 'Critical', desc: 'Life-threatening, act now', color: '#AF52DE' },
] as const;

const schema = z.object({
  issue_type: z.string().min(1, 'Select an issue type'),
  severity: z.string().min(1, 'Select severity'),
  title: z.string().min(3, 'Please describe the issue (min 3 chars)'),
  description: z.string().optional(),
  needs_vet: z.boolean(),
  needs_rescue: z.boolean(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReportIssueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dog_id?: string }>();
  const { useCreateReport } = useReports();
  const createReport = useCreateReport();
  const { currentLocation, locationName } = useLocationStore();
  const { pickImage, takePhoto, uploadImage, isUploading } = useImageUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLocalUri, setImageLocalUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      issue_type: '',
      severity: '',
      title: '',
      description: '',
      needs_vet: false,
      needs_rescue: false,
      contact_name: '',
      contact_phone: '',
    },
  });

  const severity = watch('severity');
  const issueType = watch('issue_type');

  const handlePickImage = useCallback(async () => {
    const asset = await pickImage({ allowsEditing: true, quality: 0.8 });
    if (!asset?.uri) return;
    setImageLocalUri(asset.uri);
    setImageUploading(true);
    try {
      const url = await uploadImage(asset.uri, 'reports');
      setImageUrl(url);
    } catch (err: any) {
      setSubmitError('Photo upload failed: ' + (err?.message || 'Try again'));
    } finally {
      setImageUploading(false);
    }
  }, [pickImage, uploadImage]);

  const handleTakePhoto = useCallback(async () => {
    const asset = await takePhoto({ allowsEditing: true, quality: 0.8 });
    if (!asset?.uri) return;
    setImageLocalUri(asset.uri);
    setImageUploading(true);
    try {
      const url = await uploadImage(asset.uri, 'reports');
      setImageUrl(url);
    } catch (err: any) {
      setSubmitError('Photo upload failed: ' + (err?.message || 'Try again'));
    } finally {
      setImageUploading(false);
    }
  }, [takePhoto, uploadImage]);

  const onSubmit = useCallback(async (data: FormData) => {
    setSubmitError(null);
    const lat = currentLocation?.latitude ?? 28.5355;
    const lng = currentLocation?.longitude ?? 77.3910;
    try {
      const title = `[${data.issue_type.toUpperCase()}] ${data.title}`;
      const fullDesc = [
        data.description,
        data.needs_vet ? '⚕️ Veterinary care needed' : '',
        data.needs_rescue ? '🚨 Rescue needed' : '',
        data.contact_name ? `Contact: ${data.contact_name}${data.contact_phone ? ` (${data.contact_phone})` : ''}` : '',
        locationName ? `Location: ${locationName}` : '',
      ].filter(Boolean).join('\n');

      await createReport.mutateAsync({
        type: 'issue',
        title,
        description: fullDesc || undefined,
        image_url: imageUrl || undefined,
        latitude: lat,
        longitude: lng,
        dog_id: params.dog_id || undefined,
        severity: data.severity,
        issue_type: data.issue_type,
      });
      setSubmitted(true);
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      setSubmitError(err?.error?.error ?? err?.message ?? 'Failed to submit report. Please try again.');
    }
  }, [currentLocation, locationName, imageUrl, params.dog_id, createReport, router]);

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successSub}>Thank you for helping this dog. Going back...</Text>
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
        <View>
          <Text style={styles.headerTitle}>Report an Issue</Text>
          {params.dog_id && <Text style={styles.headerSub}>Linked to dog</Text>}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ─ Issue Type ─ */}
        <Text style={styles.sectionLabel}>What is the issue?</Text>
        <Controller
          control={control}
          name="issue_type"
          render={({ field }) => (
            <View style={styles.typeGrid}>
              {ISSUE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard,
                    field.value === t.value && { borderColor: t.color, backgroundColor: t.color + '15' },
                  ]}
                  onPress={() => field.onChange(t.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={24}
                    color={field.value === t.value ? t.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      field.value === t.value && { color: t.color, fontWeight: '700' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.issue_type && <Text style={styles.errorText}>{errors.issue_type.message}</Text>}

        {/* ─ Severity ─ */}
        <Text style={styles.sectionLabel}>Severity</Text>
        <Controller
          control={control}
          name="severity"
          render={({ field }) => (
            <View style={styles.severityRow}>
              {SEVERITY_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.severityBtn,
                    field.value === s.value && { borderColor: s.color, backgroundColor: s.color + '18' },
                  ]}
                  onPress={() => field.onChange(s.value)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.severityDot, { backgroundColor: s.color }]} />
                  <View>
                    <Text style={[styles.severityLabel, field.value === s.value && { color: s.color, fontWeight: '700' }]}>
                      {s.label}
                    </Text>
                    <Text style={styles.severityDesc}>{s.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.severity && <Text style={styles.errorText}>{errors.severity.message}</Text>}

        {/* Urgent warning */}
        {(severity === 'high' || severity === 'critical') && (
          <View style={styles.urgentBanner}>
            <Ionicons name="alert-circle" size={18} color="#FF3B30" />
            <Text style={styles.urgentText}>
              {severity === 'critical'
                ? 'CRITICAL: Please contact a vet or rescue immediately!'
                : 'HIGH: This dog needs prompt attention.'}
            </Text>
          </View>
        )}

        {/* ─ Title ─ */}
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              label="Brief description *"
              placeholder={
                issueType === 'injury' ? 'e.g. Broken leg near main road' :
                issueType === 'illness' ? 'e.g. Skin disease, unable to walk' :
                'Describe what you observed'
              }
              value={field.value}
              onChangeText={field.onChange}
              error={errors.title?.message}
            />
          )}
        />

        {/* ─ Description ─ */}
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              label="Additional details (optional)"
              placeholder="Any extra info that would help rescuers or vets..."
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {/* ─ Photo ─ */}
        <Text style={styles.sectionLabel}>Photo evidence (optional)</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={[styles.photoBtn, imageUploading && { opacity: 0.5 }]}
            onPress={handleTakePhoto}
            disabled={imageUploading}
          >
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={styles.photoBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, imageUploading && { opacity: 0.5 }]}
            onPress={handlePickImage}
            disabled={imageUploading}
          >
            <Ionicons name="images" size={20} color={colors.primary} />
            <Text style={styles.photoBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {imageUploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading photo...</Text>
          </View>
        )}
        {imageLocalUri && !imageUploading && (
          <View style={styles.photoPreviewRow}>
            <Image source={{ uri: imageLocalUri }} style={styles.photoThumb} />
            {imageUrl ? (
              <View style={styles.photoOk}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.photoOkText}>Photo ready</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={() => { setImageUrl(null); setImageLocalUri(null); }}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─ Location ─ */}
        <View style={styles.locationBox}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationText}>
            {locationName ? locationName : currentLocation
              ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
              : 'Location not available'}
          </Text>
        </View>

        {/* ─ Needs ─ */}
        <Text style={styles.sectionLabel}>What does this dog need?</Text>
        <View style={styles.needsRow}>
          <Controller
            control={control}
            name="needs_vet"
            render={({ field }) => (
              <TouchableOpacity
                style={[styles.needsBtn, field.value && styles.needsBtnActive]}
                onPress={() => field.onChange(!field.value)}
              >
                <Ionicons name="medical" size={18} color={field.value ? '#fff' : '#34C759'} />
                <Text style={[styles.needsBtnText, field.value && { color: '#fff' }]}>Vet Care</Text>
              </TouchableOpacity>
            )}
          />
          <Controller
            control={control}
            name="needs_rescue"
            render={({ field }) => (
              <TouchableOpacity
                style={[styles.needsBtn, field.value && styles.needsBtnRescue]}
                onPress={() => field.onChange(!field.value)}
              >
                <Ionicons name="car" size={18} color={field.value ? '#fff' : '#FF3B30'} />
                <Text style={[styles.needsBtnText, field.value && { color: '#fff' }]}>Rescue</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* ─ Contact ─ */}
        <Text style={styles.sectionLabel}>Your contact (optional)</Text>
        <View style={styles.contactRow}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="contact_name"
              render={({ field }) => (
                <Input
                  label="Your name"
                  placeholder="e.g. Priya"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="contact_phone"
              render={({ field }) => (
                <Input
                  label="Phone"
                  placeholder="10-digit number"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color={colors.error} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <View style={{ height: 12 }} />
        <Button
          title="Submit Report"
          variant="primary"
          size="large"
          fullWidth
          loading={createReport.isPending || imageUploading}
          onPress={handleSubmit(onSubmit)}
        />
        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  headerSub: { fontSize: 12, color: colors.primary, textAlign: 'center', marginTop: 1 },

  content: { padding: 20 },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: colors.text,
    marginBottom: 12, marginTop: 4,
  },

  // Issue type grid
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4,
  },
  typeCard: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  typeLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  // Severity
  severityRow: { gap: 8, marginBottom: 4 },
  severityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  severityLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  severityDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FF3B30' + '50',
    marginBottom: 16,
  },
  urgentText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#FF3B30' },

  // Photo
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  uploadingText: { fontSize: 13, color: colors.textSecondary },
  photoPreviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 12,
    backgroundColor: colors.surface,
    padding: 10, borderRadius: 12,
  },
  photoThumb: { width: 56, height: 56, borderRadius: 10 },
  photoOk: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoOkText: { fontSize: 13, color: colors.success, fontWeight: '600' },

  // Location
  locationBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 10, padding: 10, marginBottom: 20,
  },
  locationText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500' },

  // Needs
  needsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  needsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  needsBtnActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  needsBtnRescue: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
  needsBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },

  // Contact
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },

  // Errors
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.error + '10',
    borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  errorText: { flex: 1, fontSize: 13, color: colors.error, marginBottom: 4 },

  // Success
  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  successSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
});
