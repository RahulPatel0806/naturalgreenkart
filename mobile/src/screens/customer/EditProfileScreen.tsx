import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components/ui';
import { profileApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const save = useMutation({
    mutationFn: () => profileApi.update({ name: name.trim(), email: email.trim() || undefined }),
    onSuccess: (updated) => {
      updateUser({ name: updated.name });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const onSubmit = () => {
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    setError(undefined);
    save.mutate();
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-1 px-4 pt-4">
          <View className="gap-4">
            <Input label="Name" placeholder="Your name" value={name} onChangeText={setName} error={error} />
            <Input label="Email (optional)" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <View>
              <Text className="mb-1.5 text-sm font-medium text-ink">Mobile number</Text>
              <View className="h-12 justify-center rounded-xl border border-surface-border bg-surface-muted px-4">
                <Text className="text-base text-ink-muted">+91 {user?.phone}</Text>
              </View>
              <Text className="mt-1 text-xs text-ink-muted">Your mobile number can't be changed.</Text>
            </View>
          </View>

          <View className="mt-6">
            <Button label="Save changes" loading={save.isPending} onPress={onSubmit} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
