import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabBarIcon } from './TabBarIcon';
import { colors } from '@/theme/colors';
import type { SellerTabParamList, SellerStackParamList } from './types';
import { SellerDashboardScreen } from '@/screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '@/screens/seller/SellerProductsScreen';
import { SellerOrdersScreen } from '@/screens/seller/SellerOrdersScreen';
import { SellerOrderDetailsScreen } from '@/screens/seller/SellerOrderDetailsScreen';

const Tab = createBottomTabNavigator<SellerTabParamList>();
const Stack = createNativeStackNavigator<SellerStackParamList>();

function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { paddingTop: 6 },
      }}
    >
      <Tab.Screen name="Dashboard" component={SellerDashboardScreen} options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabBarIcon name="stats-chart-outline" focused={focused} /> }} />
      <Tab.Screen name="Products" component={SellerProductsScreen} options={{ title: 'Products', tabBarIcon: ({ focused }) => <TabBarIcon name="cube-outline" focused={focused} /> }} />
      <Tab.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Orders', tabBarIcon: ({ focused }) => <TabBarIcon name="receipt-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export function SellerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.ink, headerShadowVisible: false }}>
      <Stack.Screen name="SellerTabs" component={SellerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SellerOrderDetails" component={SellerOrderDetailsScreen} options={{ title: 'Order details' }} />
    </Stack.Navigator>
  );
}
