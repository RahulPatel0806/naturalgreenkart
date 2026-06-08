import type { ReactNode } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';

interface AppHeaderProps {
  /** Main heading text (e.g. the current section or brand name). */
  title: string;
  /** Secondary line under the title (e.g. role, location, greeting). */
  subtitle?: string;
  /** Leading badge icon. Defaults to the Aggrimart leaf mark. */
  icon?: IconName;
  /** Extra actions rendered to the left of the account button (e.g. a bell). */
  children?: ReactNode;
  /** Hide the built-in account / log out button. */
  showAccount?: boolean;
}

/**
 * Instamart-style branded app header: a green bar with a leading brand badge,
 * a title + subtitle, and an account button that offers a log out action.
 * Handles the top safe-area inset itself so it can be used as a React Navigation
 * custom `header` or rendered inline at the top of a screen.
 */
export function AppHeader({ title, subtitle, icon = 'leaf', children, showAccount = true }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onAccount = () => {
    Alert.alert(
      user?.name ?? 'Account',
      user?.phone ? `+91 ${user.phone}` : 'Manage your session',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void logout() },
      ],
    );
  };

  return (
    <View style={{ paddingTop: insets.top }} className="bg-primary">
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Icon name={icon} size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-lg font-extrabold text-white">
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} className="text-xs font-medium text-white/80">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {children}
          {showAccount ? (
            <Pressable
              onPress={onAccount}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Account and log out"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
            >
              <Icon name="person-circle-outline" size={26} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
