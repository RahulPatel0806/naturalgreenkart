import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, Button, Input, Card, Icon, LoadingState } from '@/components/ui';
import { profileApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/store/query';
import { colors } from '@/theme/colors';
import type { Address } from '@/types/api';

const schema = z.object({
  type: z.enum(['HOME', 'WORK', 'OTHER']),
  fullName: z.string().min(2, 'Enter a name'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit number'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode'),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { type: 'HOME', fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' };
const TYPES: FormValues['type'][] = ['HOME', 'WORK', 'OTHER'];

export function AddressesScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: addresses, isLoading } = useQuery({ queryKey: queryKeys.addresses, queryFn: profileApi.addresses });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.addresses });
  const closeForm = () => { setShowForm(false); setEditingId(null); reset(EMPTY); };

  const save = useMutation({
    mutationFn: (v: FormValues) => (editingId ? profileApi.updateAddress(editingId, v) : profileApi.createAddress(v)),
    onSuccess: () => { invalidate(); closeForm(); },
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not save address'),
  });
  const setDefault = useMutation({ mutationFn: (id: string) => profileApi.setDefaultAddress(id), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => profileApi.deleteAddress(id), onSuccess: invalidate });

  const startAdd = () => { reset(EMPTY); setEditingId(null); setShowForm(true); };
  const startEdit = (a: Address) => {
    reset({
      type: a.type, fullName: a.fullName, phone: a.phone, line1: a.line1,
      line2: a.line2 ?? '', landmark: a.landmark ?? '', city: a.city, state: a.state, pincode: a.pincode,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const confirmDelete = (a: Address) =>
    Alert.alert('Delete address', `Remove ${a.type.toLowerCase()} address?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(a.id) },
    ]);

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;

  const selectedType = watch('type');

  return (
    <Screen>
      <Text className="py-3 text-lg font-bold text-ink">Saved addresses</Text>

      {(addresses ?? []).map((a: Address) => (
        <Card key={a.id} className="mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-ink">{a.type} · {a.fullName}</Text>
            {a.isDefault ? <Text className="text-xs font-semibold text-primary">Default</Text> : null}
          </View>
          <Text className="mt-1 text-sm text-ink-muted">
            {a.line1}{a.line2 ? `, ${a.line2}` : ''}{a.landmark ? ` (near ${a.landmark})` : ''}, {a.city}, {a.state} - {a.pincode}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-muted">+91 {a.phone}</Text>
          <View className="mt-2 flex-row gap-4">
            {!a.isDefault ? <Pressable onPress={() => setDefault.mutate(a.id)}><Text className="text-xs font-semibold text-primary">Set default</Text></Pressable> : null}
            <Pressable onPress={() => startEdit(a)}><Text className="text-xs font-semibold text-ink-muted">Edit</Text></Pressable>
            <Pressable onPress={() => confirmDelete(a)}><Text className="text-xs font-semibold text-danger">Delete</Text></Pressable>
          </View>
        </Card>
      ))}

      {!showForm ? (
        <View className="mt-3">
          <Button label="Add new address" variant="outline" icon={<Icon name="add" size={18} color={colors.ink} />} onPress={startAdd} />
        </View>
      ) : (
        <Card className="mt-3 gap-3">
          <Text className="text-base font-bold text-ink">{editingId ? 'Edit address' : 'New address'}</Text>

          <View>
            <Text className="mb-1.5 text-sm font-medium text-ink">Address type</Text>
            <View className="flex-row gap-2">
              {TYPES.map((t) => {
                const active = t === selectedType;
                return (
                  <Pressable key={t} onPress={() => setValue('type', t)} className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                    <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field control={control} name="fullName" label="Full name" error={errors.fullName?.message} />
          <Field control={control} name="phone" label="Phone" keyboardType="phone-pad" error={errors.phone?.message} />
          <Field control={control} name="line1" label="Address line 1" error={errors.line1?.message} />
          <Field control={control} name="line2" label="Address line 2 (optional)" error={errors.line2?.message} />
          <Field control={control} name="landmark" label="Landmark (optional)" error={errors.landmark?.message} />
          <Field control={control} name="city" label="City" error={errors.city?.message} />
          <Field control={control} name="state" label="State" error={errors.state?.message} />
          <Field control={control} name="pincode" label="Pincode" keyboardType="number-pad" error={errors.pincode?.message} />
          <Button label={editingId ? 'Save changes' : 'Save address'} loading={save.isPending} onPress={handleSubmit((v) => save.mutate(v))} />
          <Button label="Cancel" variant="ghost" onPress={closeForm} />
        </Card>
      )}
    </Screen>
  );
}

function Field({ control, name, label, error, keyboardType }: { control: any; name: keyof FormValues; label: string; error?: string; keyboardType?: 'phone-pad' | 'number-pad' }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <Input label={label} value={value} onChangeText={onChange} onBlur={onBlur} error={error} keyboardType={keyboardType} />
      )}
    />
  );
}
