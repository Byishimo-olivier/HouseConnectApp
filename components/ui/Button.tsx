import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (disabled) return theme.border;
        switch (variant) {
            case 'primary': return theme.primary;
            case 'secondary': return theme.secondary;
            case 'danger': return theme.danger;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textSecondary;
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return '#FFFFFF';
            case 'danger': return '#FFFFFF';
            case 'outline': return theme.primary;
            case 'ghost': return theme.text;
            default: return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.primary;
        return 'transparent';
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
            case 'md': return { paddingVertical: 12, paddingHorizontal: Spacing.lg };
            case 'lg': return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
            default: return { paddingVertical: 12, paddingHorizontal: Spacing.lg };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return FontSize.sm;
            case 'md': return FontSize.md;
            case 'lg': return FontSize.lg;
            default: return FontSize.md;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            style={[
                styles.container,
                getPadding(),
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                },
                style,
            ]}
        >
            {isLoading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && <React.Fragment>{icon}</React.Fragment>}
                    <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
});
