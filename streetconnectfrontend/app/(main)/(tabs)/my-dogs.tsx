import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useDogs } from '../../../hooks/useDogs';
import SwipeableDogCard from '../../../components/dog/SwipeableDogCard';
import { colors } from '../../../constants';
import { Dog } from '../../../types';
import { apiService } from '../../../services/api';

export default function MyDogsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useMyDogs } = useDogs();
  const { data: dogs, isLoading, refetch } = useMyDogs();

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const handleReportLost = useCallback(async (dog: Dog) => {
    try {
      await apiService.updateDog(dog.id, { is_lost: !dog.is_lost });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
    } catch {
      // silent
    }
  }, [queryClient]);

  const handleReportIssue = useCallback((dog: Dog) => {
    router.push({ pathname: '/(main)/report/issue', params: { dog_id: dog.id } });
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Dog }) => (
    <SwipeableDogCard
      dog={item}
      onPress={handleDogPress}
      onReportLost={handleReportLost}
      onReportIssue={handleReportIssue}
    />
  ), [handleDogPress, handleReportLost, handleReportIssue]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Dogs</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(main)/add-dog')}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={dogs || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isLoading}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => router.push('/(main)/add-dog')}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.addTitle}>Register a Dog</Text>
              <Text style={styles.addSubtitle}>Add a new street dog to the community</Text>
            </View>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="paw-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No dogs registered yet</Text>
              <Text style={styles.emptySubtitle}>Start by adding a dog you care for</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingBottom: 24 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  empty: { padding: 48, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
