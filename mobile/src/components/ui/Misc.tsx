import { Pressable, Text, View } from 'react-native';
import { ORDER_STATUS_META } from '@/theme/colors';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl bg-white p-4 ${className}`}>{children}</View>;
}

export function StatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status] ?? { label: status, color: '#475569', bg: '#F1F5F9' };
  return (
    <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: meta.bg }}>
      <Text className="text-xs font-semibold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}

/** +/- quantity stepper used in product cards and the cart. */
export function QuantityStepper({
  value,
  onChange,
  max = 99,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center overflow-hidden rounded-lg border border-primary">
      <Pressable
        disabled={disabled}
        onPress={() => onChange(Math.max(0, value - 1))}
        className="h-8 w-8 items-center justify-center bg-primary-light active:opacity-70"
      >
        <Text className="text-lg font-bold text-primary-dark">−</Text>
      </Pressable>
      <Text className="min-w-8 text-center text-sm font-bold text-primary-dark">{value}</Text>
      <Pressable
        disabled={disabled || value >= max}
        onPress={() => onChange(value + 1)}
        className="h-8 w-8 items-center justify-center bg-primary active:opacity-80"
      >
        <Text className="text-lg font-bold text-white">+</Text>
      </Pressable>
    </View>
  );
}
