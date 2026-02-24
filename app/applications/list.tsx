import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ApplicationsListScreen() {
    const { jobId } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchApplicants();
        }, [])
    );

    const fetchApplicants = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/jobs/employer/applications');
            setApplicants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch applicants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => router.push({ pathname: '/applications/[id]', params: { id: item.id } })}>
            <Card style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{(item.maid?.fullName || '?').charAt(0)}</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: theme.text }]}>{item.maid?.fullName || 'Maid'}</Text>
                        <View style={styles.stats}>
                            <Text style={[styles.rating, { color: theme.textSecondary }]}>Applying for: {item.job?.title}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, theme) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status, theme) }]}>{item.status}</Text>
                    </View>
                </View>
                <Text style={[styles.date, { color: theme.textSecondary }]}>
                    Applied {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </Card>
        </TouchableOpacity>
    );

    const getStatusColor = (status: string, theme: any) => {
        switch (status) {
            case 'Applied': return theme.primary;
            case 'Interview': return theme.warning;
            case 'Rejected': return theme.danger;
            case 'Hired': return theme.success;
            default: return theme.textSecondary;
        }
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Applicants</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Viewing all applications</Text>
            </View>

            {isLoading && (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
            )}

            <FlatList
                data={applicants}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!isLoading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: theme.textSecondary }}>No applications found.</Text>
                    </View>
                ) : null}
            />
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
    subtitle: {
        fontSize: FontSize.sm,
    },
    list: {
        gap: Spacing.md,
    },
    card: {
        padding: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: FontSize.xs,
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
    date: {
        fontSize: FontSize.xs,
        textAlign: 'right',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    }
});
