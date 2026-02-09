import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/common/Button';
import { colors } from '@/constants';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 10;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    country_code: string;
    name?: string;
    pincode?: string;
    flow: string;
  }>();
  const phoneLogin = useAuthStore((s) => s.phoneLogin);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phone = params.phone || '';
  const countryCode = params.country_code || '+91';
  const name = params.name;
  const pincode = params.pincode;

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      setOtp((prev) => {
        const next = [...prev];
        digits.forEach((d, i) => { next[i] = d; });
        return next;
      });
      return;
    }
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value.replace(/\D/g, '').slice(-1);
      return next;
    });
  }, []);

  const handleVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length < 4) {
      setError('Enter at least 4 digits (use 0000 for testing)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await phoneLogin({
        phone,
        country_code: countryCode,
        otp: code,
        ...(name && { name }),
        ...(pincode && { pincode }),
      });
      const user = useAuthStore.getState().user;
      if (user?.onboarding_completed) {
        router.replace('/(main)/(tabs)/home');
      } else {
        router.replace('/(onboarding)/role-selection');
      }
    } catch (err: any) {
      setError(err?.error || err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, countryCode, name, pincode, phoneLogin, router]);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    const id = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoSmall}>
          <Text style={styles.logoEmoji}>🐕</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify your mobile number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we sent by SMS to {countryCode}-{phone}.
        </Text>
        <Text style={styles.hint}>For testing, enter 0000 or 000000</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(v) => handleOtpChange(index, v)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={loading ? '' : 'Create Account'}
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          onPress={handleVerify}
        />

        <Text style={styles.resend}>
          Didn't receive a code?{' '}
          {resendCooldown > 0 ? (
            <Text style={styles.resendDisabled}>Resend OTP ({resendCooldown}s)</Text>
          ) : (
            <Text
              style={styles.resendLink}
              onPress={() => {
                startResendCooldown();
              }}
            >
              Resend OTP
            </Text>
          )}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: colors.text },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 22 },
  content: { paddingHorizontal: 24, flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  hint: { fontSize: 14, color: colors.primary, marginBottom: 24 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 12 },
  resend: { marginTop: 24, textAlign: 'center', fontSize: 14, color: colors.textSecondary },
  resendLink: { color: colors.primary, fontWeight: '600' },
  resendDisabled: { color: colors.textLight },
});
