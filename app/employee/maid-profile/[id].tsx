import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

import { PayWithFlutterwave } from 'flutterwave-react-native';
import { useProfile } from '@/context/ProfileContext';

import { apiFetch } from '../../../utils/api';

const { width } = Dimensions.get('window');

export default function EmployerMaidProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile } = useProfile();

    const [maid, setMaid] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const fetchMaidProfile = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/profile/maid/${id}`);
            setMaid(data);
            setIsUnlocked(data.isUnlocked || false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load maid profile.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (data: any) => {
        setLoading(true);
        try {
            // Verify payment on backend
            await apiFetch('/payments/verify-unlock', {
                method: 'POST',
                body: JSON.stringify({
                    transaction_id: data.transaction_id,
                    maidId: id
                })
            });

            Alert.alert('Success', 'Contact information unlocked!');
            fetchMaidProfile(); // Refresh to get unmasked data
        } catch (error) {
            console.error('Payment Verification Error:', error);
            Alert.alert('Verification Failed', 'Payment was successful but we couldn\'t verify it yet. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const maskInfo = (text: string | null) => {
        if (!text) return 'Not Provided';
        if (text.includes('****')) return text; // Already masked from backend
        return text; // Should be masked from backend anyway if !isUnlocked
    };

    useEffect(() => {
        fetchMaidProfile();
    }, [id]);

    if (loading && !isUnlocked) return <ScreenWrapper style={styles.centered}><ActivityIndicator size="large" color={theme.primary} /></ScreenWrapper>;
    if (!maid) return <ScreenWrapper style={styles.centered}><Text>Maid not found.</Text></ScreenWrapper>;

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerImageContainer}>
                    <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary + '30' }]}>
                        {maid.profileImage ? (
                            <Image source={{ uri: maid.profileImage }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person" size={80} color={theme.primary} />
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.introSection}>
                    <Text style={[styles.name, { color: theme.text }]}>{maid.fullName}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={[styles.badgeText, { color: '#166534' }]}>{maid.yearsExperience} Years Exp</Text>
                        </View>
                        {maid.verified && (
                            <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={[styles.badgeText, { color: theme.primary }]}>Verified</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.description, { color: theme.textSecondary }]}>{maid.description}</Text>
                </View>

                <Section title="Contact Information" icon="call-outline">
                    <InfoRow
                        label="Phone Number"
                        value={maid.phone}
                    />
                    <InfoRow
                        label="Email Address"
                        value={maid.email}
                    />
                    {!isUnlocked && (
                        <View style={styles.unlockSection}>
                            <PayWithFlutterwave
                                onRedirect={handlePaymentSuccess}
                                options={{
                                    tx_ref: `unlock_${id}_${Date.now()}`,
                                    authorization: 'FLWPUBK_TEST-412af95515660da07c0d9aecfba62a39-X',
                                    customer: {
                                        email: profile?.email || 'employer@example.com',
                                        name: profile?.fullName || 'Employer'
                                    },
                                    amount: 5000,
                                    currency: 'RWF',
                                    payment_options: 'card,mobilemoneyrwanda',
                                }}
                                customButton={(props) => (
                                    <TouchableOpacity style={styles.unlockBanner} onPress={props.onPress}>
                                        <Ionicons name="lock-closed" size={16} color={theme.primary} />
                                        <Text style={[styles.unlockText, { color: theme.primary }]}>Pay 5,000 RWF to unlock info</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}
                </Section>

                <Section title="General Information" icon="information-circle-outline">
                    <InfoRow label="Location" value={maid.provinceDistrict} />
                    <InfoRow label="Gender" value={maid.gender} />
                    <InfoRow label="Education" value={maid.highestEducation} />
                    <InfoRow label="Languages" value={maid.languages} />
                    <InfoRow label="Willing to Relocate" value={maid.willingToRelocate ? 'Yes' : 'No'} />
                </Section>

                <Section title="Expertise" icon="ribbon-outline">
                    <Text style={styles.subLabel}>Services Offered</Text>
                    <View style={styles.chipsRow}>
                        {maid.workTypes.map((t: string) => (
                            <View key={t} style={[styles.chip, { backgroundColor: theme.primary + '10' }]}>
                                <Text style={[styles.chipText, { color: theme.primary }]}>{t}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.subLabel, { marginTop: 12 }]}>Special Skills</Text>
                    <View style={styles.chipsRow}>
                        {maid.specialSkills.map((s: string) => (
                            <View key={s} style={[styles.chip, { backgroundColor: '#F3F4F6' }]}>
                                <Text style={[styles.chipText, { color: '#374151' }]}>{s}</Text>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section title="Availability & Salary" icon="cash-outline">
                    <InfoRow label="Work Type" value={maid.availabilityType} />
                    <InfoRow label="Preferred Hours" value={maid.preferredHours} />
                    <InfoRow label="Expected Salary" value={`${maid.expectedSalary} RWF / Month`} highlight />
                    <InfoRow label="Salary Negotiable" value={maid.salaryNegotiable ? 'Yes' : 'No'} />
                </Section>

                <View style={styles.footer}>
                    {!isUnlocked ? (
                        <PayWithFlutterwave
                            onRedirect={handlePaymentSuccess}
                            options={{
                                tx_ref: `unlock_${id}_${Date.now()}`,
                                authorization: 'FLWPUBK_TEST-412af95515660da07c0d9aecfba62a39-X',
                                customer: {
                                    email: profile?.email || 'employer@example.com',
                                    name: profile?.fullName || 'Employer'
                                },
                                amount: 5000,
                                currency: 'RWF',
                                payment_options: 'card,mobilemoneyrwanda',
                            }}
                            customButton={(props) => (
                                <Button
                                    title="Unlock Contact Details"
                                    variant="primary"
                                    onPress={props.onPress}
                                    style={styles.fullWidthButton}
                                />
                            )}
                        />
                    ) : (
                        <>
                            <Button
                                title="Message"
                                variant="outline"
                                onPress={() => router.push({
                                    pathname: '/messages/[id]' as any,
                                    params: { id: id as string }
                                })}
                                style={styles.footerBtn}
                            />
                            <Button
                                title="Call Now"
                                variant="outline"
                                onPress={() => Alert.alert('Action', 'Calling...')}
                                style={styles.footerBtn}
                            />
                            <Button
                                title="Email Now"
                                variant="primary"
                                onPress={() => Alert.alert('Action', 'Opening email...')}
                                style={styles.footerBtn}
                            />
                        </>
                    )}
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScreenWrapper>
    );
}

function Section({ title, icon, children }: any) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    return (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            </View>
            <View style={styles.sectionBody}>{children}</View>
        </Card>
    );
}

function InfoRow({ label, value, highlight }: any) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, { color: highlight ? theme.primary : theme.text }, highlight && { fontWeight: '700' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { height: 200, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'flex-end' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 },
    headerImageContainer: { marginBottom: -60, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    profileImagePlaceholder: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    profileImage: { width: '100%', height: '100%', borderRadius: 66 },
    content: { marginTop: 70, padding: 20 },
    introSection: { alignItems: 'center', marginBottom: 25 },
    name: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    description: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
    sectionCard: { marginBottom: 15, padding: 15 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700' },
    sectionBody: { gap: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 13, color: '#64748b' },
    infoValue: { fontSize: 13, fontWeight: '600' },
    subLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    chip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
    chipText: { fontSize: 11, fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
    footerBtn: { flex: 1 },
    fullWidthButton: { width: '100%' },
    unlockBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        marginTop: 5
    },
    unlockText: { fontSize: 13, fontWeight: '700' },
    unlockSection: { marginTop: 10 }
});
