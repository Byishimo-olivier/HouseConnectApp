import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function MaidProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile, refreshProfile, logout } = useProfile();

    // Refresh profile data every time this screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            refreshProfile();
        }, [refreshProfile])
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };

    if (!profile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const workTypes: string[] = profile?.workTypes || [];
    if (!Array.isArray(workTypes)) {
        // Fallback if legacy or malformed
    }
    // Normalize languages: Backend now sends string, but might be array if legacy
    const rawLanguages = profile?.languages;
    const languagesStr = Array.isArray(rawLanguages) ? rawLanguages.join(', ') : (rawLanguages || '');
    const specialSkills: string[] = profile?.specialSkills || [];
    const hasNid = !!profile?.nidPhoto;
    const hasInsurance = !!profile?.insurancePhoto;

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header / Profile Hero */}
            <View style={styles.heroSection}>
                {profile?.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={[styles.profileImage, styles.avatarFallback, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>{getInitials(profile?.fullName || '')}</Text>
                    </View>
                )}

                <Text style={[styles.name, { color: theme.text }]}>{profile?.fullName || 'Maid'}</Text>
                <Text style={[styles.emailText, { color: theme.textSecondary }]}>{profile?.email || ''}</Text>

                <View style={styles.badgeRow}>
                    {profile?.availabilityType && (
                        <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.roleBadgeText, { color: theme.primary }]}>{profile.availabilityType}</Text>
                        </View>
                    )}
                    {profile?.yearsExperience != null && (
                        <View style={[styles.expBadge, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={styles.expBadgeText}>{profile.yearsExperience} Yrs Exp</Text>
                        </View>
                    )}
                </View>

                <View style={styles.actionButtons}>
                    <Button
                        title="Edit Profile"
                        variant="primary"
                        size="md"
                        onPress={() => router.push('/profile/personal-info')}
                        style={styles.heroBtn}
                    />
                </View>
            </View>

            {/* Section: Personal Details */}
            <Section title="Personal Information" icon="person-outline">
                <InfoRow label="Full Name" value={profile?.fullName || '—'} />
                <InfoRow label="Gender" value={profile?.gender || '—'} />
                <InfoRow label="Phone" value={profile?.phone || '—'} />
                <InfoRow label="Marital Status" value={profile?.maritalStatus || '—'} />
                {profile?.childrenCount != null && (
                    <InfoRow label="Children" value={String(profile.childrenCount)} />
                )}
            </Section>

            {/* Section: Location */}
            <Section title="Location & Relocation" icon="location-outline">
                <InfoRow label="Address" value={profile?.address || '—'} />
                {profile?.provinceDistrict && (
                    <InfoRow label="Province/District" value={profile.provinceDistrict} />
                )}
                {profile?.sectorCellVillage && (
                    <InfoRow label="Sector/Cell" value={profile.sectorCellVillage} />
                )}
                <InfoRow label="Willing to Relocate" value={profile?.willingToRelocate ? 'Yes' : 'No'} highlight />
            </Section>

            {/* Section: Experience & Skills */}
            <Section title="Experience & Skills" icon="briefcase-outline">
                {profile?.highestEducation && (
                    <InfoRow label="Education" value={profile.highestEducation} />
                )}
                {profile?.yearsExperience != null && (
                    <InfoRow label="Years of Experience" value={`${profile.yearsExperience} years`} />
                )}
                {profile?.prevEmployer && (
                    <InfoRow label="Previous Employer" value={profile.prevEmployer} />
                )}
                {workTypes.length > 0 && (
                    <View style={styles.chipsContainer}>
                        <Text style={styles.subLabel}>Work Types:</Text>
                        <View style={styles.chipsRow}>
                            {workTypes.map((type: string) => (
                                <View key={type} style={styles.skillChip}>
                                    <Text style={styles.skillText}>{type}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                {languagesStr.length > 0 && (
                    <InfoRow label="Languages" value={languagesStr} />
                )}
                {specialSkills.length > 0 && (
                    <InfoRow label="Specialties" value={specialSkills.join(', ')} highlight />
                )}
            </Section>

            {/* Section: Availability & Salary */}
            <Section title="Availability & Salary" icon="calendar-outline">
                {profile?.availabilityType && (
                    <InfoRow label="Availability" value={profile.availabilityType} />
                )}
                {profile?.preferredHours && (
                    <InfoRow label="Preferred Hours" value={profile.preferredHours} />
                )}
                {profile?.expectedSalary != null && (
                    <InfoRow label="Expected Salary" value={`${profile.expectedSalary.toLocaleString()} RWF`} highlight />
                )}
                {profile?.salaryNegotiable != null && (
                    <InfoRow label="Negotiable" value={profile.salaryNegotiable ? 'Yes' : 'No'} />
                )}
            </Section>

            {/* Section: Documents */}
            {(hasNid || hasInsurance) && (
                <Section title="Verified Documents" icon="shield-checkmark-outline">
                    <View style={styles.docRow}>
                        {hasNid && (
                            <View style={styles.docItem}>
                                <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                                <Text style={styles.docName}>National ID</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                        )}
                        {hasInsurance && (
                            <View style={styles.docItem}>
                                <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                                <Text style={styles.docName}>Insurance</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                        )}
                    </View>
                </Section>
            )}

            <View style={styles.footerActions}>
                <Button
                    title="Log Out"
                    variant="danger"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    icon={<Ionicons name="log-out-outline" size={20} color="#fff" />}
                />
            </View>

            <View style={{ height: 100 }} />
        </ScreenWrapper>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon as any} size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </Card>
    );
}

function InfoRow({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[
                styles.infoValue,
                { color: highlight ? theme.primary : theme.text },
                highlight && { fontWeight: '700' }
            ]}>
                {value}
            </Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8FAFC',
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E2E8F0',
        marginBottom: 10,
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 10,
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    roleBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    expBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    expBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        paddingHorizontal: 25,
    },
    heroBtn: {
        flex: 1,
    },
    sectionCard: {
        marginHorizontal: 20,
        marginBottom: 15,
        padding: 18,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    sectionContent: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    subLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    chipsContainer: {
        marginVertical: 4,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    skillChip: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    docRow: {
        flexDirection: 'row',
        gap: 10,
    },
    docItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    docName: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    footerActions: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    logoutButton: {
        width: '100%',
    },
});
