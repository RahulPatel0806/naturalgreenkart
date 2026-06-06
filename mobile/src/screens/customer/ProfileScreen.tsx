import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import type { CustomerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center justify-between border-b border-surface-border py-3.5">
        <View className="flex-row items-center gap-3">
          <Text className="text-lg">{icon}</Text>
          <Text className="text-sm font-medium text-ink">{label}</Text>
        </View>
        <Text className="text-ink-soft">›</Text>
      </View>
    </Pressable>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Card className="mt-3 flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <Text className="text-2xl">👤</Text>
        </View>
        <View className="ml-3">
          <Text className="text-lg font-bold text-ink">{user?.name ?? 'Guest'}</Text>
          <Text className="text-sm text-ink-muted">+91 {user?.phone}</Text>
        </View>
      </Card>

      <Card className="mt-3">
        <MenuRow icon="📍" label="My addresses" onPress={() => navigation.navigate('Addresses')} />
        <MenuRow icon="🧾" label="My orders" onPress={() => navigation.navigate('Tabs', { screen: 'Orders' })} />
        <MenuRow icon="🛟" label="Help & support" onPress={() => Alert.alert('Support', 'Call us at 1800-200-300')} />
      </Card>

      <View className="mt-6">
        <Button
          label="Log out"
          variant="outline"
          onPress={() => Alert.alert('Log out?', 'You will need to sign in again.', [{ text: 'Cancel' }, { text: 'Log out', style: 'destructive', onPress: () => logout() }])}
        />
      </View>
    </Screen>
  );
}
