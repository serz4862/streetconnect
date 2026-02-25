import { format, formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants';
import { useDogs } from '../../../hooks/useDogs';
import { apiService } from '../../../services/api';
import { proxyImageUrl } from '../../../services/imageProxy';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../../../types';

const HERO_HEIGHT = 260;

type Tab = 'details' | 'timeline' | 'photos' | 'caretakers';

interface TimelineEntry {
  id: string;
  type: 'created' | 'info_updated' | 'status_changed' | 'lost' | 'found' | 'fed' | 'report_filed' | 'image_updated' | string;
  date: string;
  title: string;
  description?: string;
  image_url?: string;
  severity?: string;
  actor?: string;
}

export default function DogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useDog, useUpdateDog } = useDogs();
  const { data: dog, isLoading, refetch } = useDog(id || '');
  const updateDog = useUpdateDog();

  const [tab, setTab] = useState<Tab>('details');
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [lostToggling, setLostToggling] = useState(false);

  useEffect(() => {
    if (id) {
      loadActivity();
      loadReports();
    }
  }, [id]);

  const loadActivity = async () => {
    try {
      setActivityLoading(true);
      const data: any = await apiService.getDogActivity(id!);
      setActivity(data.activity || []);
    } catch {
      // silent — if table doesn't exist yet, timeline just shows empty
    } finally {
      setActivityLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data: any = await apiService.getDogReports(id!);
      setReports(data.reports || []);
    } catch {
      // silent
    }
  };

  const handleMessageCaretaker = useCallback(
    (user: User) => {
      router.push({
        pathname: '/(main)/chat/new' as any,
        params: { receiver_id: user.id, receiver_name: user.name || 'Caretaker' },
      });
    },
    [router]
  );

  const handleToggleLost = useCallback(async () => {
    if (!dog || lostToggling) return;
    const isNowLost = !dog.is_lost;
    Alert.alert(
      isNowLost ? 'Mark as Lost?' : 'Mark as Found?',
      isNowLost
        ? `Report ${dog.name || 'this dog'} as lost. It will appear in the "Needs Attention" section.`
        : `Mark ${dog.name || 'this dog'} as found safe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isNowLost ? 'Mark Lost' : 'Mark Found',
          style: isNowLost ? 'destructive' : 'default',
          onPress: async () => {
              setLostToggling(true);
            try {
              await updateDog.mutateAsync({ id: id!, data: { is_lost: isNowLost } });
              await refetch();
              await loadActivity();
              queryClient.invalidateQueries({ queryKey: ['dogs'] });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to update');
            } finally {
              setLostToggling(false);
            }
          },
        },
      ]
    );
  }, [dog, id, lostToggling, updateDog, refetch, queryClient]);

  // Build timeline from activity log
  const timeline: TimelineEntry[] = activity.map((entry: any) => ({
    id: entry.id,
    type: entry.type as TimelineEntry['type'],
    date: entry.created_at,
    title: entry.title,
    description: entry.description,
    image_url: entry.metadata?.image_url as string | undefined,
    severity: entry.metadata?.severity as string | undefined,
    actor: entry.actor?.name,
  }));

  // Collect all photos
  type PhotoItem = { id: string; url: string; label: string; date?: string };
  const allPhotos: PhotoItem[] = [
    ...(dog?.image_url ? [{ id: 'primary', url: dog.image_url, label: 'Primary' }] : []),
    ...reports
      .filter((r: any) => r.image_url)
      .map((r: any) => ({
        id: `report-${r.id}`,
        url: r.image_url as string,
        label: (r.title || r.type || 'Report') as string,
        date: r.created_at as string,
      })),
  ];

  if (isLoading || !dog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isLost = dog.is_lost;
  const hasIssue = ['sick', 'injured', 'critical'].includes(dog.health_status);

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'details', label: 'Details', icon: 'information-circle-outline' },
    { key: 'timeline', label: 'Timeline', icon: 'time-outline' },
    { key: 'photos', label: `Photos${allPhotos.length > 1 ? ` (${allPhotos.length})` : ''}`, icon: 'images-outline' },
    { key: 'caretakers', label: 'People', icon: 'people-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {dog.name || 'Dog Profile'}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/(main)/add-dog?id=${id}`)}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={[styles.heroWrap, isLost && styles.heroBorderLost, hasIssue && !isLost && styles.heroBorderIssue]}>
          {dog.image_url ? (
            <Image
              source={{ uri: proxyImageUrl(dog.image_url) }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderEmoji}>🐕</Text>
              <Text style={styles.heroPlaceholderText}>No photo</Text>
            </View>
          )}

          {/* Status badges */}
          {isLost && (
            <View style={[styles.heroBadge, styles.heroBadgeLost]}>
              <Ionicons name="alert-circle" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>LOST</Text>
            </View>
          )}
          {hasIssue && !isLost && (
            <View style={[styles.heroBadge, styles.heroBadgeIssue]}>
              <Ionicons name="warning" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>{dog.health_status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Name & quick info */}
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{dog.name || 'Unnamed Dog'}</Text>
            <TouchableOpacity
              style={[styles.lostBtn, isLost ? styles.foundBtnStyle : styles.lostBtnStyle, lostToggling && { opacity: 0.6 }]}
              onPress={handleToggleLost}
              disabled={lostToggling}
            >
              {lostToggling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isLost ? 'checkmark-circle' : 'alert-circle'}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.lostBtnText}>{isLost ? 'Mark Found' : 'Mark Lost'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.meta}>
            {dog.location_name ? `📍 ${dog.location_name}` : ''}
            {dog.location_name && dog.last_seen_at ? '  ·  ' : ''}
            {dog.last_seen_at
              ? `Last seen ${formatDistanceToNow(new Date(dog.last_seen_at), { addSuffix: true })}`
              : ''}
          </Text>

          {dog.description ? (
            <Text style={styles.description}>{dog.description}</Text>
          ) : null}

          <View style={styles.chips}>
            {dog.color && (
              <View style={[styles.chip, styles.chipColor]}>
                <Text style={styles.chipText}>{dog.color}</Text>
              </View>
            )}
            {dog.gender !== 'unknown' && (
              <View style={[styles.chip, styles.chipGender]}>
                <Text style={styles.chipText}>{dog.gender === 'male' ? '♂ Male' : '♀ Female'}</Text>
              </View>
            )}
            {dog.is_sterilized && (
              <View style={[styles.chip, styles.chipSterilized]}>
                <Text style={styles.chipText}>Sterilized</Text>
              </View>
            )}
            {dog.age_approx != null && (
              <View style={[styles.chip, styles.chipAge]}>
                <Text style={styles.chipText}>~{dog.age_approx} yrs</Text>
              </View>
            )}
            <View style={[styles.chip, { backgroundColor: healthColor(dog.health_status) + '20' }]}>
              <Text style={[styles.chipText, { color: healthColor(dog.health_status) }]}>
                {dog.health_status.charAt(0).toUpperCase() + dog.health_status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick actions row */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push({ pathname: '/(main)/report/issue', params: { dog_id: id } })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF6B0015' }]}>
              <Ionicons name="warning" size={20} color="#FF6B00" />
            </View>
            <Text style={styles.quickActionLabel}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push({ pathname: '/(main)/log-feed', params: { dog_id: id } } as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Log Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push(`/(main)/add-dog?id=${id}`)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="create" size={20} color="#10B981" />
            </View>
            <Text style={styles.quickActionLabel}>Update Info</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons
                name={t.icon as any}
                size={15}
                color={tab === t.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Details Tab ── */}
        {tab === 'details' && (
          <View style={styles.section}>
            <DetailRow label="Color" value={dog.color} />
            <DetailRow label="Gender" value={dog.gender === 'unknown' ? undefined : dog.gender} />
            <DetailRow label="Sterilized" value={dog.is_sterilized ? 'Yes' : 'No'} />
            <DetailRow label="Age" value={dog.age_approx != null ? `~${dog.age_approx} years` : undefined} />
            <DetailRow label="Health Status" value={dog.health_status} valueColor={healthColor(dog.health_status)} />
            {dog.health_notes && <DetailRow label="Health Notes" value={dog.health_notes} />}
            {dog.location_name && <DetailRow label="Location" value={dog.location_name} />}
            {dog.description && <DetailRow label="Description" value={dog.description} multiline />}
            <DetailRow
              label="Registered"
              value={dog.created_at ? format(new Date(dog.created_at), 'MMM d, yyyy') : undefined}
            />
            {dog.last_fed_at && (
              <DetailRow
                label="Last Fed"
                value={formatDistanceToNow(new Date(dog.last_fed_at), { addSuffix: true })}
              />
            )}
          </View>
        )}

        {/* ── Timeline Tab ── */}
        {tab === 'timeline' && (
          <View style={styles.section}>
            {activityLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : timeline.length === 0 ? (
              <Text style={styles.placeholder}>No activity yet.</Text>
            ) : (
              timeline.map((entry, idx) => (
                <View key={entry.id} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, timelineDotStyle(entry.type)]} />
                    {idx < timeline.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle}>{entry.title}</Text>
                      <Text style={styles.timelineDate}>
                        {format(new Date(entry.date), 'MMM d · h:mm a')}
                      </Text>
                    </View>
                    {entry.actor && (
                      <Text style={styles.timelineActor}>by {entry.actor}</Text>
                    )}
                    {entry.description && (
                      <Text style={styles.timelineDesc}>{entry.description}</Text>
                    )}
                    {entry.severity && (
                      <View style={[styles.severityChip, severityStyle(entry.severity)]}>
                        <Text style={styles.severityText}>{entry.severity} severity</Text>
                      </View>
                    )}
                    {entry.image_url && (
                      <Image
                        source={{ uri: proxyImageUrl(entry.image_url) }}
                        style={styles.timelineImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Photos Tab ── */}
        {tab === 'photos' && (
          <View style={styles.section}>
            {allPhotos.length === 0 ? (
              <Text style={styles.placeholder}>No photos yet.</Text>
            ) : (
              <View style={styles.photosGrid}>
                {allPhotos.map((photo, idx) => (
                  <View key={photo.id} style={styles.photoItem}>
                    <Image
                      source={{ uri: proxyImageUrl(photo.url) }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText} numberOfLines={1}>
                        {idx === 0 ? '⭐ ' : ''}{photo.label}
                      </Text>
                      {photo.date && (
                        <Text style={styles.photoDate}>
                          {format(new Date(photo.date), 'MMM d, yyyy')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Caretakers Tab ── */}
        {tab === 'caretakers' && (
          <View style={styles.section}>
            {dog.caretakers?.length ? (
              dog.caretakers.map((c: User) => (
                <View key={c.id} style={styles.caretakerCard}>
                  <View style={styles.caretakerRow}>
                    {c.avatar_url ? (
                      <Image source={{ uri: proxyImageUrl(c.avatar_url) }} style={styles.caretakerAvatar} />
                    ) : (
                      <View style={[styles.caretakerAvatar, styles.caretakerAvatarPlaceholder]}>
                        <Text style={styles.caretakerAvatarText}>{(c.name || '?')[0]}</Text>
                      </View>
                    )}
                    <View style={styles.caretakerInfo}>
                      <Text style={styles.caretakerName}>{c.name || 'Unknown'}</Text>
                      <Text style={styles.caretakerRole}>{(c as any).caretaker_type || c.role || 'Caretaker'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.messageBtn}
                      onPress={() => handleMessageCaretaker(c)}
                    >
                      <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.placeholder}>No caretakers listed.</Text>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helper components ────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueColor,
  multiline,
}: {
  label: string;
  value?: string | null;
  valueColor?: string;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null, multiline ? styles.detailMultiline : null]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Helper functions ─────────────────────────────────────────────

function healthColor(status: string): string {
  switch (status) {
    case 'healthy': return colors.success;
    case 'sick': return colors.statusSick ?? '#F59E0B';
    case 'injured': return colors.statusInjured ?? '#EF4444';
    case 'critical': return colors.statusCritical ?? '#DC2626';
    default: return colors.textSecondary;
  }
}

function timelineDotStyle(type: string): object {
  switch (type) {
    case 'fed': return { backgroundColor: '#10B981' };
    case 'report_filed': return { backgroundColor: '#EF4444' };
    case 'status_changed': return { backgroundColor: '#F59E0B' };
    case 'lost': return { backgroundColor: '#EF4444' };
    case 'found': return { backgroundColor: '#10B981' };
    case 'created': return { backgroundColor: colors.primary };
    case 'image_updated': return { backgroundColor: '#8B5CF6' };
    case 'info_updated': return { backgroundColor: colors.primary };
    default: return { backgroundColor: colors.border };
  }
}

function severityStyle(severity: string): object {
  const map: Record<string, string> = {
    low: '#10B981', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626',
  };
  const c = map[severity?.toLowerCase()] || colors.textSecondary;
  return { backgroundColor: c + '20', borderColor: c + '60' };
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  editBtn: { padding: 8 },

  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  heroWrap: { height: HERO_HEIGHT, backgroundColor: colors.surface, position: 'relative' },
  heroBorderLost: { borderBottomWidth: 3, borderBottomColor: '#EF4444' },
  heroBorderIssue: { borderBottomWidth: 3, borderBottomColor: '#F59E0B' },
  heroImage: { width: '100%', height: HERO_HEIGHT, backgroundColor: colors.surface },
  heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroPlaceholderEmoji: { fontSize: 64 },
  heroPlaceholderText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  heroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeLost: { backgroundColor: '#EF4444' },
  heroBadgeIssue: { backgroundColor: '#F59E0B' },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  nameBlock: { padding: 16, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, flex: 1, marginRight: 12 },

  lostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  lostBtnStyle: { backgroundColor: '#EF4444' },
  foundBtnStyle: { backgroundColor: '#10B981' },
  lostBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  description: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipColor: { backgroundColor: '#FEF3C7' },
  chipGender: { backgroundColor: '#D1FAE5' },
  chipSterilized: { backgroundColor: '#DBEAFE' },
  chipAge: { backgroundColor: '#F3E8FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 4 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },

  tabsScroll: { backgroundColor: colors.card },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { fontSize: 13, fontWeight: '700', color: colors.primary },

  section: { padding: 16, backgroundColor: colors.background },

  detailRow: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  detailLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  detailMultiline: { lineHeight: 22 },

  placeholder: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: 32 },

  // Timeline
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLine: { width: 28, alignItems: 'center', paddingTop: 3 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineConnector: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4, marginBottom: 0, minHeight: 24 },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 20 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  timelineDate: { fontSize: 11, color: colors.textSecondary, flexShrink: 0 },
  timelineActor: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  timelineDesc: { fontSize: 13, color: colors.text, lineHeight: 18, marginTop: 4 },
  timelineImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 8 },
  severityChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityText: { fontSize: 11, fontWeight: '600', color: colors.text },

  // Photos grid
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: '47%' },
  photoThumb: { width: '100%', height: 140, borderRadius: 12, backgroundColor: colors.surface },
  photoLabel: { paddingTop: 6, paddingHorizontal: 2 },
  photoLabelText: { fontSize: 12, fontWeight: '600', color: colors.text },
  photoDate: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  // Caretakers
  caretakerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  caretakerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  caretakerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  caretakerAvatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caretakerAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  caretakerInfo: { flex: 1 },
  caretakerName: { fontSize: 16, fontWeight: '600', color: colors.text },
  caretakerRole: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  messageBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  messageBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
