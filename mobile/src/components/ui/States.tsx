import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@/theme/colors';

/** Full-screen loading spinner. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-3 text-sm text-ink-muted">{label}</Text>
    </View>
  );
}

/** Empty placeholder for lists with no data. */
export function EmptyState({ title, message, icon = '🛒', action }: { title: string; message?: string; icon?: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-5xl">{icon}</Text>
      <Text className="mt-4 text-center text-lg font-semibold text-ink">{title}</Text>
      {message ? <Text className="mt-1 text-center text-sm text-ink-muted">{message}</Text> : null}
      {action ? (
        <View className="mt-5 w-48">
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

/** Error state with a retry affordance. */
export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-5xl">⚠️</Text>
      <Text className="mt-4 text-center text-base font-medium text-ink">{message}</Text>
      {onRetry ? (
        <View className="mt-5 w-40">
          <Button label="Try again" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/** Shimmer-ish skeleton block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`rounded-lg bg-surface-border/60 ${className}`} />;
}
