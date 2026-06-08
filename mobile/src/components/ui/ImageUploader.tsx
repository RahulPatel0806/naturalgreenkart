import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '@/theme/colors';
import { chooseImageSource } from '@/lib/images';
import { resolveImageUrl } from '@/lib/imageUrl';
import { uploadApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';

export interface UploadedImage {
  url: string;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  prefix?: 'products' | 'categories';
  max?: number;
  /** When true, the first image is highlighted as primary and can be reordered. */
  showPrimary?: boolean;
}

/**
 * Add product/category images from the camera or photo library. Each pick is
 * uploaded to the server and the returned public URL is stored. Handles upload
 * progress, removal and (optionally) choosing the primary image.
 */
export function ImageUploader({ value, onChange, prefix = 'products', max = 8, showPrimary = false }: ImageUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const atMax = value.length + uploadingCount >= max;

  const add = async () => {
    if (atMax) return;
    const uri = await chooseImageSource();
    if (!uri) return;
    setUploadingCount((c) => c + 1);
    try {
      const result = await uploadApi.image(uri, prefix);
      onChange([...value, { url: result.url }]);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof ApiError ? e.message : 'Could not upload image. Try again.');
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const makePrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  };

  return (
    <View className="w-full">
      <View className="flex-row flex-wrap gap-3">
        {value.map((img, idx) => (
          <View key={img.url} className="relative">
            <Image source={{ uri: resolveImageUrl(img.url) }} className="h-24 w-24 rounded-xl bg-surface-muted" resizeMode="cover" />
            {showPrimary && idx === 0 ? (
              <View className="absolute bottom-1 left-1 rounded-full bg-primary px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-white">Primary</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => remove(idx)}
              hitSlop={8}
              className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-danger"
            >
              <Icon name="close" size={14} color="#fff" />
            </Pressable>
            {showPrimary && idx !== 0 ? (
              <Pressable
                onPress={() => makePrimary(idx)}
                hitSlop={8}
                className="absolute -left-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-white border border-surface-border"
              >
                <Icon name="star-outline" size={13} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
        ))}

        {Array.from({ length: uploadingCount }).map((_, i) => (
          <View key={`uploading-${i}`} className="h-24 w-24 items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-muted">
            <ActivityIndicator color={colors.primary} />
          </View>
        ))}

        {!atMax ? (
          <Pressable
            onPress={add}
            className="h-24 w-24 items-center justify-center rounded-xl border border-dashed border-primary bg-primary-light active:opacity-70"
          >
            <Icon name="camera-outline" size={24} color={colors.primary} />
            <Text className="mt-1 text-xs font-semibold text-primary-dark">Add</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="mt-1.5 text-xs text-ink-muted">
        {showPrimary ? 'First image is the primary. Tap ☆ to make another primary.' : 'JPEG, PNG or WebP up to 5 MB.'}
      </Text>
    </View>
  );
}
