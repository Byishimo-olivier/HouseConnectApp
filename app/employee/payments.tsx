import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '@/utils/api';
import { useProfile } from '@/context/ProfileContext';

type WalletSummary = {
  availableBalance: number;
  pendingIn: number;
  pendingOut: number;
  currency: string;
};

type WalletTransaction = {
  id: number;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  direction: 'credit' | 'debit' | 'neutral';
  title: string;
  createdAt: string;
  maidId?: number | null;
};

type WalletResponse = {
  summary: WalletSummary;
  transactions: WalletTransaction[];
};

export default function EmployeePaymentsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { profile } = useProfile();

  const [summary, setSummary] = useState<WalletSummary>({
    availableBalance: 0,
    pendingIn: 0,
    pendingOut: 0,
    currency: 'RWF'
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizePhone = useCallback((raw: string) => {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length >= 10) digits = `250${digits.slice(1)}`;
    return digits;
  }, []);

  const formatMoney = useCallback((value: number, currency = summary.currency || 'RWF') => {
    return `${Number(value || 0).toLocaleString()} ${currency}`;
  }, [summary.currency]);

  const loadWallet = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await apiFetch('/payments/wallet?limit=50') as WalletResponse;
      setSummary(data?.summary || { availableBalance: 0, pendingIn: 0, pendingOut: 0, currency: 'RWF' });
      setTransactions(data?.transactions || []);
    } catch (error: any) {
      Alert.alert('Wallet Error', error?.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setPhoneNumber((prev) => prev || String(profile?.phone || ''));
      loadWallet();
    }, [loadWallet, profile?.phone])
  );

  const refreshSingleStatus = useCallback(async (item: WalletTransaction) => {
    if (!item?.transactionId) return;
    const type = String(item.type || '').toUpperCase();

    try {
      let response: any = null;
      if (type === 'DEPOSIT') {
        response = await apiFetch(`/payments/deposit/${item.transactionId}`);
      } else if (type === 'PAYOUT') {
        response = await apiFetch(`/payments/payout/${item.transactionId}`);
      } else if (type === 'REFUND') {
        response = await apiFetch(`/payments/refund/${item.transactionId}`);
      } else {
        return;
      }

      // Check if status was updated
      if (response?.updated) {
        Alert.alert(
          'Status Updated! ✅',
          `Your ${type.toLowerCase()} is now ${response?.providerStatus || 'completed'}. Your wallet will be updated now.`
        );
      } else if (response?.providerStatus === 'SUCCESSFUL') {
        Alert.alert('✅ Payment Confirmed', 'Your payment has been successfully verified!');
      } else {
        Alert.alert(
          'Status: ' + (response?.providerStatus || 'Unknown'),
          `Current status: ${response?.providerStatus || 'Checking...'}\nPlease wait for mobile money confirmation.`
        );
      }

      await loadWallet(true);
    } catch (error: any) {
      Alert.alert('Status Refresh Failed', error?.message || 'Failed to refresh transaction status.');
    }
  }, [loadWallet]);

  const submitAction = useCallback(async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }

    const normalizedPhone = normalizePhone(phoneNumber || String(profile?.phone || ''));
    if (!normalizedPhone) {
      Alert.alert('Validation', 'Enter a valid mobile money phone number.');
      return;
    }

    if (!profile?.email || !profile?.fullName) {
      Alert.alert('Missing Profile Info', 'Please update your profile email and full name first.');
      return;
    }

    if (mode === 'withdraw' && parsedAmount > Number(summary.availableBalance || 0)) {
      Alert.alert('Insufficient Balance', `You can withdraw up to ${formatMoney(summary.availableBalance)}.`);
      return;
    }

    const safeProvider = provider.trim();
    setSubmitting(true);

    try {
      if (mode === 'deposit') {
        const response = await apiFetch('/payments/deposit', {
          method: 'POST',
          body: JSON.stringify({
            amount: parsedAmount,
            currency: 'RWF',
            email: profile.email,
            fullName: profile.fullName,
            phoneNumber: normalizedPhone,
            provider: safeProvider || undefined,
            customerMessage: 'Wallet deposit',
            metadata: [{ purpose: 'WALLET_TOPUP' }]
          })
        });

        const txRef = String(response?.tx_ref || response?.depositId || '').trim();
        // Auto-refresh wallet balance after deposit initiated
        setTimeout(() => loadWallet(true), 500);
        Alert.alert(
          'Deposit Initiated',
          txRef
            ? `Transaction reference: ${txRef}\nComplete mobile money approval, then refresh status.`
            : 'Deposit request sent. Complete mobile money approval, then refresh status.'
        );
      } else {
        const response = await apiFetch('/payments/payout', {
          method: 'POST',
          body: JSON.stringify({
            amount: parsedAmount,
            currency: 'RWF',
            phoneNumber: normalizedPhone,
            provider: safeProvider || undefined,
            customerMessage: 'Wallet withdrawal',
            metadata: [{ purpose: 'WALLET_WITHDRAW' }]
          })
        });

        const txRef = String(response?.tx_ref || response?.payoutId || '').trim();
        Alert.alert(
          'Withdrawal Initiated',
          txRef
            ? `Transaction reference: ${txRef}\nWe will update status after provider confirmation.`
            : 'Withdrawal request sent. We will update status after provider confirmation.'
        );
      }

      setAmount('');
      await loadWallet(true);
    } catch (error: any) {
      Alert.alert('Payment Action Failed', error?.message || 'Failed to submit wallet action.');
    } finally {
      setSubmitting(false);
    }
  }, [amount, formatMoney, loadWallet, mode, normalizePhone, phoneNumber, profile?.email, profile?.fullName, provider, summary.availableBalance]);

  const canRefreshStatusType = useMemo(() => new Set(['DEPOSIT', 'PAYOUT', 'REFUND']), []);

  const renderItem = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.direction === 'credit';
    const isPending = item.status === 'PENDING';
    const amountText = `${isCredit ? '+' : item.direction === 'debit' ? '-' : ''}${formatMoney(item.amount, item.currency)}`;
    const statusColor =
      item.status === 'SUCCESSFUL'
        ? theme.success
        : item.status === 'FAILED' || item.status === 'CANCELLED'
          ? theme.danger
          : theme.warning;

    return (
      <Card style={[styles.transactionCard, { borderColor: theme.border }]}>
        <View style={styles.transactionTop}>
          <View style={styles.transactionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: isCredit ? `${theme.success}20` : `${theme.warning}20` }]}>
              <Ionicons
                name={isCredit ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={isCredit ? theme.success : theme.warning}
              />
            </View>
            <View style={styles.transactionMeta}>
              <Text style={[styles.recipient, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.date, { color: theme.textSecondary }]} numberOfLines={1}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.txRef, { color: theme.textSecondary }]} numberOfLines={1}>
                Ref: {item.transactionId}
              </Text>
            </View>
          </View>

          <View style={styles.transactionRight}>
            <Text style={[styles.amount, { color: isCredit ? theme.success : theme.text }]}>{amountText}</Text>
            <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {isPending && canRefreshStatusType.has(item.type) && (
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
            onPress={() => refreshSingleStatus(item)}
          >
            <Ionicons name="refresh-outline" size={14} color={theme.primary} />
            <Text style={[styles.refreshText, { color: theme.primary }]}>Refresh Status</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ScreenWrapper>
    );
  }

  const listHeader = (
    <>
      <Card style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>{formatMoney(Math.max(0, summary.availableBalance))}</Text>
        <View style={styles.balanceMeta}>
          <Text style={styles.balanceMetaText}>Pending In: {formatMoney(summary.pendingIn)}</Text>
          <Text style={styles.balanceMetaText}>Pending Out: {formatMoney(summary.pendingOut)}</Text>
        </View>
      </Card>

      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'deposit' && { backgroundColor: theme.primary }]}
          onPress={() => setMode('deposit')}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'deposit' ? '#FFFFFF' : theme.text }]}>
            Deposit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'withdraw' && { backgroundColor: theme.primary }]}
          onPress={() => setMode('withdraw')}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'withdraw' ? '#FFFFFF' : theme.text }]}>
            Withdraw
          </Text>
        </TouchableOpacity>
      </View>

      <Card style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>
          {mode === 'deposit' ? 'Add Money to Wallet' : 'Withdraw from Wallet'}
        </Text>

        <Input
          label="Amount (RWF)"
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Input
          label="Mobile Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="07xxxxxxxx"
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />

        <Input
          label="Provider (optional)"
          value={provider}
          onChangeText={setProvider}
          placeholder="MTN or AIRTEL"
          leftIcon="phone-portrait-outline"
        />

        <Button
          title={mode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw'}
          onPress={submitAction}
          isLoading={submitting}
          variant={mode === 'deposit' ? 'primary' : 'secondary'}
        />
      </Card>

      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => loadWallet(true)} style={styles.refreshInline}>
          <Ionicons name="refresh-outline" size={15} color={theme.primary} />
          <Text style={[styles.refreshInlineText, { color: theme.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <FlatList
        ListHeaderComponent={listHeader}
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => loadWallet(true)}
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No wallet transactions yet.
            </Text>
          </Card>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  balanceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  balanceMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSize.xs,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  modeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  refreshInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshInlineText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  transactionCard: {
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  transactionMeta: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipient: {
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  date: {
    fontSize: FontSize.xs,
  },
  txRef: {
    marginTop: 2,
    fontSize: 10,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  refreshBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
});
