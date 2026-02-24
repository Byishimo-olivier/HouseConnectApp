import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function ApplicationDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [status, setStatus] = useState('Applied');

    // Mock applicant data
    const applicant = {
        id: id,
        name: 'Sarah Jones',
        rating: 4.8,
        reviews: 24,
        experience: '3 years',
        bio: 'Professional cleaner with experience in deep cleaning and organizing. I am reliable, punctual, and use eco-friendly products.',
        skills: ['Deep Cleaning', 'Laundry', 'Organization', 'Pet Friendly'],
        availability: 'Weekdays, 9AM - 5PM'
    };

    const handleAction = (newStatus: string) => {
        setStatus(newStatus);
        Alert.alert('Success', `Applicant marked as ${newStatus}`);
    };

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatarContainer, { borderColor: theme.primary, backgroundColor: '#ccc' }]}>
                    <Text style={styles.avatarText}>{applicant.name.charAt(0)}</Text>
                </View>
                <Text style={[styles.name, { color: theme.text }]}>{applicant.name}</Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.rating, { color: theme.textSecondary }]}>{applicant.rating} ({applicant.reviews} reviews)</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20', marginTop: Spacing.sm }]}>
                    <Text style={[styles.statusText, { color: theme.primary }]}>{status}</Text>
                </View>
            </View>

            <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                <Text style={[styles.text, { color: theme.textSecondary }]}>{applicant.bio}</Text>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.text }]}>Experience</Text>
                    <Text style={[styles.value, { color: theme.textSecondary }]}>{applicant.experience}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.text }]}>Availability</Text>
                    <Text style={[styles.value, { color: theme.textSecondary }]}>{applicant.availability}</Text>
                </View>
            </Card>

            <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
                <View style={styles.skillsContainer}>
                    {applicant.skills.map((skill, index) => (
                        <View key={index} style={[styles.skillBadge, { backgroundColor: theme.primary + '10' }]}>
                            <Text style={[styles.skillText, { color: theme.primary }]}>{skill}</Text>
                        </View>
                    ))}
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
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    actionButton: {
        flex: 1,
    },
});
