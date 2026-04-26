import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

import { useProfile } from '@/context/ProfileContext';

import { apiFetch } from '@/utils/api';

const PROFILE_UNLOCK_PERCENTAGE = 0.1;
const PROFILE_UNLOCK_CURRENCY = 'RWF';
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

const calculateUnlockAmount = (baseSalary: number) => Math.ceil(baseSalary * PROFILE_UNLOCK_PERCENTAGE);

export default function EmployerMaidProfileScreen() {
    const { id } = useLocalSearchParams();
    const maidId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile } = useProfile();

    const [maid, setMaid] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [isAutoVerifying, setIsAutoVerifying] = useState(false);
    const [isAmountLoading, setIsAmountLoading] = useState(false);
    const [pendingTransactionRef, setPendingTransactionRef] = useState<string | null>(null);
    const [unlockAmount, setUnlockAmount] = useState<number | null>(null);
    const [unlockBasis, setUnlockBasis] = useState<'maid_expected_salary' | 'job_salary' | null>(null);
    const [paymentPopupVisible, setPaymentPopupVisible] = useState(false);
    const [paymentPopupTitle, setPaymentPopupTitle] = useState('');
    const [paymentPopupMessage, setPaymentPopupMessage] = useState('');

    const showPaymentPopup = useCallback((title: string, message: string) => {
        setPaymentPopupTitle(title);
        setPaymentPopupMessage(message);
        setPaymentPopupVisible(true);
    }, []);

    const getGatewayLabel = useCallback((gateway: string) => {
        const value = String(gateway || '').trim().toLowerCase();
        if (value === 'intouchpay') return 'IntouchPay';
        if (value === 'paypack' || value === 'pawapay') return 'payment gateway';
        return 'payment gateway';
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

    const resolveUnlockAmount = useCallback(async (maidData: any) => {
        const maidExpectedSalary = toPositiveNumber(maidData?.expectedSalary);
        if (maidExpectedSalary) {
            setUnlockAmount(calculateUnlockAmount(maidExpectedSalary));
            setUnlockBasis('maid_expected_salary');
            return;
        }

        setIsAmountLoading(true);
        try {
            const jobs = await apiFetch('/jobs/my-jobs');
            const latestPricedJob = Array.isArray(jobs)
                ? jobs.find((job: any) => toPositiveNumber(job?.salaryMax) || toPositiveNumber(job?.salaryMin))
                : null;

            const jobSalary = toPositiveNumber(latestPricedJob?.salaryMax) ?? toPositiveNumber(latestPricedJob?.salaryMin);
            if (jobSalary) {
                setUnlockAmount(calculateUnlockAmount(jobSalary));
                setUnlockBasis('job_salary');
                return;
            }

            setUnlockAmount(null);
            setUnlockBasis(null);
        } catch (error) {
            console.error('Failed to resolve unlock amount from jobs:', error);
            setUnlockAmount(null);
            setUnlockBasis(null);
        } finally {
            setIsAmountLoading(false);
        }
    }, []);

    const fetchMaidProfile = useCallback(async () => {
        if (!maidId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await apiFetch(`/profile/maid/${maidId}`);
            setMaid(data);
            setIsUnlocked(data.isUnlocked || false);
            await resolveUnlockAmount(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load maid profile.');
        } finally {
            setLoading(false);
        }
    }, [maidId, resolveUnlockAmount]);

    const verifyProfileUnlock = useCallback(async (transactionId: string) => {
        try {
            await apiFetch('/payments/verify-unlock', {
                method: 'POST',
                body: JSON.stringify({
                    transaction_id: transactionId,
                    maidId
                })
            });

            setPendingTransactionRef(null);
            showPaymentPopup('Payment Confirmed', 'Contact information and documents are now unlocked.');
            await fetchMaidProfile();
        } catch (error: any) {
            if (!isPendingVerificationError(error)) {
                console.error('Payment Verification Error:', error);
            }
            throw error;
        }
    }, [maidId, fetchMaidProfile, showPaymentPopup, isPendingVerificationError]);

    const startUnlockPayment = async () => {
        if (!maidId) {
            Alert.alert('Error', 'Invalid maid profile.');
            return;
        }

        if (!unlockAmount) {
            Alert.alert(
                'Unlock Amount Unavailable',
                'Set maid expected salary or post a job with salary so we can calculate 10% unlock fee.'
            );
            return;
        }

        if (!profile?.email || !profile?.fullName) {
            Alert.alert('Missing Profile Info', 'Please update your profile email and full name before making a payment.');
            return;
        }
        const payerPhoneNumber = String(profile?.phone || '').replace(/\s+/g, '').trim();
        if (!payerPhoneNumber) {
            Alert.alert('Missing Phone Number', 'Please add your phone number in profile before initiating payment.');
            return;
        }
        setIsPaymentLoading(true);
        try {
            const deposit = await apiFetch('/payments/deposit', {
                method: 'POST',
                body: JSON.stringify({
                    amount: unlockAmount,
                    currency: PROFILE_UNLOCK_CURRENCY,
                    email: profile.email,
                    fullName: profile.fullName,
                    phone: payerPhoneNumber,
                    phoneNumber: payerPhoneNumber,
                    provider: DEFAULT_PAYMENT_PROVIDER || undefined,
                    clientReferenceId: `UNLOCK-${maidId}-${Date.now()}`,
                    customerMessage: 'Unlock profile',
                    maidId
                })
            });

            const txRef = deposit?.tx_ref;
            const gateway = String(deposit?.gateway || '').toLowerCase();
            const gatewayLabel = getGatewayLabel(gateway);
            const providerUsed = String(deposit?.providerUsed || DEFAULT_PAYMENT_PROVIDER || '').trim();
            const phoneUsed = String(deposit?.phoneNumberUsed || payerPhoneNumber || '').trim();
            if (!txRef) {
                throw new Error('Payment reference not returned by server');
            }

            setPendingTransactionRef(txRef);
            const sandboxMode = Boolean(deposit?.sandbox);
            const approvalText = sandboxMode
                ? 'Sandbox mode: real MoMo approval popup is not sent to the phone. Use Verify Payment to continue testing.'
                : gateway === 'intouchpay'
                    ? 'Payment request sent to IntouchPay. Confirm on your mobile money account. Unlock will happen automatically after successful payment.'
                    : `Payment request sent to ${gatewayLabel}. Unlock will happen automatically after successful payment.`;
            const providerLine = providerUsed ? `\nProvider: ${providerUsed}` : '';
            showPaymentPopup(
                'Payment Initiated',
                `${approvalText}\n\nNumber: ${phoneUsed}${providerLine}\nReference: ${txRef}`
            );
        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            showPaymentPopup('Payment Failed', error?.message || 'Failed to initiate payment.');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleVerifyPayment = useCallback(async () => {
        if (!pendingTransactionRef) {
            Alert.alert('No Pending Payment', 'Start a payment first, then verify it.');
            return;
        }

        setIsPaymentLoading(true);
        try {
            await verifyProfileUnlock(pendingTransactionRef);
        } catch (error: any) {
            const pending = isPendingVerificationError(error);
            showPaymentPopup(
                pending ? 'Verification Pending' : 'Verification Failed',
                error?.message || (pending
                    ? 'We could not confirm the payment yet. Wait a moment and try again.'
                    : 'Payment verification failed. Please try again.')
            );
        } finally {
            setIsPaymentLoading(false);
        }
    }, [pendingTransactionRef, verifyProfileUnlock, showPaymentPopup, isPendingVerificationError]);

    useEffect(() => {
        fetchMaidProfile();
    }, [fetchMaidProfile]);

    useEffect(() => {
        if (!pendingTransactionRef || isUnlocked) return;

        let stopped = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;
        const maxAttempts = 20;

        const run = async () => {
            if (stopped) return;
            if (attempts >= maxAttempts) {
                setIsAutoVerifying(false);
                showPaymentPopup(
                    'Verification Pending',
                    'Payment confirmation is taking longer than expected. Complete the MoMo approval, then tap "I have paid, verify payment".'
                );
                return;
            }
            attempts += 1;

            try {
                setIsAutoVerifying(true);
                await verifyProfileUnlock(pendingTransactionRef);
                stopped = true;
                setIsAutoVerifying(false);
            } catch (error: any) {
                if (isPendingVerificationError(error)) {
                    timeoutId = setTimeout(run, 5000);
                    return;
                }
                stopped = true;
                setIsAutoVerifying(false);
                showPaymentPopup(
                    'Verification Failed',
                    error?.message || 'Payment verification failed. Please try again.'
                );
            } finally {
                if (stopped) {
                    setIsAutoVerifying(false);
                }
            }
        };

        run();

        return () => {
            stopped = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            setIsAutoVerifying(false);
        };
    }, [pendingTransactionRef, isUnlocked, verifyProfileUnlock, isPendingVerificationError, showPaymentPopup]);

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
                            <TouchableOpacity
                                style={[styles.unlockBanner, isPaymentLoading && styles.disabledUnlock]}
                                onPress={startUnlockPayment}
                                disabled={isPaymentLoading || isAmountLoading}
                            >
                                <Ionicons name="lock-closed" size={16} color={theme.primary} />
                                <Text style={[styles.unlockText, { color: theme.primary }]}>
                                    {isAmountLoading
                                        ? 'Calculating unlock amount...'
                                        : unlockAmount
                                            ? `Pay ${unlockAmount.toLocaleString()} ${PROFILE_UNLOCK_CURRENCY} (${unlockBasis === 'maid_expected_salary' ? '10% of expected salary' : '10% of your posted job salary'}) to unlock contacts and documents`
                                            : 'Unlock amount needs salary data (maid expected salary or your posted job salary)'}
                                </Text>
                            </TouchableOpacity>
                            {pendingTransactionRef && (
                                <TouchableOpacity
                                    style={[styles.verifyBanner, { borderColor: theme.primary }, isPaymentLoading && styles.disabledUnlock]}
                                    onPress={handleVerifyPayment}
                                    disabled={isPaymentLoading}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                                    <Text style={[styles.verifyText, { color: theme.primary }]}>
                                        {isAutoVerifying ? 'Auto-verifying payment...' : 'I have paid, verify payment'}
                                    </Text>
                                </TouchableOpacity>
                            )}
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

                {(maid.nidPhoto || maid.insurancePhoto) && (
                    <Section title="Identification Documents" icon="document-outline">
                        <View style={styles.documentsContainer}>
                            {maid.nidPhoto && (
                                <View style={styles.documentItem}>
                                    <Text style={[styles.documentLabel, { color: theme.text }]}>National ID</Text>
                                    <Image source={{ uri: maid.nidPhoto }} style={styles.documentImage} resizeMode="contain" />
                                </View>
                            )}
                            {maid.insurancePhoto && (
                                <View style={styles.documentItem}>
                                    <Text style={[styles.documentLabel, { color: theme.text }]}>Insurance Document</Text>
                                    <Image source={{ uri: maid.insurancePhoto }} style={styles.documentImage} resizeMode="contain" />
                                </View>
                            )}
                        </View>
                    </Section>
                )}

                {!maid.nidPhoto && !maid.insurancePhoto && !isUnlocked && (
                    <Section title="Identification Documents" icon="document-outline">
                        <View style={styles.unlockSection}>
                            <Text style={[styles.unlockNote, { color: theme.textSecondary }]}>
                                Documents are included with contact unlock
                            </Text>
                        </View>
                    </Section>
                )}

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

                <View style={[styles.footer, !isUnlocked && styles.lockedFooter]}>
                    {!isUnlocked ? (
                        <>
                            <Button
                                title={
                                    unlockAmount
                                        ? `Unlock Contact (${unlockAmount.toLocaleString()} ${PROFILE_UNLOCK_CURRENCY})`
                                        : 'Unlock Contact Details'
                                }
                                variant="primary"
                                onPress={startUnlockPayment}
                                isLoading={isPaymentLoading || isAmountLoading}
                                disabled={!unlockAmount}
                                style={styles.fullWidthButton}
                            />
                            {pendingTransactionRef && (
                                <Button
                                    title="Verify Payment"
                                    variant="outline"
                                    onPress={handleVerifyPayment}
                                    disabled={isPaymentLoading || isAutoVerifying}
                                    style={styles.fullWidthButton}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <Button
                                title="Message"
                                variant="outline"
                                onPress={() => router.push({
                                    pathname: '/messages' as any,
                                    params: { id: maidId as string }
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

            <Modal
                visible={paymentPopupVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPaymentPopupVisible(false)}
            >
                <View style={styles.popupOverlay}>
                    <View style={[styles.popupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.popupTitle, { color: theme.text }]}>{paymentPopupTitle}</Text>
                        <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>{paymentPopupMessage}</Text>
                        <Button
                            title="Close"
                            onPress={() => setPaymentPopupVisible(false)}
                            style={styles.popupButton}
                        />
                    </View>
                </View>
            </Modal>
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
    lockedFooter: { flexDirection: 'column' },
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
    verifyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1
    },
    disabledUnlock: { opacity: 0.6 },
    unlockText: { fontSize: 13, fontWeight: '700' },
    verifyText: { fontSize: 12, fontWeight: '600' },
    unlockSection: { marginTop: 10 },
    unlockNote: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
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
    documentsContainer: { gap: 15 },
    documentItem: { marginBottom: 10 },
    documentLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
    documentImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#f8fafc' }
});
