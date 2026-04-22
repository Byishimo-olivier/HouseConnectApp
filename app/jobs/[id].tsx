import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';

export default function JobDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [job, setJob] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const data = await apiFetch(`/jobs/${id}`);
            setJob(data);
        } catch (error) {
            console.error('Failed to fetch job details:', error);
            Alert.alert('Error', 'Failed to load job details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper style={styles.container}>
                <ActivityIndicator size="large" color={String(theme.primary || '#2563EB')} />
            </ScreenWrapper>
        );
    }

    if (!job) {
        return (
            <ScreenWrapper style={styles.container}>
                <Text style={{ color: theme.textSecondary }}>Job not found</Text>
            </ScreenWrapper>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Job",
            "Are you sure you want to delete this job? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => router.back() }
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{job.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.statusText, { color: theme.primary }]}>{job.status || 'Active'}</Text>
                </View>
            </View>

            <Text style={[styles.date, { color: theme.textSecondary }]}>Posted {formatDate(job.createdAt)}</Text>

            <View style={styles.statsContainer}>
                <Card style={[styles.statsCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.statValue, { color: theme.primary }]}>{job.applicationsCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Applicants</Text>
                </Card>
                <Card style={[styles.statsCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{job.viewCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Views</Text>
                </Card>
            </View>

            <Card style={styles.detailsCard}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{job.description || 'No description provided'}</Text>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={20} color={theme.text} />
                    <Text style={[styles.detailText, { color: theme.text }]}>${job.budgetMin || 0} - ${job.budgetMax || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color={theme.text} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{new Date(job.scheduledDate || Date.now()).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color={theme.text} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{job.location || 'Location not specified'}</Text>
                </View>
            </Card>

            <Button
                title="View Applications"
                onPress={() => router.push({ pathname: '/applications/list', params: { jobId: id } })}
                style={styles.actionButton}
            />

            <View style={styles.secondaryActions}>
                <Button
                    title="Edit Job"
                    variant="outline"
                    onPress={() => { }}
                    style={{ flex: 1 }}
                />
                <Button
                    title="Delete"
                    variant="danger"
                    onPress={handleDelete}
                    style={{ flex: 1 }}
                />
            </View>
            <View style={{ height: 40 }} />
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
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        flex: 1,
        marginRight: Spacing.md,
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
        fontSize: FontSize.sm,
        marginBottom: Spacing.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statsCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: FontSize.xs,
    },
    detailsCard: {
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: FontSize.md,
        lineHeight: 24,
        marginBottom: Spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: Spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    detailText: {
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
    actionButton: {
        marginBottom: Spacing.md,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
});
