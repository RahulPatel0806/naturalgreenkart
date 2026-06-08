import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button, LoadingState, ErrorState } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/store/query';
import { colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';
import type { DiscountType } from '@/types/api';

export function AdminCouponFormScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<AdminStackParamList, 'AdminCouponForm'>>();
  const id = params?.id;
  const isEdit = !!id;
  const qc = useQueryClient();

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minOrderSubtotal, setMinOrderSubtotal] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ code?: string; discountValue?: string; expiresAt?: string }>({});

  const listQuery = useQuery({ queryKey: queryKeys.adminCoupons, queryFn: adminApi.coupons });
  const existing = isEdit ? listQuery.data?.find((c) => c.id === id) : undefined;

  useEffect(() => {
    if (!existing) return;
    setCode(existing.code);
    setDescription(existing.description ?? '');
    setDiscountType(existing.discountType);
    setDiscountValue(String(existing.discountValue));
    setMaxDiscount(existing.maxDiscount != null ? String(existing.maxDiscount) : '');
    setMinOrderSubtotal(String(existing.minOrderSubtotal));
    setUsageLimit(existing.usageLimit != null ? String(existing.usageLimit) : '');
    setPerUserLimit(existing.perUserLimit != null ? String(existing.perUserLimit) : '');
    setExpiresAt(existing.expiresAt ? existing.expiresAt.slice(0, 10) : '');
    setIsActive(existing.isActive);
  }, [existing]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? adminApi.updateCoupon(id!, payload) : adminApi.createCoupon(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminCoupons });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const onSubmit = () => {
    const next: typeof errors = {};
    const value = Number(discountValue);
    if (code.trim().length < 3) next.code = 'Code must be at least 3 characters';
    if (!(value > 0)) next.discountValue = 'Enter a value greater than 0';
    else if (discountType === 'PERCENT' && value > 100) next.discountValue = 'Percent cannot exceed 100';
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) next.expiresAt = 'Use YYYY-MM-DD';
    setErrors(next);
    if (Object.keys(next).length) return;

    const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
    save.mutate({
      code: code.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue: value,
      maxDiscount: discountType === 'PERCENT' ? num(maxDiscount) : undefined,
      minOrderSubtotal: Number(minOrderSubtotal) || 0,
      usageLimit: num(usageLimit),
      perUserLimit: num(perUserLimit),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive,
    });
  };

  if (isEdit && listQuery.isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (isEdit && listQuery.isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => listQuery.refetch()} /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <Input label="Coupon code" placeholder="e.g. FRESH50" autoCapitalize="characters" value={code} onChangeText={setCode} error={errors.code} hint="Customers type this at checkout" />
            <Input label="Description" placeholder="Optional, shown to customers" value={description} onChangeText={setDescription} />

            <View>
              <Text className="mb-1.5 text-sm font-medium text-ink">Discount type</Text>
              <View className="flex-row gap-2">
                {(['PERCENT', 'FLAT'] as DiscountType[]).map((t) => {
                  const on = discountType === t;
                  return (
                    <Pressable key={t} onPress={() => setDiscountType(t)} className={`flex-1 items-center rounded-xl py-2.5 ${on ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                      <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-ink-muted'}`}>{t === 'PERCENT' ? 'Percentage' : 'Flat ₹'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input
              label={discountType === 'PERCENT' ? 'Discount (%)' : 'Discount (₹)'}
              placeholder={discountType === 'PERCENT' ? 'e.g. 20' : 'e.g. 50'}
              keyboardType="numeric"
              value={discountValue}
              onChangeText={setDiscountValue}
              error={errors.discountValue}
            />
            {discountType === 'PERCENT' ? (
              <Input label="Max discount (₹)" placeholder="Optional cap, e.g. 100" keyboardType="numeric" value={maxDiscount} onChangeText={setMaxDiscount} />
            ) : null}

            <Input label="Minimum order (₹)" placeholder="0" keyboardType="numeric" value={minOrderSubtotal} onChangeText={setMinOrderSubtotal} hint="Cart subtotal required to apply" />
            <Input label="Total usage limit" placeholder="Unlimited if blank" keyboardType="numeric" value={usageLimit} onChangeText={setUsageLimit} />
            <Input label="Per-customer limit" placeholder="Unlimited if blank" keyboardType="numeric" value={perUserLimit} onChangeText={setPerUserLimit} />
            <Input label="Expiry date" placeholder="YYYY-MM-DD (optional)" autoCapitalize="none" value={expiresAt} onChangeText={setExpiresAt} error={errors.expiresAt} />

            <View className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
              <View>
                <Text className="text-sm font-semibold text-ink">Active</Text>
                <Text className="text-xs text-ink-muted">Customers can apply this coupon</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
            </View>
          </View>

          <View className="mt-6">
            <Button label={isEdit ? 'Save changes' : 'Create coupon'} loading={save.isPending} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
