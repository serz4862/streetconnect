import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api';
import Button from '@/components/common/Button';
import { colors, USER_ROLES, ROLE_CATEGORIES } from '@/constants';

const ROLES_BY_CATEGORY: Record<string, (keyof typeof USER_ROLES)[]> = {
  [ROLE_CATEGORIES.CITIZEN]: [
    'ANIMAL_LOVER',
    'REPORTER',
    'FEEDER',
    'ADOPTER',
    'FOSTER',
    'TRANSPORTER',
    'VOLUNTEER',
  ],
  [ROLE_CATEGORIES.RESCUE]: ['RESCUER', 'CARETAKER', 'STERILIZATION_COORDINATOR', 'INSPECTOR'],
  [ROLE_CATEGORIES.PROFESSIONAL]: ['VET', 'PARAVET', 'NGO', 'TRAINER', 'GROOMER'],
};

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await apiService.updateRole(selectedRole);
      useAuthStore.getState().updateUser({ ...user!, role: selectedRole });
      router.push('/(onboarding)/location');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoSmall}>
          <Text style={styles.logoEmoji}>🐕</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Welcome to the pack, {user?.name?.split(' ')[0] || 'there'}!</Text>
        <Text style={styles.subtitle}>
          You're now part of a growing community of caring dog lovers. Before we begin, pick the category that best describes you.
        </Text>

        {Object.entries(ROLES_BY_CATEGORY).map(([category, roles]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.pills}>
              {roles.map((key) => {
                const value = USER_ROLES[key];
                const isSelected = selectedRole === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setSelectedRole(value)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {value.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <Button
          title="Continue"
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          disabled={!selectedRole}
          onPress={handleContinue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 26 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
  section: { marginBottom: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  pillSelected: { backgroundColor: colors.primary },
  pillText: { fontSize: 14, color: colors.text },
  pillTextSelected: { fontSize: 14, color: colors.textOnPrimary, fontWeight: '600' },
});
