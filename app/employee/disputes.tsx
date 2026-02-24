import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function EmployeeDisputesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Mock data
    const [disputes] = useState([
        {
            id: '1',
            contractTitle: 'House Cleaning',
            reason: 'Unfinished work',
            status: 'OPEN',
            createdAt: '2026-02-10',
            description: 'The kitchen was not cleaned thoroughly as per the agreement.'
        },
        {
            id: '2',
            contractTitle: 'Nanny Service',
            reason: 'Late arrival',
            status: 'RESOLVED',
            createdAt: '2026-01-25',
            description: 'Maid arrived 2 hours late 3 days in a row.'
        },
    ]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return { bg: theme.warning + '20', text: theme.warning };
            case 'RESOLVED': return { bg: theme.primary + '20', text: theme.primary };
            case 'CLOSED': return { bg: theme.textSecondary + '20', text: theme.textSecondary };
            default: return { bg: theme.border, text: theme.text };
        }
    };

    const renderDisputeItem = ({ item }: { item: any }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <Card style={styles.disputeCard}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.contractTitle, { color: theme.text }]}>{item.contractTitle}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <Text style={[styles.reason, { color: theme.textSecondary }]}>Reason: {item.reason}</Text>
                <Text style={[styles.date, { color: theme.textSecondary }]}>Filed on: {item.createdAt}</Text>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
                    {item.description}
                </Text>

                <TouchableOpacity style={styles.viewDetailBtn}>
                    <Text style={[styles.viewDetailText, { color: theme.primary }]}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>My Disputes</Text>
                <Ionicons name="shield-checkmark-outline" size={28} color={theme.primary} />
            </View>

            <FlatList
                data={disputes}
                renderItem={renderDisputeItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={60} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No disputes found.</Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
    },
    list: {
        gap: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    disputeCard: {
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    contractTitle: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    reason: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: FontSize.xs,
        marginBottom: Spacing.sm,
    },
    divider: {
        height: 1,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: FontSize.sm,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    viewDetailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    viewDetailText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSize.md,
    },
});
