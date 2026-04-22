import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';

const STATUS_MAPPING = {
    PENDING: 'Applied',
    INTERVIEW: 'Interview',
    ACCEPTED: 'Hired',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn'
};

const REVERSE_STATUS_MAPPING = {
    Applied: 'PENDING',
    Interview: 'INTERVIEW',
    Hired: 'ACCEPTED',
    Rejected: 'REJECTED'
};

export default function ApplicationDetailScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [applicant, setApplicant] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('Applied');

    const fetchApplicationDetails = useCallback(async () => {
        try {
            const appData = await apiFetch(`/jobs/applications/${id}`);
            setStatus(STATUS_MAPPING[appData.status as keyof typeof STATUS_MAPPING] || appData.status);

            // Fetch maid profile
            const maidData = await apiFetch(`/profile/maid/${appData.maid.id}`);
            setApplicant(maidData);
        } catch (error) {
            console.error('Failed to fetch application details:', error);
            Alert.alert('Error', 'Failed to load application details');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchApplicationDetails();
    }, [fetchApplicationDetails]);

    const handleAction = async (newStatus: string) => {
        const dbStatus = REVERSE_STATUS_MAPPING[newStatus as keyof typeof REVERSE_STATUS_MAPPING];
        if (!dbStatus) return;

        try {
            await apiFetch(`/jobs/applications/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: dbStatus })
            });
            setStatus(newStatus);
            Alert.alert('Success', `Applicant marked as ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            Alert.alert('Error', 'Failed to update application status');
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper style={styles.container}>
                <ActivityIndicator size="large" color={String(theme.primary || '#2563EB')} />
            </ScreenWrapper>
        );
    }

    if (!applicant) {
        return (
            <ScreenWrapper style={styles.container}>
                <Text style={{ color: theme.textSecondary }}>Applicant not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatarContainer, { borderColor: String(theme.primary || '#2563EB'), backgroundColor: '#ccc' }]}>
                    <Text style={styles.avatarText}>{String(applicant.fullName || '?').charAt(0)}</Text>
                </View>
                <Text style={[styles.name, { color: theme.text }]}>{String(applicant.fullName || 'Unknown')}</Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.rating, { color: theme.textSecondary }]}>4.8 (24 reviews)</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: String(theme.primary || '#2563EB') + '20', marginTop: Spacing.sm }]}>
                    <Text style={[styles.statusText, { color: String(theme.primary || '#2563EB') }]}>{status}</Text>
                </View>
            </View>

            <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                <Text style={[styles.text, { color: theme.textSecondary }]}>{String(applicant.description || 'No description provided')}</Text>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.text }]}>Experience</Text>
                    <Text style={[styles.value, { color: theme.textSecondary }]}>{applicant.yearsExperience ? `${String(applicant.yearsExperience)} years` : 'Not specified'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.text }]}>Availability</Text>
                    <Text style={[styles.value, { color: theme.textSecondary }]}>{String(applicant.availabilityType || 'Not specified')}</Text>
                </View>
            </Card>

            <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Identification Documents</Text>
                <View style={styles.documentsContainer}>
                    {applicant.nidPhoto ? (
                        <View style={styles.documentItem}>
                            <Text style={[styles.documentLabel, { color: theme.text }]}>National ID</Text>
                            <Image source={{ uri: applicant.nidPhoto }} style={styles.documentImage} resizeMode="contain" />
                        </View>
                    ) : (
                        <Text style={[styles.noDocumentText, { color: theme.textSecondary }]}>No National ID uploaded</Text>
                    )}
                    {applicant.insurancePhoto ? (
                        <View style={styles.documentItem}>
                            <Text style={[styles.documentLabel, { color: theme.text }]}>Insurance Document</Text>
                            <Image source={{ uri: applicant.insurancePhoto }} style={styles.documentImage} resizeMode="contain" />
                        </View>
                    ) : (
                        <Text style={[styles.noDocumentText, { color: theme.textSecondary }]}>No Insurance document uploaded</Text>
                    )}
                </View>
            </Card>

            <View style={styles.actions}>
                <Button
                    title="Interview"
                    variant="outline"
                    onPress={() => handleAction('Interview')}
                    style={styles.actionButton}
                />
                <Button
                    title="Hire"
                    variant="primary"
                    onPress={() => handleAction('Hired')}
                    style={styles.actionButton}
                />
                <Button
                    title="Reject"
                    variant="danger"
                    onPress={() => handleAction('Rejected')}
                    style={styles.actionButton}
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
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: FontSize.sm,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontWeight: '600',
        fontSize: FontSize.sm,
    },
    section: {
        marginBottom: Spacing.md,
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
    },
    text: {
        fontSize: FontSize.md,
        lineHeight: 24,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    label: {
        fontWeight: '600',
    },
    value: {
        fontSize: FontSize.md,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    skillBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillText: {
        fontSize: FontSize.sm,
        fontWeight: '500',
    },
    documentsContainer: {
        gap: Spacing.md,
    },
    documentItem: {
        marginBottom: Spacing.md,
    },
    documentLabel: {
        fontSize: FontSize.md,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    documentImage: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
        backgroundColor: '#f5f5f5',
    },
    noDocumentText: {
        fontSize: FontSize.md,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    actionButton: {
        flex: 1,
    },
});
