import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabBarIcon } from './TabBarIcon';
import { colors } from '@/theme/colors';
import type { CustomerStackParamList, CustomerTabParamList } from './types';
import { HomeScreen } from '@/screens/customer/HomeScreen';
import { CartScreen } from '@/screens/customer/CartScreen';
import { OrdersScreen } from '@/screens/customer/OrdersScreen';
import { ProfileScreen } from '@/screens/customer/ProfileScreen';
import { ProductListScreen } from '@/screens/customer/ProductListScreen';
import { ProductDetailsScreen } from '@/screens/customer/ProductDetailsScreen';
import { CheckoutScreen } from '@/screens/customer/CheckoutScreen';
import { OrderDetailsScreen } from '@/screens/customer/OrderDetailsScreen';
import { AddressesScreen } from '@/screens/customer/AddressesScreen';
import { CartBadge } from '@/screens/customer/CartBadge';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabBarIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarIcon: ({ focused }) => <CartBadge focused={focused} /> }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: ({ focused }) => <TabBarIcon emoji="🧾" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabBarIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.ink, headerShadowVisible: false }}>
      <Stack.Screen name="Tabs" component={CustomerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={({ route }) => ({ title: route.params?.categoryName ?? 'Products' })} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order details' }} />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'My addresses' }} />
    </Stack.Navigator>
  );
}
