import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button, LoadingState, ErrorState, ImageUploader, type UploadedImage } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';

const UNITS = ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACK', 'DOZEN', 'BUNCH'] as const;
type Unit = (typeof UNITS)[number];

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  mrp: string;
  unit: Unit;
  unitLabel: string;
  stock: string;
  isActive: boolean;
  images: UploadedImage[];
}

const EMPTY: FormState = {
  name: '', description: '', categoryId: '', price: '', mrp: '',
  unit: 'PIECE', unitLabel: '', stock: '0', isActive: true, images: [],
};

export function AdminProductFormScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<AdminStackParamList, 'AdminProductForm'>>();
  const id = params?.id;
  const isEdit = !!id;
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const { data: categories } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories });
  const productQuery = useQuery({ queryKey: ['admin', 'product', id], queryFn: () => adminApi.product(id!), enabled: isEdit });

  // Prefill when editing.
  useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    setForm({
      name: p.name,
      description: p.description ?? '',
      categoryId: p.categoryId,
      price: String(p.price),
      mrp: String(p.mrp),
      unit: (p.unit as Unit) ?? 'PIECE',
      unitLabel: p.unitLabel,
      stock: String(p.stock),
      isActive: p.isActive,
      images: p.images.map((i) => ({ url: i.url })),
    });
  }, [productQuery.data]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? adminApi.updateProduct(id!, payload) : adminApi.createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'product', id] });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const validate = (): Record<string, unknown> | null => {
    const next: Partial<Record<keyof FormState, string>> = {};
    const price = Number(form.price);
    const mrp = Number(form.mrp);
    const stock = Number(form.stock);

    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!form.categoryId) next.categoryId = 'Select a category';
    if (!(price > 0)) next.price = 'Enter a valid price';
    if (!(mrp > 0)) next.mrp = 'Enter a valid MRP';
    if (price > 0 && mrp > 0 && price > mrp) next.price = 'Price cannot exceed MRP';
    if (!form.unitLabel.trim()) next.unitLabel = 'e.g. "1 kg", "500 g", "1 pc"';
    if (!Number.isInteger(stock) || stock < 0) next.stock = 'Enter a whole number';

    setErrors(next);
    if (Object.keys(next).length) return null;

    const images = form.images.map((img, idx) => ({ url: img.url, isPrimary: idx === 0, sortOrder: idx }));
    const base = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      price,
      mrp,
      unit: form.unit,
      unitLabel: form.unitLabel.trim(),
      stock,
      isActive: form.isActive,
      images,
    };
    return base;
  };

  const onSubmit = () => {
    const payload = validate();
    if (payload) save.mutate(payload);
  };

  if (isEdit && productQuery.isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (isEdit && productQuery.isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => productQuery.refetch()} /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Label text="Product images" />
          <ImageUploader value={form.images} onChange={(imgs) => set('images', imgs)} prefix="products" showPrimary max={8} />

          <View className="mt-4 gap-4">
            <Input label="Name" placeholder="e.g. Fresh Tomatoes" value={form.name} onChangeText={(t) => set('name', t)} error={errors.name} />

            <View>
              <Label text="Category" />
              <View className="flex-row flex-wrap gap-2">
                {(categories ?? []).map((c) => {
                  const active = c.id === form.categoryId;
                  return (
                    <Pressable key={c.id} onPress={() => set('categoryId', c.id)} className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.categoryId ? <Text className="mt-1 text-xs text-danger">{errors.categoryId}</Text> : null}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Price (₹)" placeholder="0" keyboardType="numeric" value={form.price} onChangeText={(t) => set('price', t)} error={errors.price} /></View>
              <View className="flex-1"><Input label="MRP (₹)" placeholder="0" keyboardType="numeric" value={form.mrp} onChangeText={(t) => set('mrp', t)} error={errors.mrp} /></View>
            </View>

            <View>
              <Label text="Unit" />
              <View className="flex-row flex-wrap gap-2">
                {UNITS.map((u) => {
                  const active = u === form.unit;
                  return (
                    <Pressable key={u} onPress={() => set('unit', u)} className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{u}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Unit label" placeholder='e.g. "1 kg"' value={form.unitLabel} onChangeText={(t) => set('unitLabel', t)} error={errors.unitLabel} /></View>
              <View className="flex-1"><Input label="Stock" placeholder="0" keyboardType="numeric" value={form.stock} onChangeText={(t) => set('stock', t)} error={errors.stock} /></View>
            </View>

            <Input label="Description" placeholder="Short description (optional)" value={form.description} onChangeText={(t) => set('description', t)} multiline numberOfLines={3} style={{ height: 90, textAlignVertical: 'top', paddingTop: 12 }} />

            <View className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
              <View>
                <Text className="text-sm font-semibold text-ink">Visible in store</Text>
                <Text className="text-xs text-ink-muted">Customers can see and buy this product</Text>
              </View>
              <Switch value={form.isActive} onValueChange={(v) => set('isActive', v)} trackColor={{ true: colors.primary }} />
            </View>
          </View>

          <View className="mt-6">
            <Button label={isEdit ? 'Save changes' : 'Add product'} loading={save.isPending} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-1.5 text-sm font-medium text-ink">{text}</Text>;
}
