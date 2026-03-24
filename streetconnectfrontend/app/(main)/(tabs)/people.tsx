import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/auth.store';
import { apiService } from '../../../services/api';
import { proxyImageUrl } from '../../../services/imageProxy';
import { colors } from '../../../constants';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar_url?: string;
  city?: string;
  location_name?: string;
}

const ROLE_FILTERS = [
  { key: 'all', label: 'All', icon: 'people' as const },
  { key: 'feeder', label: 'Feeders', icon: 'restaurant' as const },
  { key: 'rescuer', label: 'Rescuers', icon: 'medkit' as const },
  { key: 'vet', label: 'Vets', icon: 'pulse' as const },
  { key: 'volunteer', label: 'Volunteers', icon: 'hand-left' as const },
];

export default function PeopleScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (query) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.city?.toLowerCase().includes(query) ||
        u.location_name?.toLowerCase().includes(query)
      );
    }
    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllUsers();
      const allUsers = (data.users || []).filter((u: User) => u.id !== currentUserId);
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = useCallback(async (user: User) => {
    // Navigate to chat with this user
    router.push({
      pathname: `/(main)/chat/new` as any,
      params: { receiver_id: user.id, receiver_name: user.name },
    });
  }, [router]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'feeder': return '#10B981';
      case 'rescuer': return '#3B82F6';
      case 'vet': return '#8B5CF6';
      case 'ngo': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'feeder': return '🍖';
      case 'rescuer': return '🚑';
      case 'vet': return '⚕️';
      case 'ngo': return '🏢';
      case 'volunteer': return '🤝';
      case 'trainer': return '🎓';
      case 'adopter': return '🏠';
      default: return '👤';
    }
  };

  const renderItem = useCallback(({ item }: { item: User }) => {
    const roleColor = getRoleColor(item.role);
    return (
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          {item.avatar_url ? (
            <Image source={{ uri: proxyImageUrl(item.avatar_url) }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: roleColor + '25' }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{item.name[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {getRoleEmoji(item.role)} {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
          {(item.location_name || item.city) && (
            <Text style={styles.location} numberOfLines={1}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              {' '}{item.location_name || item.city}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => handleUserPress(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }, [handleUserPress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Community</Text>
            <Text style={styles.subtitle}>{users.length} members</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, role, location..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
          {ROLE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
              onPress={() => setRoleFilter(f.key)}
            >
              <Ionicons
                name={f.icon}
                size={13}
                color={roleFilter === f.key ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.filterChipText, roleFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={loadUsers}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color={colors.border} />
              <Text style={styles.emptyText}>
                {searchQuery || roleFilter !== 'all' ? 'No members found' : 'No community members yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Members will appear here as they join'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  clearBtn: { padding: 2 },
  filtersRow: { marginBottom: 0 },
  filtersContent: { paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { paddingBottom: 24, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarWrap: { marginRight: 12 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 12, fontWeight: '600' },
  location: { fontSize: 12, color: colors.textSecondary },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 15, color: colors.textSecondary, marginTop: 12 },
  empty: { padding: 56, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 8 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
