import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MaidProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeObj = Colors[colorScheme ?? 'light'];
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
            <View style={[styles.centered, { backgroundColor: themeObj.background }]}>
                <ActivityIndicator size="large" color={themeObj.primary} />
            </View>
        );
    }

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeObj.textSecondary }]}>{title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: themeObj.card, borderColor: themeObj.border }]}>
                {children}
            </View>
        </View>
    );

    const SettingItem = ({ icon, label, value, onPress, highlight }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: themeObj.border }]}
            onPress={onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: themeObj.background }]}>
                    <Ionicons name={icon} size={20} color={themeObj.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: themeObj.text }]}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {value && (
                    <Text style={[
                        styles.settingValue,
                        { color: highlight ? themeObj.primary : themeObj.textSecondary },
                        highlight && { fontWeight: '700' }
                    ]}>
                        {value}
                    </Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={themeObj.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    const displayName = profile?.fullName || 'User';
    const displayEmail = profile?.email || '';
    const initials = getInitials(displayName);

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                {profile?.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
                ) : (
                    <View style={[styles.avatarContainer, { borderColor: themeObj.primary, backgroundColor: themeObj.primary }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                )}
                <Text style={[styles.name, { color: themeObj.text }]}>{displayName}</Text>
                <Text style={[styles.email, { color: themeObj.textSecondary }]}>{displayEmail}</Text>
                {profile?.phone && (
                    <Text style={[styles.phone, { color: themeObj.textSecondary }]}>{profile.phone}</Text>
                )}
                <Button
                    title="Edit Profile"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push('/personal profile')}
                    style={styles.editButton}
                />
            </View>

            <Section title="Professional Profile">
                <SettingItem icon="ribbon-outline" label="Experience" value={`${profile.yearsExperience || 0} Years`} highlight />
                <SettingItem icon="calendar-outline" label="Availability" value={profile.availabilityType || 'Not Set'} onPress={() => router.push('/personal profile')} />
                <SettingItem icon="cash-outline" label="Expected Salary" value={profile.expectedSalary ? `${profile.expectedSalary.toLocaleString()} RWF` : 'Not Set'} highlight />
                <SettingItem icon="location-outline" label="Current City" value={profile.address || 'Not Set'} />
            </Section>

            <Section title="Documents & Skills">
                <SettingItem icon="shield-checkmark-outline" label="Identity Verification" value={profile.nidPhoto ? 'Verified' : 'Pending'} highlight={!!profile.nidPhoto} />
                <SettingItem icon="briefcase-outline" label="Specialties" value={Array.isArray(profile.specialSkills) ? profile.specialSkills.join(', ') : 'None'} />
                <SettingItem icon="chatbubbles-outline" label="Languages" value={profile.languages || 'Not Set'} />
            </Section>

            <Section title="Account Settings">
                <SettingItem icon="person-outline" label="Personal Details" onPress={() => router.push('/')} />
                <SettingItem icon="notifications-outline" label="Notifications" onPress={() => { }} />
            </Section>

            <Button
                title="Log Out"
                variant="danger"
                onPress={handleLogout}
                style={styles.logoutButton}
                icon={<Ionicons name="log-out-outline" size={20} color="#fff" />}
            />
            <View style={{ height: 40 }} />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.xl,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        backgroundColor: '#fff',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: Spacing.md,
    },
    name: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: FontSize.sm,
        marginBottom: 4,
    },
    phone: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.md,
    },
    editButton: {
        minWidth: 120,
        marginTop: Spacing.sm,
    },
    section: {
        marginBottom: Spacing.lg,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        textTransform: 'uppercase',
    },
    sectionContent: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: FontSize.md,
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        maxWidth: '60%',
    },
    settingValue: {
        fontSize: FontSize.sm,
        textAlign: 'right',
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: Spacing.sm,
    },
});
