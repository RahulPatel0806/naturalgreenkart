import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@/theme/colors';

interface ReasonModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  /** Require non-empty text before confirm is enabled. */
  required?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Cross-platform confirmation dialog with an optional free-text reason — used
 * when a seller rejects or cancels an order (Alert.prompt is iOS-only).
 */
export function ReasonModal({
  visible, title, message, placeholder = 'Add a note (optional)',
  confirmLabel, confirmVariant = 'primary', required = false, loading, onConfirm, onClose,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  const canConfirm = !required || reason.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
          <Pressable onPress={(e) => e.stopPropagation()} className="rounded-t-3xl bg-white p-5">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            {message ? <Text className="mt-1 text-sm text-ink-muted">{message}</Text> : null}

            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={placeholder}
              placeholderTextColor={colors.inkSoft}
              multiline
              className="mt-3 min-h-[72px] rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-base text-ink"
              style={{ textAlignVertical: 'top' }}
            />

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1"><Button label="Cancel" variant="outline" onPress={onClose} /></View>
              <View className="flex-1">
                <Button
                  label={confirmLabel}
                  variant={confirmVariant}
                  loading={loading}
                  disabled={!canConfirm}
                  onPress={() => onConfirm(reason.trim())}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
