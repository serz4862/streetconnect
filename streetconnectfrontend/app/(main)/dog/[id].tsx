import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/common/Button';
import { colors } from '../../../constants';
import { useDogs } from '../../../hooks/useDogs';

export default function DogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { useDog } = useDogs();
  const { data: dog, isLoading } = useDog(id || '');
  const [tab, setTab] = useState<'details' | 'history' | 'caretakers'>('details');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // const handleGenerateReport = async () => {
  //   if (!id) return;
  //   setGeneratingPdf(true);
  //   try {
  //     const res: any = await apiService.generateDogReport(id);
  //     if (res.pdf_url) await Linking.openURL(res.pdf_url);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setGeneratingPdf(false);
  //   }
  // };

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dog Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <Image
            source={{ uri: dog.image_url || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{dog.name || 'Unnamed Dog'}</Text>
            <Text style={styles.meta}>
              Last seen: {dog.last_seen_at ? formatDistanceToNow(new Date(dog.last_seen_at), { addSuffix: true }) : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {(['details', 'history', 'caretakers'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'details' ? 'Details' : t === 'history' ? 'History' : 'Owner / Caretaker info'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'details' && (
          <View style={styles.section}>
            <Text style={styles.bullet}>• Color: {dog.color || 'N/A'}</Text>
            <Text style={styles.bullet}>• Gender: {dog.gender}</Text>
            <Text style={styles.bullet}>• Sterilized: {dog.is_sterilized ? 'Yes' : 'No'}</Text>
            <Text style={styles.bullet}>• Age: {dog.age_approx != null ? `${dog.age_approx} yrs` : 'Unknown'}</Text>
            <Text style={styles.bullet}>• Health: {dog.health_status}</Text>
            {dog.location_name && <Text style={styles.bullet}>• Location: {dog.location_name}</Text>}
          </View>
        )}
        {tab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.placeholder}>Feed history and events will appear here.</Text>
          </View>
        )}
        {tab === 'caretakers' && (
          <View style={styles.section}>
            {dog.caretakers?.length ? (
              dog.caretakers.map((c: any) => (
                <Text key={c.id} style={styles.bullet}>• {c.name} ({c.role})</Text>
              ))
            ) : (
              <Text style={styles.placeholder}>No caretakers listed.</Text>
            )}
          </View>
        )}

        <Button title="Update Info" variant="outline" size="medium" fullWidth onPress={() => router.push(`/(main)/add-dog?id=${id}`)} />
        <Button title="Report Lost" variant="outline" size="medium" fullWidth onPress={() => router.push({ pathname: '/(main)/report/lost', params: { dog_id: id } })} />
        <Button title="Report Issue" variant="outline" size="medium" fullWidth onPress={() => router.push({ pathname: '/(main)/report/issue', params: { dog_id: id } })} />
        <Button title="Generate Report" variant="primary" size="medium" fullWidth loading={generatingPdf}
        //  onPress={handleGenerateReport}
          />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, marginRight: 16 },
  profileInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  tabs: { flexDirection: 'row', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary },
  tabTextActive: { fontSize: 14, fontWeight: '600', color: colors.primary },
  section: { marginBottom: 24 },
  bullet: { fontSize: 16, color: colors.text, marginBottom: 8 },
  placeholder: { fontSize: 14, color: colors.textSecondary },
});
