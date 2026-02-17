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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth.store';
import { apiService } from '../../../services/api';
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

export default function PeopleScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(u =>
          u.name.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query) ||
          u.city?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

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
      pathname: `/(main)/chat/new`,
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
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Text style={styles.roleEmoji}>{getRoleEmoji(item.role)}</Text>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
          {(item.location_name || item.city) && (
            <Text style={styles.location} numberOfLines={1}>
              📍 {item.location_name || item.city}
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }, [handleUserPress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Connect with feeders, rescuers & more</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, role, or location..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{filteredUsers.length}</Text>
            <Text style={styles.statLabel}>
              {searchQuery ? 'Results' : 'People'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {filteredUsers.filter(u => u.role === 'feeder').length}
            </Text>
            <Text style={styles.statLabel}>Feeders</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {filteredUsers.filter(u => u.role === 'rescuer').length}
            </Text>
            <Text style={styles.statLabel}>Rescuers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {filteredUsers.filter(u => ['vet', 'ngo', 'volunteer'].includes(u.role)).length}
            </Text>
            <Text style={styles.statLabel}>Others</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading people...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No people found' : 'No people in database yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'People will appear here as they join'}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: { fontSize: 14, color: colors.textSecondary },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    marginRight: 12,
  },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.primary },
  body: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 17, fontWeight: '600', color: colors.text, marginRight: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleEmoji: { fontSize: 12, marginRight: 4 },
  roleText: { fontSize: 12, fontWeight: '600' },
  location: { fontSize: 14, color: colors.textSecondary },
  arrow: { fontSize: 24, color: colors.textLight, marginLeft: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  empty: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
