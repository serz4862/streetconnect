import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth.store';
import { useChat } from '../../../hooks/useChat';
import { colors } from '../../../constants';
import { Conversation } from '../../../types';
import { formatDistanceToNow } from 'date-fns';

export default function PeopleScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { useConversations } = useChat();
  const { data: conversations, isLoading } = useConversations();

  const handleConversationPress = useCallback((conv: Conversation) => {
    const other = conv.user1_id === userId ? conv.user2 : conv.user1;
    const otherId = other?.id ?? (conv.user1_id === userId ? conv.user2_id : conv.user1_id);
    router.push({ pathname: `/(main)/chat/${conv.id}`, params: { receiver_id: otherId } });
  }, [router, userId]);

  const renderItem = useCallback(({ item }: { item: Conversation }) => {
    const other = item.other_user || (item.user1_id === userId ? item.user2 : item.user1);
    const name = other?.name || 'Unknown';
    const avatar = other?.avatar_url;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{name[0]?.toUpperCase() || '?'}</Text>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
        </View>
        {item.last_message_at && (
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })}
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [handleConversationPress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
      </View>
      <FlatList
        data={conversations || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No conversations yet. Start from a dog profile.'}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  preview: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 12, color: colors.textLight },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
