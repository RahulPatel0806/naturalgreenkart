import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
import { authApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';

type Step = 'phone' | 'otp';

export function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [devCode, setDevCode] = useState<string>();

  const requestOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return setError('Enter a valid 10-digit mobile number');
    setError(undefined);
    setLoading(true);
    try {
      const res = await authApi.requestOtp(phone);
      setDevCode(res.devCode);
      if (res.devCode) setCode(res.devCode); // auto-fill in dev for convenience
      setStep('otp');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (code.length < 4) return setError('Enter the OTP sent to your phone');
    setError(undefined);
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(phone, code, name || undefined);
      await setSession(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center px-6">
        <View className="mb-10 items-center">
          <Text className="text-5xl">🥦</Text>
          <Text className="mt-3 text-2xl font-extrabold text-ink">Welcome to Natural greenkart</Text>
          <Text className="mt-1 text-center text-sm text-ink-muted">
            {step === 'phone' ? 'Login or sign up with your mobile number' : `Enter the OTP sent to +91 ${phone}`}
          </Text>
        </View>

        {step === 'phone' ? (
          <View className="gap-4">
            <Input
              label="Mobile number"
              keyboardType="phone-pad"
              placeholder="9876543210"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              error={error}
            />
            <Button label="Send OTP" loading={loading} onPress={requestOtp} />
          </View>
        ) : (
          <View className="gap-4">
            <Input
              label="OTP"
              keyboardType="number-pad"
              placeholder="6-digit code"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              error={error}
              hint={devCode ? `Dev mode code: ${devCode}` : undefined}
            />
            <Input label="Your name (optional)" placeholder="e.g. Riya Sharma" value={name} onChangeText={setName} />
            <Button label="Verify & Continue" loading={loading} onPress={verifyOtp} />
            <Button
              label="Change number"
              variant="ghost"
              onPress={() => {
                setStep('phone');
                setCode('');
                setError(undefined);
              }}
            />
          </View>
        )}

        <Text className="mt-8 text-center text-xs text-ink-soft">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
        {step === 'phone' ? (
          <Text className="mt-4 text-center text-xs text-ink-soft">
            Demo: admin 9000000001 · seller 9000000002 · customer 9000000003
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
