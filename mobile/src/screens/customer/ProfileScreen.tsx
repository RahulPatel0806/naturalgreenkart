import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Card, Icon, type IconName } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/features/notifications/useNotifications';
import { colors } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function MenuRow({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center justify-between border-b border-surface-border py-3.5">
        <View className="flex-row items-center gap-3">
          <Icon name={icon} size={20} color={colors.primaryDark} />
          <Text className="text-sm font-medium text-ink">{label}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {badge ? (
            <View className="min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5">
              <Text className="text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
          <Icon name="chevron-forward" size={18} color={colors.inkSoft} />
        </View>
      </View>
    </Pressable>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unread = useUnreadCount();

  return (
    <Screen>
      <Card className="mt-3 flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <Icon name="person" size={26} color={colors.primaryDark} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-ink">{user?.name ?? 'Guest'}</Text>
          <Text className="text-sm text-ink-muted">+91 {user?.phone}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('EditProfile')} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-lg bg-surface-muted active:opacity-70">
          <Icon name="create-outline" size={18} color={colors.ink} />
        </Pressable>
      </Card>

      <Card className="mt-3">
        <MenuRow icon="notifications-outline" label="Notifications" badge={unread} onPress={() => navigation.navigate('Notifications')} />
        <MenuRow icon="receipt-outline" label="My orders" onPress={() => navigation.navigate('Tabs', { screen: 'Orders' })} />
        <MenuRow icon="location-outline" label="My addresses" onPress={() => navigation.navigate('Addresses')} />
        <MenuRow icon="person-outline" label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <MenuRow icon="help-buoy-outline" label="Help & support" onPress={() => Alert.alert('Help & support', 'Call us at 1800-200-300', [{ text: 'Close' }, { text: 'Call', onPress: () => Linking.openURL('tel:1800200300') }])} />
      </Card>

      <View className="mt-6">
        <Button
          label="Log out"
          variant="outline"
          icon={<Icon name="log-out-outline" size={18} color={colors.ink} />}
          onPress={() => Alert.alert('Log out?', 'You will need to sign in again.', [{ text: 'Cancel' }, { text: 'Log out', style: 'destructive', onPress: () => logout() }])}
        />
      </View>
    </Screen>
  );
}
