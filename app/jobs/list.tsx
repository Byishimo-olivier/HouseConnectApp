import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    ScrollView,
    Alert,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useProfile } from '@/context/ProfileContext';

type JobStatus = 'OPEN' | 'CLOSED' | 'FILLED';
type PendingReopen = {
    jobId: number;
    transactionId: string;
    salaryMax: number;
};

const JOB_REOPEN_PERCENTAGE = 0.1;
const PAYMENT_CURRENCY = 'RWF';
const DEFAULT_PAYMENT_PROVIDER = (
    process.env.EXPO_PUBLIC_PAYMENT_PROVIDER ||
    process.env.EXPO_PUBLIC_PAWAPAY_PROVIDER ||
    'MTN_MOMO_RWA'
).trim();

const toPositiveNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

const calculateReopenFee = (salaryMax: number) => Math.ceil(salaryMax * JOB_REOPEN_PERCENTAGE);

export default function JobsListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile } = useProfile();

    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'ALL' | JobStatus>('ALL');
    const [actionJobId, setActionJobId] = useState<number | null>(null);
    const [pendingReopen, setPendingReopen] = useState<PendingReopen | null>(null);
    const [isAutoVerifying, setIsAutoVerifying] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupMessage, setPopupMessage] = useState('');

    const showPopup = useCallback((title: string, message: string) => {
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupVisible(true);
    }, []);

    const isPendingVerificationError = useCallback((error: unknown) => {
        const rawMessage = error instanceof Error
            ? error.message
            : String((error as any)?.message || error || '');
        const message = rawMessage.toLowerCase();
        return (
            message.includes('pending confirmation')
            || message.includes('still pending')
            || message.includes('try again shortly')
        );
    }, []);

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

    const verifyAndReopenJob = useCallback(async (payload: PendingReopen) => {
        await apiFetch('/payments/verify-job-posting', {
            method: 'POST',
            body: JSON.stringify({
                transaction_id: payload.transactionId,
                salaryMax: payload.salaryMax
            })
        });

        await apiFetch(`/jobs/${payload.jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'OPEN',
                paymentTransactionId: payload.transactionId
            })
        });

        setPendingReopen(null);
        setIsAutoVerifying(false);
        await fetchJobs();
        showPopup('Job Reopened', 'Payment confirmed and job is open again for maids.');
    }, [fetchJobs, showPopup]);

    const startReopenPayment = async (job: any) => {
        const salaryMax = toPositiveNumber(job?.salaryMax);
        if (!salaryMax) {
            Alert.alert('Cannot Reopen', 'This job has no valid max salary, so 10% fee cannot be calculated.');
            return;
        }

        if (!profile?.email || !profile?.fullName) {
            Alert.alert('Missing Profile Info', 'Please update your profile email and full name before payment.');
            return;
        }

        const payerPhoneNumber = String(profile?.phone || '').replace(/\s+/g, '').trim();
        if (!payerPhoneNumber) {
            Alert.alert('Missing Phone Number', 'Please add your phone number in profile before payment.');
            return;
        }

        const amount = calculateReopenFee(salaryMax);
        setActionJobId(job.id);
        try {
            const deposit = await apiFetch('/payments/deposit', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    currency: PAYMENT_CURRENCY,
                    email: profile.email,
                    fullName: profile.fullName,
                    phone: payerPhoneNumber,
                    phoneNumber: payerPhoneNumber,
                    provider: DEFAULT_PAYMENT_PROVIDER || undefined,
                    clientReferenceId: `JOB-REOPEN-${job.id}-${Date.now()}`,
                    customerMessage: 'Job reopen fee',
                    metadata: [
                        { purpose: 'JOB_REOPEN' },
                        { jobId: String(job.id) },
                        { salaryMax: String(salaryMax) }
                    ]
                })
            });

            const txRef = String(deposit?.tx_ref || '').trim();
            if (!txRef) throw new Error('Payment reference not returned by server');

            setPendingReopen({
                jobId: Number(job.id),
                transactionId: txRef,
                salaryMax
            });

            const sandbox = Boolean(deposit?.sandbox);
            const providerUsed = String(deposit?.providerUsed || DEFAULT_PAYMENT_PROVIDER || '').trim();
            const phoneUsed = String(deposit?.phoneNumberUsed || payerPhoneNumber).trim();
            const instruction = sandbox
                ? 'Sandbox mode: no real MoMo popup. Use verify to complete testing.'
                : 'Confirm payment on mobile money. Job will reopen automatically after payment success.';
            const providerLine = providerUsed ? `\nProvider: ${providerUsed}` : '';

            showPopup(
                'Reopen Payment Initiated',
                `${instruction}\n\nAmount: ${amount.toLocaleString()} ${PAYMENT_CURRENCY}\nNumber: ${phoneUsed}${providerLine}\nReference: ${txRef}`
            );
        } catch (error: any) {
            console.error('Reopen payment initiation failed:', error);
            showPopup('Payment Failed', error?.message || 'Failed to initiate payment.');
        } finally {
            setActionJobId(null);
        }
    };

    const handleVerifyReopen = useCallback(async () => {
        if (!pendingReopen) {
            Alert.alert('No Pending Payment', 'Start reopen payment first, then verify.');
            return;
        }

        setActionJobId(pendingReopen.jobId);
        try {
            await verifyAndReopenJob(pendingReopen);
        } catch (error: any) {
            const pending = isPendingVerificationError(error);
            showPopup(
                pending ? 'Verification Pending' : 'Verification Failed',
                error?.message || (pending
                    ? 'Payment is still pending. Complete MoMo approval and try again.'
                    : 'Failed to verify payment for reopening.')
            );
        } finally {
            setActionJobId(null);
        }
    }, [pendingReopen, verifyAndReopenJob, isPendingVerificationError, showPopup]);

    const closeJob = useCallback((job: any) => {
        Alert.alert(
            'Close Job',
            `Close "${job.title}"? It will be hidden from maid screens until reopened.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close Job',
                    style: 'destructive',
                    onPress: async () => {
                        setActionJobId(job.id);
                        try {
                            await apiFetch(`/jobs/${job.id}/status`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: 'CLOSED' })
                            });
                            await fetchJobs();
                            showPopup('Job Closed', 'This job is now hidden from maid screens.');
                        } catch (error: any) {
                            showPopup('Close Failed', error?.message || 'Failed to close job.');
                        } finally {
                            setActionJobId(null);
                        }
                    }
                }
            ]
        );
    }, [fetchJobs, showPopup]);

    useEffect(() => {
        if (!pendingReopen) return;

        let stopped = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;
        const maxAttempts = 20;

        const run = async () => {
            if (stopped) return;
            if (attempts >= maxAttempts) {
                setIsAutoVerifying(false);
                showPopup(
                    'Verification Pending',
                    'Reopen payment confirmation is taking longer than expected. Tap verify after completing payment.'
                );
                return;
            }
            attempts += 1;

            try {
                setIsAutoVerifying(true);
                setActionJobId(pendingReopen.jobId);
                await verifyAndReopenJob(pendingReopen);
                stopped = true;
                setIsAutoVerifying(false);
                setActionJobId(null);
            } catch (error: any) {
                if (isPendingVerificationError(error)) {
                    timeoutId = setTimeout(run, 5000);
                    return;
                }

                stopped = true;
                setIsAutoVerifying(false);
                setActionJobId(null);
                showPopup(
                    'Verification Failed',
                    error?.message || 'Failed to verify reopen payment.'
                );
            } finally {
                if (stopped) {
                    setIsAutoVerifying(false);
                    setActionJobId(null);
                }
            }
        };

        run();

        return () => {
            stopped = true;
            if (timeoutId) clearTimeout(timeoutId);
            setIsAutoVerifying(false);
        };
    }, [pendingReopen, verifyAndReopenJob, isPendingVerificationError, showPopup]);

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

    const renderJobItem = ({ item }: { item: any }) => {
        const isLoadingAction = actionJobId === item.id;
        const isPendingForItem = pendingReopen?.jobId === item.id;
        const salaryMax = toPositiveNumber(item.salaryMax);
        const reopenFee = salaryMax ? calculateReopenFee(salaryMax) : null;

        return (
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
                                        {item.salaryMin ? `${Number(item.salaryMin).toLocaleString()}` : ''}
                                        {item.salaryMin && item.salaryMax ? ' - ' : ''}
                                        {item.salaryMax ? `${Number(item.salaryMax).toLocaleString()}` : ''} RWF
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

                    <View style={styles.actionsBlock}>
                        {item.status === 'OPEN' ? (
                            <TouchableOpacity
                                style={[styles.statusActionBtn, styles.closeBtn, { borderColor: theme.danger }]}
                                onPress={() => closeJob(item)}
                                disabled={isLoadingAction || isAutoVerifying}
                            >
                                {isLoadingAction ? (
                                    <ActivityIndicator size="small" color={theme.danger} />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle-outline" size={16} color={theme.danger} />
                                        <Text style={[styles.statusActionText, { color: theme.danger }]}>Close Job</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : item.status === 'CLOSED' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.statusActionBtn, { borderColor: theme.primary }]}
                                    onPress={() => startReopenPayment(item)}
                                    disabled={isLoadingAction || isAutoVerifying || !reopenFee}
                                >
                                    {isLoadingAction ? (
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    ) : (
                                        <>
                                            <Ionicons name="lock-open-outline" size={16} color={theme.primary} />
                                            <Text style={[styles.statusActionText, { color: theme.primary }]}>
                                                {reopenFee
                                                    ? `Reopen (Pay ${reopenFee.toLocaleString()} ${PAYMENT_CURRENCY})`
                                                    : 'Reopen unavailable'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                {isPendingForItem && (
                                    <TouchableOpacity
                                        style={[styles.statusActionBtn, styles.verifyBtn, { borderColor: theme.primary }]}
                                        onPress={handleVerifyReopen}
                                        disabled={isLoadingAction || isAutoVerifying}
                                    >
                                        <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                                        <Text style={[styles.statusActionText, { color: theme.primary }]}>
                                            {isAutoVerifying ? 'Auto-verifying...' : 'I have paid, verify reopen'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={[styles.statusActionInfo, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                                <Text style={[styles.statusActionInfoText, { color: theme.textSecondary }]}>
                                    Filled job: set status to closed first if you want to reopen later.
                                </Text>
                            </View>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.screenHeader}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>My Job Postings</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage open and closed jobs</Text>
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

            <Modal
                visible={popupVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPopupVisible(false)}
            >
                <View style={styles.popupOverlay}>
                    <View style={[styles.popupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.popupTitle, { color: theme.text }]}>{popupTitle}</Text>
                        <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>{popupMessage}</Text>
                        <Button
                            title="Close"
                            onPress={() => setPopupVisible(false)}
                            style={styles.popupButton}
                        />
                    </View>
                </View>
            </Modal>
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
    actionsBlock: {
        marginTop: Spacing.md,
        gap: 8
    },
    statusActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF'
    },
    closeBtn: {
        backgroundColor: '#FEF2F2'
    },
    verifyBtn: {
        backgroundColor: '#EFF6FF'
    },
    statusActionText: {
        fontSize: 12,
        fontWeight: '700'
    },
    statusActionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 12
    },
    statusActionInfoText: {
        flex: 1,
        fontSize: 12
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
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    popupCard: {
        width: '100%',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1
    },
    popupTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8
    },
    popupMessage: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 14
    },
    popupButton: {
        width: '100%'
    },
});
