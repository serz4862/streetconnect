import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { apiService } from '../../services/api';
import Button from '../../components/common/Button';
import { colors, USER_ROLES, ROLE_CATEGORIES } from '../../constants';

const ROLES_BY_CATEGORY: Record<string, { label: string; keys: (keyof typeof USER_ROLES)[] }> = {
  [ROLE_CATEGORIES.CITIZEN]: {
    label: 'Citizen / Community',
    keys: [
      'ANIMAL_LOVER',
      'REPORTER',
      'FEEDER',
      'ADOPTER',
      'FOSTER',
      'TRANSPORTER',
      'VOLUNTEER',
    ],
  },
  [ROLE_CATEGORIES.RESCUE]: {
    label: 'Rescue & Welfare',
    keys: ['RESCUER', 'CARETAKER', 'STERILIZATION_COORDINATOR', 'INSPECTOR'],
  },
  [ROLE_CATEGORIES.PROFESSIONAL]: {
    label: 'Professional / Org',
    keys: ['VET', 'PARAVET', 'NGO', 'TRAINER', 'GROOMER'],
  },
};

type Selections = {
  [ROLE_CATEGORIES.CITIZEN]: string | null;
  [ROLE_CATEGORIES.RESCUE]: string | null;
  [ROLE_CATEGORIES.PROFESSIONAL]: string | null;
};

function primaryRole(selections: Selections): string | null {
  return (
    selections[ROLE_CATEGORIES.PROFESSIONAL] ??
    selections[ROLE_CATEGORIES.RESCUE] ??
    selections[ROLE_CATEGORIES.CITIZEN] ??
    null
  );
}

function allSelected(selections: Selections): boolean {
  return (
    !!selections[ROLE_CATEGORIES.CITIZEN] &&
    !!selections[ROLE_CATEGORIES.RESCUE] &&
    !!selections[ROLE_CATEGORIES.PROFESSIONAL]
  );
}

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selections, setSelections] = useState<Selections>({
    [ROLE_CATEGORIES.CITIZEN]: null,
    [ROLE_CATEGORIES.RESCUE]: null,
    [ROLE_CATEGORIES.PROFESSIONAL]: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (category: keyof Selections, roleValue: string) => {
    setError(null);
    setSelections((prev) => ({
      ...prev,
      [category]: prev[category] === roleValue ? null : roleValue,
    }));
  };

  const handleContinue = async () => {
    if (!allSelected(selections)) {
      setError('Please pick one option from each category.');
      return;
    }
    const role = primaryRole(selections);
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      await apiService.updateRole(role);
      await apiService.completeOnboarding();
      useAuthStore.getState().updateUser({ ...user!, role, onboarding_completed: true });
      router.replace('/(main)/(tabs)/home');
    } catch (err: any) {
      const msg =
        err?.status === 401
          ? 'Session expired. Please sign in again.'
          : err?.error?.message || err?.message || 'Could not save. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = allSelected(selections);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🐕</Text>
          </View>
          <Text style={styles.title}>
            Welcome to the pack, {user?.name?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.subtitle}>
            Pick one option from each category so we can tailor your experience.
          </Text>
        </View>

        {Object.entries(ROLES_BY_CATEGORY).map(([category, { label, keys }]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.categoryLabel}>{label}</Text>
            <View style={styles.pills}>
              {keys.map((key) => {
                const value = USER_ROLES[key];
                const isSelected = selections[category as keyof Selections] === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => handleSelect(category as keyof Selections, value)}
                    activeOpacity={0.7}
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

        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title="Continue"
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          disabled={!canContinue}
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 30 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: { fontSize: 14, color: colors.text },
  pillTextSelected: {
    fontSize: 14,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  errorWrap: { marginBottom: 16 },
  errorText: { fontSize: 14, color: colors.error, textAlign: 'center' },
  continueBtn: { marginTop: 8 },
});
