import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, hint, ...props }, ref) => {
  return (
    <View className="w-full">
      {label ? <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkSoft}
        className={`h-12 rounded-xl border bg-white px-4 text-base text-ink ${
          error ? 'border-danger' : 'border-surface-border'
        }`}
        {...props}
      />
      {error ? (
        <Text className="mt-1 text-xs text-danger">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';
