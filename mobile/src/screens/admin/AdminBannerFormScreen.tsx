import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button, LoadingState, ErrorState, ImageUploader, type UploadedImage } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/store/query';
import { colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';

export function AdminBannerFormScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<AdminStackParamList, 'AdminBannerForm'>>();
  const id = params?.id;
  const isEdit = !!id;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('0');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; image?: string; expiresAt?: string }>({});

  const bannersQ = useQuery({ queryKey: queryKeys.adminBanners, queryFn: adminApi.banners });
  const couponsQ = useQuery({ queryKey: queryKeys.adminCoupons, queryFn: adminApi.coupons });
  const existing = isEdit ? bannersQ.data?.find((b) => b.id === id) : undefined;

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setSubtitle(existing.subtitle ?? '');
    setImages(existing.imageUrl ? [{ url: existing.imageUrl }] : []);
    setCouponId(existing.couponId);
    setSortOrder(String(existing.sortOrder));
    setExpiresAt(existing.expiresAt ? existing.expiresAt.slice(0, 10) : '');
    setIsActive(existing.isActive);
  }, [existing]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? adminApi.updateBanner(id!, payload) : adminApi.createBanner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminBanners });
      qc.invalidateQueries({ queryKey: queryKeys.banners });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const onSubmit = () => {
    const next: typeof errors = {};
    if (title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!images[0]?.url) next.image = 'A banner image is required';
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) next.expiresAt = 'Use YYYY-MM-DD';
    setErrors(next);
    if (Object.keys(next).length) return;

    save.mutate({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      imageUrl: images[0].url,
      couponId: couponId ?? (isEdit ? null : undefined),
      sortOrder: Number(sortOrder) || 0,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive,
    });
  };

  if (isEdit && bannersQ.isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (isEdit && bannersQ.isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => bannersQ.refetch()} /></SafeAreaView>;

  const coupons = couponsQ.data ?? [];

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text className="mb-1.5 text-sm font-medium text-ink">Banner image</Text>
          <ImageUploader value={images} onChange={setImages} prefix="categories" max={1} />
          {errors.image ? <Text className="mt-1 text-xs text-danger">{errors.image}</Text> : null}

          <View className="mt-4 gap-4">
            <Input label="Title" placeholder="e.g. Fresh deals this week" value={title} onChangeText={setTitle} error={errors.title} />
            <Input label="Subtitle" placeholder="Optional" value={subtitle} onChangeText={setSubtitle} />

            <View>
              <Text className="mb-1.5 text-sm font-medium text-ink">Linked coupon</Text>
              <Text className="mb-2 text-xs text-ink-muted">Optionally promote a coupon code on this banner</Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable onPress={() => setCouponId(null)} className={`rounded-full px-3 py-1.5 ${couponId === null ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                  <Text className={`text-xs font-semibold ${couponId === null ? 'text-white' : 'text-ink-muted'}`}>None</Text>
                </Pressable>
                {coupons.map((c) => {
                  const on = couponId === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => setCouponId(c.id)} className={`rounded-full px-3 py-1.5 ${on ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                      <Text className={`text-xs font-semibold ${on ? 'text-white' : 'text-ink-muted'}`}>{c.code}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input label="Sort order" placeholder="0" keyboardType="numeric" value={sortOrder} onChangeText={setSortOrder} hint="Lower numbers appear first" />
            <Input label="Expiry date" placeholder="YYYY-MM-DD (optional)" autoCapitalize="none" value={expiresAt} onChangeText={setExpiresAt} error={errors.expiresAt} />

            <View className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
              <View>
                <Text className="text-sm font-semibold text-ink">Active</Text>
                <Text className="text-xs text-ink-muted">Show this banner on the home screen</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
            </View>
          </View>

          <View className="mt-6">
            <Button label={isEdit ? 'Save changes' : 'Add banner'} loading={save.isPending} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
