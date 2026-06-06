import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBarIcon } from './TabBarIcon';
import { colors } from '@/theme/colors';
import type { SellerTabParamList } from './types';
import { SellerDashboardScreen } from '@/screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '@/screens/seller/SellerProductsScreen';
import { SellerOrdersScreen } from '@/screens/seller/SellerOrdersScreen';

const Tab = createBottomTabNavigator<SellerTabParamList>();

export function SellerNavigator() {
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
      <Tab.Screen name="Dashboard" component={SellerDashboardScreen} options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabBarIcon emoji="📊" focused={focused} /> }} />
      <Tab.Screen name="Products" component={SellerProductsScreen} options={{ title: 'Products', tabBarIcon: ({ focused }) => <TabBarIcon emoji="📦" focused={focused} /> }} />
      <Tab.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Orders', tabBarIcon: ({ focused }) => <TabBarIcon emoji="🧾" focused={focused} /> }} />
    </Tab.Navigator>
  );
}
