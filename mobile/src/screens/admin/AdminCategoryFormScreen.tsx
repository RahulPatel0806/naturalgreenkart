import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button, LoadingState, ErrorState, ImageUploader, type UploadedImage } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';

export function AdminCategoryFormScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<AdminStackParamList, 'AdminCategoryForm'>>();
  const id = params?.id;
  const isEdit = !!id;
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<{ name?: string; sortOrder?: string }>({});

  // Categories aren't fetched individually; find from the list when editing.
  const listQuery = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories });
  const existing = isEdit ? listQuery.data?.find((c) => c.id === id) : undefined;

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? '');
    setSortOrder(String(existing.sortOrder));
    setIsActive(existing.isActive);
    setImages(existing.imageUrl ? [{ url: existing.imageUrl }] : []);
  }, [existing]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? adminApi.updateCategory(id!, payload) : adminApi.createCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const onSubmit = () => {
    const next: { name?: string; sortOrder?: string } = {};
    const order = Number(sortOrder);
    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!Number.isInteger(order) || order < 0) next.sortOrder = 'Enter a whole number';
    setErrors(next);
    if (Object.keys(next).length) return;

    save.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: images[0]?.url || undefined,
      sortOrder: order,
      isActive,
    });
  };

  if (isEdit && listQuery.isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (isEdit && listQuery.isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => listQuery.refetch()} /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text className="mb-1.5 text-sm font-medium text-ink">Category image</Text>
          <ImageUploader value={images} onChange={setImages} prefix="categories" max={1} />

          <View className="mt-4 gap-4">
            <Input label="Name" placeholder="e.g. Fruits & Vegetables" value={name} onChangeText={setName} error={errors.name} />
            <Input label="Description" placeholder="Optional" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 90, textAlignVertical: 'top', paddingTop: 12 }} />
            <Input label="Sort order" placeholder="0" keyboardType="numeric" value={sortOrder} onChangeText={setSortOrder} error={errors.sortOrder} hint="Lower numbers appear first" />

            <View className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
              <View>
                <Text className="text-sm font-semibold text-ink">Active</Text>
                <Text className="text-xs text-ink-muted">Show this category to customers</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
            </View>
          </View>

          <View className="mt-6">
            <Button label={isEdit ? 'Save changes' : 'Add category'} loading={save.isPending} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
