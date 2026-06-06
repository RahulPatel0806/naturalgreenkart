import { ActivityIndicator, Text, View } from 'react-native';

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-6xl">🥦</Text>
      <Text className="mt-4 text-3xl font-extrabold text-white">Natural greenkart</Text>
      <Text className="mt-1 text-sm text-primary-light">Fresh groceries, delivered fast</Text>
      <ActivityIndicator className="mt-8" color="#fff" />
    </View>
  );
}
