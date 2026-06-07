import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/colors';

/** Bottom-tab icon using the shared Ionicons-based Icon component. */
export function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <Icon name={name} size={24} color={focused ? colors.primary : colors.inkSoft} />;
}
