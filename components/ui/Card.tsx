import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];


    const getStyle = () => {
        const baseStyle: ViewStyle = {
            backgroundColor: theme.card,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
        };

        if (variant === 'elevated') {
            const shadowStyle: ViewStyle = Platform.OS === 'web'
                ? { boxShadow: `0px 2px 8px ${theme.shadow}1a` } as any
                : {
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                };
            return {
                ...baseStyle,
                ...shadowStyle,
            };
        } else if (variant === 'outlined') {
            return {
                ...baseStyle,
                borderWidth: 1,
                borderColor: theme.border,
            };
        } else {
            return baseStyle; // flat
        }
    };

    return <View style={[getStyle(), style]}>{children}</View>;
}
