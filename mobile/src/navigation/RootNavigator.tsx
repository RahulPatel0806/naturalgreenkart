import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/auth.store';
import { SplashScreen } from '@/screens/shared/SplashScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { SellerNavigator } from './SellerNavigator';
import { AdminNavigator } from './AdminNavigator';

const Stack = createNativeStackNavigator();

/** Routes the user to the correct app shell based on auth status + role. */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'loading' ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : status === 'unauthenticated' ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user?.role === 'ADMIN' ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : user?.role === 'SELLER' ? (
          <Stack.Screen name="Seller" component={SellerNavigator} />
        ) : (
          <Stack.Screen name="Customer" component={CustomerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
