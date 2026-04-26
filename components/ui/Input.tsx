import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
    rightIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
}

export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    ...props
}: InputProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const isMultiline = Boolean(props.multiline);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: theme.background === '#111827' ? '#1F2937' : '#FFFFFF', // Darker background for inputs
                    borderColor: error ? theme.danger : theme.border,
                }
                ,
                isMultiline && styles.multilineContainer
            ]}>
                {leftIcon && (
                    typeof leftIcon === 'string' ? (
                        <Ionicons
                            name={leftIcon as any}
                            size={20}
                            color={theme.icon}
                            style={styles.leftIcon}
                        />
                    ) : (
                        <View style={styles.leftIcon}>{leftIcon}</View>
                    )
                )}

                <TextInput
                    style={[
                        styles.input,
                        { color: theme.text },
                        isMultiline && styles.multilineInput,
                        style
                    ]}
                    placeholderTextColor={theme.textSecondary}
                    {...props}
                />

                {rightIcon && (
                    typeof rightIcon === 'string' ? (
                        <Ionicons
                            name={rightIcon as any}
                            size={20}
                            color={theme.icon}
                            style={styles.rightIcon}
                            onPress={onRightIconPress}
                        />
                    ) : (
                        <View style={styles.rightIcon}>{rightIcon}</View>
                    )
                )}
            </View>

            {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        marginBottom: Spacing.xs,
        fontSize: FontSize.sm,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        height: 50,
        paddingHorizontal: Spacing.sm,
    },
    multilineContainer: {
        height: 'auto',
        minHeight: 96,
        alignItems: 'flex-start',
        paddingVertical: Spacing.xs,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: FontSize.md,
        paddingHorizontal: Spacing.sm,
    },
    multilineInput: {
        minHeight: 84,
        height: 'auto',
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    leftIcon: {
        marginRight: Spacing.xs,
    },
    rightIcon: {
        marginLeft: Spacing.xs,
    },
    errorText: {
        marginTop: Spacing.xs,
        fontSize: FontSize.xs,
    },
});
