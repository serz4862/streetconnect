import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useChat } from '@/hooks/useChat';
import { colors } from '@/constants';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '@/types';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string; receiver_id?: string }>();
  const id = params.id;
  const receiverId = params.receiver_id;
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { useMessages, useSendMessage } = useChat();
  const { data: messages, isLoading } = useMessages(id || '');
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    if (!text.trim() || !receiverId) return;
    const content = text.trim();
    setText('');
    try {
      await sendMessage.mutateAsync({
        receiver_id: receiverId,
        content,
      });
    } catch (err) {
      console.error(err);
    }
  }, [text, receiverId, sendMessage]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender_id === userId;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
        <Text style={[styles.time, isMe && styles.timeMe]}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
      </View>
    );
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          data={messages || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          inverted
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No messages yet. Say hi!'}</Text>
            </View>
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim() || sendMessage.isPending}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  keyboard: { flex: 1 },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 4 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  bubbleText: { fontSize: 16, color: colors.text },
  bubbleTextMe: { color: colors.textOnPrimary },
  time: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  timeMe: { color: colors.textOnPrimary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: colors.text, marginRight: 8 },
  sendBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: 22, justifyContent: 'center' },
  sendText: { fontSize: 16, fontWeight: '600', color: colors.textOnPrimary },
});
