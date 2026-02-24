import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HtmlContentScreen() {
    const { title, type } = useLocalSearchParams<{ title: string; type: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getContent = () => {
        switch (type) {
            case 'terms':
                return `1. Acceptance of Terms\nBy accessing and using MaidConnect, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Service Description\nMaidConnect provides a platform for connecting households with cleaning professionals.\n\n3. User Conduct\nUsers agree to provide accurate information and conduct themselves professionally.`;
            case 'privacy':
                return `1. Information Collection\nWe collect information you provide directly to us, such as when you create or modify your account.\n\n2. Use of Information\nWe use the information we collect to provide, maintain, and improve our services.\n\n3. Data Security\nWe implement reasonable security measures to protect your personal information.`;
            case 'help':
                return `How do I post a job?\nGo to the dashboard and tap "Post Job". Fill in the details and submit.\n\nHow do I pay?\nGo to the Payments section to manage your wallet and view transactions.\n\nNeed more help?\nContact support@maidconnect.com`;
            default:
                return 'Content not found.';
        }
    };

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{title || 'Information'}</Text>
            </View>
            <View style={[styles.contentContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.content, { color: theme.textSecondary }]}>{getContent()}</Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
    },
    contentContainer: {
        padding: Spacing.md,
        borderRadius: 12,
    },
    content: {
        fontSize: FontSize.md,
        lineHeight: 24,
    },
});
