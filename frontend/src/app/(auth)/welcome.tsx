import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/common/Button';
import { colors } from '@/constants';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🐕</Text>
          </View>
          <Text style={styles.title}>StreetConnect</Text>
          <Text style={styles.subtitle}>Powered by Syntra</Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.headline}>
            Voiceless, but not Worthless
          </Text>
          <Text style={styles.description}>
            Join fellow dog lovers in keeping your strays registered, connected, and safe.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign Up"
            variant="primary"
            size="large"
            fullWidth
            onPress={() => router.push('/(auth)/signup')}
          />
          <Button
            title="Log In"
            variant="outline"
            size="large"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
          />
          <Text style={styles.terms}>
            By creating an account or signing in, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  terms: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
