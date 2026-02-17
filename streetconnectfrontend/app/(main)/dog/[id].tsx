import { format, formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/common/Button';
import { colors } from '../../../constants';
import { useDogs } from '../../../hooks/useDogs';
import { useFeed } from '../../../hooks/useFeed';
import { User } from '../../../types';

const HERO_HEIGHT = 220;

export default function DogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { useDog } = useDogs();
  const { useDogFeedHistory } = useFeed();
  const { data: dog, isLoading } = useDog(id || '');
  const { data: feedLogs = [], isLoading: historyLoading } = useDogFeedHistory(id || '', { limit: 50 });
  const [tab, setTab] = useState<'details' | 'history' | 'caretakers'>('details');

  const handleMessageCaretaker = useCallback(
    (user: User) => {
      router.push({
        pathname: '/(main)/chat/new' as any,
        params: { receiver_id: user.id, receiver_name: user.name || 'Caretaker' },
      });
    },
    [router]
  );

  if (isLoading || !dog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dog Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {dog.image_url ? (
            <Image source={{ uri: dog.image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderEmoji}>🐕</Text>
              <Text style={styles.heroPlaceholderText}>No photo</Text>
            </View>
          )}
        </View>

        {/* Name & meta */}
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{dog.name || 'Unnamed Dog'}</Text>
          <Text style={styles.meta}>
            Last seen {dog.last_seen_at ? formatDistanceToNow(new Date(dog.last_seen_at), { addSuffix: true }) : 'Unknown'}
          </Text>
          {(dog.color || dog.gender !== 'unknown') && (
            <View style={styles.chips}>
              {dog.color && (
                <View style={[styles.chip, styles.chipColor]}>
                  <Text style={styles.chipText}>{dog.color}</Text>
                </View>
              )}
              {dog.gender !== 'unknown' && (
                <View style={[styles.chip, styles.chipGender]}>
                  <Text style={styles.chipText}>{dog.gender === 'male' ? 'Male' : 'Female'}</Text>
                </View>
              )}
              {dog.is_sterilized && (
                <View style={[styles.chip, styles.chipSterilized]}>
                  <Text style={styles.chipText}>Sterilized</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['details', 'history', 'caretakers'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'details' ? 'Details' : t === 'history' ? 'History' : 'Caretakers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'details' && (
          <View style={styles.section}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{dog.color || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{dog.gender === 'unknown' ? '—' : dog.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sterilized</Text>
              <Text style={styles.detailValue}>{dog.is_sterilized ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{dog.age_approx != null ? `~${dog.age_approx} yrs` : '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Health</Text>
              <Text style={styles.detailValue}>{dog.health_status}</Text>
            </View>
            {dog.health_notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Health notes</Text>
                <Text style={styles.detailValue}>{dog.health_notes}</Text>
              </View>
            )}
            {dog.location_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{dog.location_name}</Text>
              </View>
            )}
            {dog.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{dog.description}</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'history' && (
          <View style={styles.section}>
            {historyLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.historyLoader} />
            ) : feedLogs.length === 0 ? (
              <Text style={styles.placeholder}>No feed history yet.</Text>
            ) : (
              feedLogs.map((log: any) => (
                <View key={log.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{format(new Date(log.fed_at), 'MMM d, yyyy · h:mm a')}</Text>
                  </View>
                  {log.feeder && (
                    <Text style={styles.historyFeeder}>Fed by {log.feeder.name || 'Unknown'}</Text>
                  )}
                  {log.notes ? (
                    <Text style={styles.historyNotes}>{log.notes}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'caretakers' && (
          <View style={styles.section}>
            {dog.caretakers?.length ? (
              dog.caretakers.map((c: User) => (
                <View key={c.id} style={styles.caretakerCard}>
                  <View style={styles.caretakerRow}>
                    {c.avatar_url ? (
                      <Image source={{ uri: c.avatar_url }} style={styles.caretakerAvatar} />
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

        <View style={styles.actions}>
          <Button
            title="Update Info"
            variant="outline"
            size="medium"
            fullWidth
            onPress={() => router.push(`/(main)/add-dog?id=${id}`)}
          />
          <Button
            title="Report Lost"
            variant="outline"
            size="medium"
            fullWidth
            onPress={() => router.push({ pathname: '/(main)/report/lost', params: { dog_id: id } })}
          />
          <Button
            title="Report Issue"
            variant="outline"
            size="medium"
            fullWidth
            onPress={() => router.push({ pathname: '/(main)/report/issue', params: { dog_id: id } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderEmoji: { fontSize: 64 },
  heroPlaceholderText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  nameBlock: { padding: 16, paddingBottom: 8, backgroundColor: colors.card },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  chipColor: { backgroundColor: '#FEF3C7' },
  chipGender: { backgroundColor: '#D1FAE5' },
  chipSterilized: { backgroundColor: '#DBEAFE' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary },
  tabTextActive: { fontSize: 14, fontWeight: '600', color: colors.primary },
  section: { padding: 16, backgroundColor: colors.background },
  detailRow: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 16, color: colors.text, fontWeight: '500' },
  placeholder: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  historyLoader: { marginVertical: 24 },
  historyCard: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyHeader: { marginBottom: 4 },
  historyDate: { fontSize: 13, fontWeight: '600', color: colors.text },
  historyFeeder: { fontSize: 14, color: colors.textSecondary },
  historyNotes: { fontSize: 14, color: colors.text, marginTop: 6 },
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
  caretakerAvatarText: { fontSize: 20, fontWeight: '700', color: colors.textOnPrimary },
  caretakerInfo: { flex: 1 },
  caretakerName: { fontSize: 16, fontWeight: '600', color: colors.text },
  caretakerRole: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  messageBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  messageBtnText: { fontSize: 14, fontWeight: '600', color: colors.textOnPrimary },
  actions: { padding: 16, gap: 12 },
});
