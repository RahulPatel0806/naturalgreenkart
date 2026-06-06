import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBarIcon } from './TabBarIcon';
import { colors } from '@/theme/colors';
import type { AdminTabParamList } from './types';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import { AdminOrdersScreen } from '@/screens/admin/AdminOrdersScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Overview', tabBarIcon: ({ focused }) => <TabBarIcon emoji="📈" focused={focused} /> }} />
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Users', tabBarIcon: ({ focused }) => <TabBarIcon emoji="👥" focused={focused} /> }} />
      <Tab.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: 'Orders', tabBarIcon: ({ focused }) => <TabBarIcon emoji="🧾" focused={focused} /> }} />
    </Tab.Navigator>
  );
}
