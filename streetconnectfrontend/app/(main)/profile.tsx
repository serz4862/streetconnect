import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useImageUpload } from '../../hooks/useImageUpload';
import { apiService } from '../../services/api';
import Button from '../../components/common/Button';
import { colors } from '../../constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { pickImage, uploadImage, isUploading } = useImageUpload();
  const [stats, setStats] = useState({ dogs: 0, feeds: 0, reports: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load user stats
      const myDogs = await apiService.getMyDogs();
      setStats(prev => ({ ...prev, dogs: myDogs.dogs?.length || 0 }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      const asset = await pickImage({ allowsEditing: true, aspect: [1, 1] });
      if (!asset) return;

      const fileUrl = await uploadImage(asset.uri, 'avatars');
      
      // Update profile with new avatar
      await apiService.updateProfile({ avatar_url: fileUrl });
      updateUser({ ...user!, avatar_url: fileUrl });
      
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
      console.error(error);
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    Alert.alert('Coming Soon', 'Edit profile feature will be available soon');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'feeder': return '#10B981';
      case 'rescuer': return '#3B82F6';
      case 'vet': return '#8B5CF6';
      case 'ngo': return '#F59E0B';
      default: return colors.primary;
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleEditProfile} style={styles.editBtn}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleChangeAvatar}
            disabled={isUploading}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user?.name}</Text>
          
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || '') + '20' }]}>
            <Text style={styles.roleEmoji}>{getRoleEmoji(user?.role || '')}</Text>
            <Text style={[styles.roleText, { color: getRoleColor(user?.role || '') }]}>
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1).replace(/_/g, ' ')}
            </Text>
          </View>

          <Text style={styles.phone}>{user?.country_code} {user?.phone}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
          
          {(user?.location_name || user?.city) && (
            <Text style={styles.location}>
              📍 {user.location_name || user.city}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.dogs}</Text>
            <Text style={styles.statLabel}>My Dogs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.feeds}</Text>
            <Text style={styles.statLabel}>Feeds</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(main)/(tabs)/my-dogs')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>🐕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Dogs</Text>
              <Text style={styles.actionSubtitle}>View and manage your dogs</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(main)/add-dog')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>➕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add Dog</Text>
              <Text style={styles.actionSubtitle}>Register a new dog</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(main)/scan-qr')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📷</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan QR</Text>
              <Text style={styles.actionSubtitle}>Scan a dog's QR code</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Get updates about dogs and reports</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.surface}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(main)/saved-locations')}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Saved Locations</Text>
              <Text style={styles.settingSubtitle}>Manage your saved locations</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy</Text>
              <Text style={styles.settingSubtitle}>Manage your privacy settings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>Get help and support</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About</Text>
              <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Logout"
            variant="outline"
            size="large"
            fullWidth
            onPress={handleLogout}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for street dogs</Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  editBtn: { padding: 8 },
  editIcon: { fontSize: 20 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.border,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: colors.textOnPrimary },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  cameraIcon: { fontSize: 16 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleEmoji: { fontSize: 16, marginRight: 6 },
  roleText: { fontSize: 14, fontWeight: '600' },
  phone: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  email: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  location: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionEmoji: { fontSize: 20 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: colors.textSecondary },
  actionArrow: { fontSize: 24, color: colors.textLight, marginLeft: 8 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  settingSubtitle: { fontSize: 13, color: colors.textSecondary },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
