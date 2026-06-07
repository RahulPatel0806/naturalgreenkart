import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

/**
 * App-wide icon component. We standardise on Ionicons (bundled free with Expo
 * via @expo/vector-icons) so icons stay visually consistent everywhere — tab
 * bars, buttons, empty/error states and list rows.
 */
export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.ink }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
