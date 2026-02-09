import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDogs } from '@/hooks/useDogs';
import DogCard from '@/components/dog/DogCard';
import { colors } from '@/constants';
import { Dog } from '@/types';

export default function MyDogsScreen() {
  const router = useRouter();
  const { useMyDogs } = useDogs();
  const { data: dogs, isLoading } = useMyDogs();

  const handleDogPress = useCallback((dog: Dog) => {
    router.push(`/(main)/dog/${dog.id}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Dog }) => (
    <DogCard dog={item} onPress={handleDogPress} />
  ), [handleDogPress]);

  const ListHeader = (
    <TouchableOpacity
      style={styles.addCard}
      onPress={() => router.push('/(main)/add-dog')}
    >
      <View style={styles.addIcon}>
        <Text style={styles.addIconText}>+</Text>
      </View>
      <Text style={styles.addTitle}>Add Dog</Text>
      <Text style={styles.addSubtitle}>Register your dog</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Dogs</Text>
      </View>
      <FlatList
        data={dogs || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No dogs yet. Tap Add Dog to register.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  list: { paddingBottom: 24 },
  addCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addIconText: { fontSize: 28, color: colors.primary, fontWeight: '300' },
  addTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  addSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
