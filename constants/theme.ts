import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Modern Blue
const tintColorDark = '#3B82F6';

export const Colors = {
  light: {
    text: '#1F2937', // Gray 900
    background: '#F9FAFB', // Gray 50
    tint: tintColorLight,
    icon: '#6B7280', // Gray 500
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    primary: '#2563EB',
    secondary: '#10B981', // Emerald
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
    shadow: '#000000',
    accent: '#8B5CF6', // Violet
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827', // Gray 900
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
    primary: '#3B82F6',
    secondary: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    surface: '#1F2937', // Gray 800
    border: '#374151', // Gray 700
    textSecondary: '#9CA3AF',
    card: '#1F2937',
    shadow: '#000000',
    accent: '#A78BFA', // Violet
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
});
