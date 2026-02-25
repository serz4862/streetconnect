import React, { useState } from 'react';
import { View, Text, StyleSheet,  TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../constants';
import { apiService } from '../../services/api';

const loginSchema = z.object({
  phone: z.string().min(10, 'Enter valid 10-digit mobile number').max(10),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      await apiService.sendOtp({ phone: data.phone, country_code: '+91' });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phone: data.phone,
          country_code: '+91',
          flow: 'login',
        },
      });
    } catch (err: any) {
      const msg = err?.error?.error ?? err?.message ?? 'Failed to send OTP. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoSmall}>
            <Text style={styles.logoEmoji}>🐕</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>Enter your mobile number to receive an OTP.</Text>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mobile Number"
                placeholder="99999 99999 (test: 9999999999)"
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                leftIcon={<Text style={styles.countryCode}>+91</Text>}
              />
            )}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Get OTP"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          />

          <Text style={styles.footer}>
            Don't have an account?{' '}
            <Text style={styles.link} onPress={() => router.replace('/(auth)/signup')}>
              Sign up.
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
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
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
  countryCode: { fontSize: 16, color: colors.text, fontWeight: '600' },
  errorText: { fontSize: 14, color: colors.error, marginBottom: 12 },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
});
