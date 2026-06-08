import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { resolveImageUrl } from '@/lib/imageUrl';
import { Skeleton } from '@/components/ui';
import type { OfferBanner } from '@/types/api';

const SIDE = 16;
const GAP = 12;
const HEIGHT = 150;
const AUTOPLAY_MS = 3500;

/**
 * Auto-swiping promotional banner carousel for the customer home screen.
 * Renders nothing when there are no active banners. Auto-advances every few
 * seconds and pauses briefly after a manual swipe.
 */
export function BannerCarousel({ onPressBanner }: { onPressBanner: (banner: OfferBanner) => void }) {
  const { width } = useWindowDimensions();
  const itemWidth = width - SIDE * 2;
  const snap = itemWidth + GAP;

  const { data, isLoading } = useQuery({ queryKey: queryKeys.banners, queryFn: offersApi.banners });
  const banners = data ?? [];

  const listRef = useRef<FlatList<OfferBanner>>(null);
  const [index, setIndex] = useState(0);
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const next = (index + 1) % banners.length;
      listRef.current?.scrollToOffset({ offset: next * snap, animated: true });
      setIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [index, banners.length, snap]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / snap);
    setIndex(i);
    pausedUntil.current = Date.now() + AUTOPLAY_MS * 2; // give manual browsing room
  };

  if (isLoading) return <View style={{ paddingHorizontal: SIDE }}><Skeleton className="mt-4 h-[150px] w-full rounded-2xl" /></View>;
  if (banners.length === 0) return null;

  return (
    <View className="mt-4">
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => b.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingHorizontal: SIDE }}
        renderItem={({ item, index: i }) => (
          <Pressable
            onPress={() => onPressBanner(item)}
            style={{ width: itemWidth, height: HEIGHT, marginRight: i === banners.length - 1 ? 0 : GAP }}
            className="overflow-hidden rounded-2xl bg-surface-muted active:opacity-90"
          >
            <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={{ width: itemWidth, height: HEIGHT }} resizeMode="cover" />
            <View className="absolute inset-x-0 bottom-0 bg-black/35 px-4 py-3">
              <Text numberOfLines={1} className="text-base font-extrabold text-white">{item.title}</Text>
              {item.subtitle ? <Text numberOfLines={1} className="text-xs font-medium text-white/90">{item.subtitle}</Text> : null}
              {item.couponCode ? (
                <View className="mt-1 self-start rounded-md bg-white/95 px-2 py-0.5">
                  <Text className="text-[11px] font-extrabold tracking-wider text-primary-dark">CODE: {item.couponCode}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      {banners.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          {banners.map((b, i) => (
            <View key={b.id} className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-primary' : 'w-1.5 bg-surface-border'}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
