import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const VARIANT: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary active:bg-primary-dark', text: 'text-white' },
  secondary: { container: 'bg-primary-light active:opacity-80', text: 'text-primary-dark' },
  outline: { container: 'border border-surface-border bg-white active:bg-surface-muted', text: 'text-ink' },
  danger: { container: 'bg-danger active:opacity-90', text: 'text-white' },
  ghost: { container: 'bg-transparent active:bg-surface-muted', text: 'text-primary' },
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3',
  md: 'h-12 px-4',
  lg: 'h-14 px-5',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = VARIANT[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${v.container} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} flex-row items-center justify-center rounded-xl ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#16A34A' : '#fff'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`${v.text} text-base font-semibold`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
