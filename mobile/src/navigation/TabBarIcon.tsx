import { Text } from 'react-native';

/** Lightweight emoji tab icon (keeps the dependency footprint minimal). */
export function TabBarIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}
