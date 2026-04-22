import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AssistantLauncherButtonProps {
  onPress: () => void;
}

export function AssistantLauncherButton({ onPress }: AssistantLauncherButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open assistant"
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.primary,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <Ionicons name="sparkles" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    marginRight: Spacing.sm,
  },
});
