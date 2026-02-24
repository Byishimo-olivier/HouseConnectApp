import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ViewStyle, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    scrollable?: boolean;
}

export function ScreenWrapper({ children, style, scrollable = false }: ScreenWrapperProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const content = (
        <View style={[styles.content, style]}>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            {scrollable ? (
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {content}
                </ScrollView>
            ) : (
                content
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
});
