import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabBarIcon } from './TabBarIcon';
import { AppHeader } from '@/components/ui';
import { colors } from '@/theme/colors';
import type { AdminTabParamList, AdminStackParamList } from './types';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import { AdminOrdersScreen } from '@/screens/admin/AdminOrdersScreen';
import { AdminProductsScreen } from '@/screens/admin/AdminProductsScreen';
import { AdminProductFormScreen } from '@/screens/admin/AdminProductFormScreen';
import { AdminCategoriesScreen } from '@/screens/admin/AdminCategoriesScreen';
import { AdminCategoryFormScreen } from '@/screens/admin/AdminCategoryFormScreen';
import { AdminOffersScreen } from '@/screens/admin/AdminOffersScreen';
import { AdminCouponFormScreen } from '@/screens/admin/AdminCouponFormScreen';
import { AdminBannerFormScreen } from '@/screens/admin/AdminBannerFormScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ options }) => <AppHeader title={options.title ?? 'Aggrimart'} subtitle="Aggrimart · Admin" icon="shield-checkmark" />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { paddingTop: 6 },
      }}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Overview', tabBarLabel: 'Overview', tabBarIcon: ({ focused }) => <TabBarIcon name="stats-chart-outline" focused={focused} /> }} />
      <Tab.Screen name="Catalog" component={AdminProductsScreen} options={{ title: 'Catalog', tabBarIcon: ({ focused }) => <TabBarIcon name="cube-outline" focused={focused} /> }} />
      <Tab.Screen name="AdminOffers" component={AdminOffersScreen} options={{ title: 'Offers', tabBarLabel: 'Offers', tabBarIcon: ({ focused }) => <TabBarIcon name="pricetag-outline" focused={focused} /> }} />
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Users', tabBarIcon: ({ focused }) => <TabBarIcon name="people-outline" focused={focused} /> }} />
      <Tab.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: 'Orders', tabBarIcon: ({ focused }) => <TabBarIcon name="receipt-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.ink, headerShadowVisible: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit product' : 'Add product' })} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} options={{ title: 'Categories' }} />
      <Stack.Screen name="AdminCategoryForm" component={AdminCategoryFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit category' : 'Add category' })} />
      <Stack.Screen name="AdminCouponForm" component={AdminCouponFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit coupon' : 'New coupon' })} />
      <Stack.Screen name="AdminBannerForm" component={AdminBannerFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit banner' : 'New banner' })} />
    </Stack.Navigator>
  );
}
