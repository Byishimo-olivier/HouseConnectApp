import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useProfile } from '@/context/ProfileContext';

const JOB_POST_PERCENTAGE = 0.1;
const PAYMENT_CURRENCY = 'RWF';
const DEFAULT_PAYMENT_PROVIDER = (
  process.env.EXPO_PUBLIC_PAYMENT_PROVIDER ||
  process.env.EXPO_PUBLIC_PAWAPAY_PROVIDER ||
  'MTN_MOMO_RWA'
).trim();

type JobDraftPayload = {
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  salaryMin: number | null;
  salaryMax: number;
};

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const toOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const calculateJobPostingFee = (salaryMax: number) => Math.ceil(salaryMax * JOB_POST_PERCENTAGE);

export default function PostJobScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { profile } = useProfile();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [pendingTransactionRef, setPendingTransactionRef] = useState<string | null>(null);
  const [pendingJobPayload, setPendingJobPayload] = useState<JobDraftPayload | null>(null);
  const [paymentPopupVisible, setPaymentPopupVisible] = useState(false);
  const [paymentPopupTitle, setPaymentPopupTitle] = useState('');
  const [paymentPopupMessage, setPaymentPopupMessage] = useState('');

  const salaryMaxValue = toPositiveNumber(salaryMax);
  const postingFee = salaryMaxValue ? calculateJobPostingFee(salaryMaxValue) : null;
  const isFormLocked = Boolean(pendingTransactionRef);

  const showPaymentPopup = useCallback((popupTitle: string, popupMessage: string) => {
    setPaymentPopupTitle(popupTitle);
    setPaymentPopupMessage(popupMessage);
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

  const buildJobDraft = useCallback((): JobDraftPayload | null => {
    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || '').trim();
    const safeLocation = String(location || '').trim();
    const parsedSalaryMax = toPositiveNumber(salaryMax);
    const parsedSalaryMin = toOptionalNumber(salaryMin);

    if (!safeTitle || !safeDescription || !safeLocation) {
      Alert.alert('Missing Information', 'Please fill title, description, and location.');
      return null;
    }
    if (!parsedSalaryMax) {
      Alert.alert('Salary Max Required', 'Enter max salary. Job posting fee is 10% of max salary.');
      return null;
    }
    if (parsedSalaryMin !== null && parsedSalaryMin < 0) {
      Alert.alert('Invalid Salary', 'Minimum salary cannot be negative.');
      return null;
    }
    if (parsedSalaryMin !== null && parsedSalaryMin > parsedSalaryMax) {
      Alert.alert('Invalid Salary Range', 'Minimum salary cannot be greater than maximum salary.');
      return null;
    }

    return {
      title: safeTitle,
      description: safeDescription,
      requirements: requirements ? String(requirements).trim() : null,
      location: safeLocation,
      salaryMin: parsedSalaryMin,
      salaryMax: parsedSalaryMax,
    };
  }, [title, description, location, salaryMin, salaryMax, requirements]);

  const verifyAndPostJob = useCallback(async (transactionId: string, payload: JobDraftPayload) => {
    await apiFetch('/payments/verify-job-posting', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        salaryMax: payload.salaryMax
      }),
    });

    await apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        paymentTransactionId: transactionId
      }),
    });

    setPendingTransactionRef(null);
    setPendingJobPayload(null);
    showPaymentPopup('Job Posted', 'Payment confirmed and your job has been posted successfully.');
  }, [showPaymentPopup]);

  const startPayment = useCallback(async () => {
    const payload = buildJobDraft();
    if (!payload) return;
    if (!postingFee) {
      Alert.alert('Fee Unavailable', 'Set a valid max salary to calculate posting fee.');
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

    setIsProcessing(true);
    try {
      const deposit = await apiFetch('/payments/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: postingFee,
          currency: PAYMENT_CURRENCY,
          email: profile.email,
          fullName: profile.fullName,
          phone: payerPhoneNumber,
          phoneNumber: payerPhoneNumber,
          provider: DEFAULT_PAYMENT_PROVIDER || undefined,
          clientReferenceId: `JOB-POST-${Date.now()}`,
          customerMessage: 'Job posting fee',
          metadata: [
            { purpose: 'JOB_POSTING' },
            { salaryMax: String(payload.salaryMax) }
          ]
        }),
      });

      const txRef = deposit?.tx_ref;
      if (!txRef) throw new Error('Payment reference not returned by server');

      setPendingTransactionRef(txRef);
      setPendingJobPayload(payload);

      const gateway = String(deposit?.gateway || '').toLowerCase();
      const sandboxMode = Boolean(deposit?.sandbox);
      const gatewayLabel = getGatewayLabel(gateway);
      const providerUsed = String(deposit?.providerUsed || DEFAULT_PAYMENT_PROVIDER || '').trim();
      const phoneUsed = String(deposit?.phoneNumberUsed || payerPhoneNumber || '').trim();

      const approvalText = sandboxMode
        ? 'Sandbox mode: real MoMo approval popup is not sent to the phone. Use Verify button to continue testing.'
        : gateway === 'intouchpay'
          ? 'Payment request sent to IntouchPay. Confirm on your mobile money account. Job will post automatically after payment success.'
          : `Payment request sent to ${gatewayLabel}. Job will post automatically after payment success.`;
      const providerLine = providerUsed ? `\nProvider: ${providerUsed}` : '';

      showPaymentPopup(
        'Payment Initiated',
        `${approvalText}\n\nNumber: ${phoneUsed}${providerLine}\nReference: ${txRef}`
      );
    } catch (error: any) {
      console.error('Job payment initiation failed:', error);
      showPaymentPopup('Payment Failed', error?.message || 'Failed to initiate job posting payment.');
    } finally {
      setIsProcessing(false);
    }
  }, [buildJobDraft, postingFee, profile, getGatewayLabel, showPaymentPopup]);

  const handleVerifyPayment = useCallback(async () => {
    if (!pendingTransactionRef || !pendingJobPayload) {
      Alert.alert('No Pending Payment', 'Start payment first, then verify.');
      return;
    }

    setIsProcessing(true);
    try {
      await verifyAndPostJob(pendingTransactionRef, pendingJobPayload);
    } catch (error: any) {
      const pending = isPendingVerificationError(error);
      showPaymentPopup(
        pending ? 'Verification Pending' : 'Verification Failed',
        error?.message || (pending
          ? 'Payment is still pending. Complete MoMo approval and try again.'
          : 'Payment verification failed. Please try again.')
      );
    } finally {
      setIsProcessing(false);
    }
  }, [pendingTransactionRef, pendingJobPayload, verifyAndPostJob, isPendingVerificationError, showPaymentPopup]);

  useEffect(() => {
    if (!pendingTransactionRef || !pendingJobPayload) return;

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
          'Payment confirmation is taking longer than expected. Complete MoMo approval, then tap verify.'
        );
        return;
      }
      attempts += 1;

      try {
        setIsAutoVerifying(true);
        await verifyAndPostJob(pendingTransactionRef, pendingJobPayload);
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
        if (stopped) setIsAutoVerifying(false);
      }
    };

    run();

    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      setIsAutoVerifying(false);
    };
  }, [pendingTransactionRef, pendingJobPayload, verifyAndPostJob, isPendingVerificationError, showPaymentPopup]);

  const closePopup = () => {
    const shouldNavigate = paymentPopupTitle === 'Job Posted';
    setPaymentPopupVisible(false);
    if (shouldNavigate) {
      router.replace('/jobs/list');
    }
  };

  const SectionHeader = ({ icon, sectionTitle }: { icon: keyof typeof Ionicons.glyphMap; sectionTitle: string }) => (
    <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{sectionTitle}</Text>
    </View>
  );

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Post a New Job</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={[styles.card, { borderColor: theme.border }]}>
          <SectionHeader icon="sparkles" sectionTitle="Job Details" />
          <Input
            label="Job Title"
            placeholder="e.g. Full-time Housekeeper"
            value={title}
            onChangeText={setTitle}
            editable={!isFormLocked}
            containerStyle={styles.inputSpacing}
          />
          <Input
            label="Job Description"
            placeholder="Describe daily tasks, expectations, and schedule."
            value={description}
            onChangeText={setDescription}
            editable={!isFormLocked}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            containerStyle={styles.inputSpacing}
          />
          <Input
            label="Requirements"
            placeholder="e.g. 2+ years experience, references"
            value={requirements}
            onChangeText={setRequirements}
            editable={!isFormLocked}
            multiline
            numberOfLines={3}
            style={styles.textAreaSmall}
          />
        </Card>

        <Card style={[styles.card, { borderColor: theme.border }]}>
          <SectionHeader icon="cash" sectionTitle="Location and Salary" />
          <Input
            label="Location (Area or District)"
            placeholder="e.g. Kiyovu, Kigali"
            value={location}
            onChangeText={setLocation}
            editable={!isFormLocked}
            containerStyle={styles.inputSpacing}
            leftIcon="location-sharp"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Salary Range</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                placeholder="Min RWF"
                value={salaryMin}
                onChangeText={setSalaryMin}
                editable={!isFormLocked}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Frw</Text>}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Input
                placeholder="Max RWF"
                value={salaryMax}
                onChangeText={setSalaryMax}
                editable={!isFormLocked}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Frw</Text>}
              />
            </View>
          </View>

          <View style={[styles.feeCard, { backgroundColor: `${theme.primary}14`, borderColor: `${theme.primary}2e` }]}>
            <View style={styles.feeHeader}>
              <Ionicons name="card" size={16} color={theme.primary} />
              <Text style={[styles.feeTitle, { color: theme.text }]}>Posting Fee</Text>
            </View>
            <Text style={[styles.feeAmount, { color: theme.primary }]}>
              {postingFee ? `${postingFee.toLocaleString()} ${PAYMENT_CURRENCY}` : 'Set max salary to calculate fee'}
            </Text>
            <Text style={[styles.feeMeta, { color: theme.textSecondary }]}>
              Fee is 10% of max salary and must be paid before publishing.
            </Text>
          </View>
        </Card>

        {pendingTransactionRef && (
          <TouchableOpacity
            style={[
              styles.verifyBanner,
              { borderColor: theme.primary, backgroundColor: theme.card },
              (isProcessing || isAutoVerifying) && styles.disabledBanner
            ]}
            onPress={handleVerifyPayment}
            disabled={isProcessing || isAutoVerifying}
          >
            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
            <Text style={[styles.verifyText, { color: theme.primary }]}>
              {isAutoVerifying ? 'Auto-verifying payment...' : 'I have paid, verify and post job'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.infoBox, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}26` }]}>
          <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Once payment succeeds, job posting is completed automatically.
          </Text>
        </View>

        <Button
          title={
            pendingTransactionRef
              ? 'Verify Payment and Post Job'
              : postingFee
                ? `Pay ${postingFee.toLocaleString()} ${PAYMENT_CURRENCY} and Post Job`
                : 'Enter Max Salary to Continue'
          }
          onPress={pendingTransactionRef ? handleVerifyPayment : startPayment}
          isLoading={isProcessing}
          disabled={!pendingTransactionRef && !postingFee}
          style={styles.submitButton}
          size="lg"
          icon={<Ionicons name={pendingTransactionRef ? 'checkmark-circle' : 'card'} size={20} color="#fff" />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={paymentPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.popupTitle, { color: theme.text }]}>{paymentPopupTitle}</Text>
            <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>{paymentPopupMessage}</Text>
            <Button
              title="Close"
              onPress={closePopup}
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
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  textAreaSmall: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeCard: {
    marginTop: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  feeMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledBanner: {
    opacity: 0.65,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
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
