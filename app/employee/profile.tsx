import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmployeeProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeObj = Colors[colorScheme ?? 'light'];
    const { theme, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const { profile, refreshProfile, logout } = useProfile();

    // Refresh profile data every time this screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            refreshProfile();
        }, [refreshProfile])
    );

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

    const SettingItem = ({ icon, label, value, onPress, isSwitch }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: themeObj.border }]}
            onPress={onPress}
            disabled={isSwitch}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: themeObj.background }]}>
                    <Ionicons name={icon} size={20} color={themeObj.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: themeObj.text }]}>{label}</Text>
            </View>
            {isSwitch ? (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: themeObj.border, true: themeObj.primary }}
                />
            ) : (
                <View style={styles.settingRight}>
                    {value && <Text style={[styles.settingValue, { color: themeObj.textSecondary }]}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color={themeObj.textSecondary} />
                </View>
            )}
        </TouchableOpacity>
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
                    onPress={() => router.push('/profile/personal-info')}
                    style={styles.editButton}
                />
            </View>

            <Section title="Account Settings">
                <SettingItem icon="person-outline" label="Personal Information" onPress={() => router.push('/profile/personal-info')} />
                <SettingItem icon="notifications-outline" label="Notifications" value={notificationsEnabled} onPress={() => setNotificationsEnabled(!notificationsEnabled)} isSwitch />
                <SettingItem icon="moon-outline" label="Dark Mode" value={theme === 'dark'} onPress={toggleTheme} isSwitch />
            </Section>

            <Section title="Support">
                <SettingItem icon="help-circle-outline" label="Help Center" onPress={() => router.push({ pathname: '/common/html-content', params: { title: 'Help Center', type: 'help' } })} />
                <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => router.push({ pathname: '/common/html-content', params: { title: 'Terms of Service', type: 'terms' } })} />
                <SettingItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push({ pathname: '/common/html-content', params: { title: 'Privacy Policy', type: 'privacy' } })} />
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
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
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
    },
    settingValue: {
        fontSize: FontSize.sm,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: Spacing.md,
    },
    logoutButton: {
        marginTop: Spacing.sm,
    },
});
