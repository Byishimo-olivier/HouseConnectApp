import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';

type JobStatus = 'OPEN' | 'CLOSED' | 'FILLED';

export default function JobsListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'ALL' | JobStatus>('ALL');

    const fetchJobs = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await apiFetch('/jobs/my-jobs');
            setJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchJobs();
        }, [fetchJobs])
    );

    const onRefresh = useCallback(() => {
        fetchJobs(true);
    }, [fetchJobs]);

    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'ALL') return true;
        return job.status === activeTab;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return theme.success;
            case 'CLOSED': return theme.danger;
            case 'FILLED': return theme.primary;
            default: return theme.textSecondary;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderJobItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}
            activeOpacity={0.7}
        >
            <Card style={styles.jobCard}>
                <View style={styles.jobHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.row}>
                            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.jobDate, { color: theme.textSecondary }]}>{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.jobDescriptionContainer}>
                    <Text style={[styles.jobDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                        {item.description}
                    </Text>
                </View>

                <View style={styles.jobFooter}>
                    <View style={styles.footerInfo}>
                        <View style={styles.statItem}>
                            <Ionicons name="location-outline" size={16} color={theme.primary} />
                            <Text style={[styles.statText, { color: theme.text }]} numberOfLines={1}>{item.location}</Text>
                        </View>
                        {(item.salaryMin || item.salaryMax) && (
                            <View style={styles.statItem}>
                                <Ionicons name="cash-outline" size={16} color={theme.success} />
                                <Text style={[styles.statText, { color: theme.text }]}>
                                    {item.salaryMin ? `${item.salaryMin.toLocaleString()}` : ''}
                                    {item.salaryMin && item.salaryMax ? ' - ' : ''}
                                    {item.salaryMax ? `${item.salaryMax.toLocaleString()}` : ''} RWF
                                </Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.applicantsBtn, { backgroundColor: theme.primary + '10' }]}
                        onPress={() => router.push({ pathname: '/applications/list', params: { jobId: item.id } })}
                    >
                        <Text style={[styles.applicantsText, { color: theme.primary }]}>View Applicants</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.screenHeader}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>My Job Postings</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your active and past jobs</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/employee/jobs/new')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {(['ALL', 'OPEN', 'FILLED', 'CLOSED'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab ? [styles.activeTab, { borderColor: theme.primary }] : { borderColor: 'transparent' }
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? theme.primary : theme.textSecondary }
                            ]}>{tab === 'ALL' ? 'All Jobs' : tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                                <Ionicons name="briefcase-outline" size={48} color={theme.textSecondary + '50'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No jobs found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                {activeTab === 'ALL'
                                    ? "You haven't posted any jobs yet."
                                    : `You don't have any jobs marked as ${activeTab.toLowerCase()}.`}
                            </Text>
                            {activeTab === 'ALL' && (
                                <Button
                                    title="Post Your First Job"
                                    onPress={() => router.push('/employee/jobs/new')}
                                    style={styles.emptyButton}
                                />
                            )}
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    screenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    tabsContainer: {
        marginBottom: Spacing.md,
    },
    tabsScroll: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    list: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    jobCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 0,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    jobTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    jobDate: {
        fontSize: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    jobDescriptionContainer: {
        marginBottom: Spacing.md,
        paddingTop: Spacing.xs,
    },
    jobDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    jobFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerInfo: {
        flex: 1,
        gap: 6,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
    },
    applicantsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 2,
    },
    applicantsText: {
        fontSize: 11,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xxl,
        marginTop: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.xl,
    },
    emptyButton: {
        minWidth: 200,
    },
});
