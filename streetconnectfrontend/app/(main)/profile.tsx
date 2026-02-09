import React from 'react';
import { View, Text, StyleSheet,  ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/common/Button';
import { colors } from '../../constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.country_code} {user?.phone}</Text>
        <Text style={styles.role}>Role: {user?.role?.replace(/_/g, ' ')}</Text>
        {user?.city && <Text style={styles.meta}>City: {user.city}</Text>}
        {user?.pincode && <Text style={styles.meta}>Pincode: {user.pincode}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Button
            title="Log out"
            variant="outline"
            size="large"
            fullWidth
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.textOnPrimary },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  phone: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  role: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  meta: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  section: { marginTop: 32, width: '100%' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
