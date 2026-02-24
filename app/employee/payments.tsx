import React from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function EmployeePaymentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [balance, setBalance] = React.useState(0);

  const renderItem = ({ item }: { item: any }) => (
    <Card style={[styles.transactionCard, { borderBottomColor: theme.border }]}>
      <View style={styles.transactionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: item.type === 'deposit' ? theme.success + '20' : theme.background }]}>
          <Ionicons
            name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'}
            size={20}
            color={item.type === 'deposit' ? theme.success : theme.text}
          />
        </View>
        <View>
          <Text style={[styles.recipient, { color: theme.text }]}>{item.recipient}</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.amount,
          { color: item.type === 'deposit' ? theme.success : theme.text }
        ]}>
          {item.amount}
        </Text>
        <Text style={[styles.status, { color: theme.textSecondary }]}>{item.status}</Text>
      </View>
    </Card>
  );

  return (
    <ScreenWrapper style={styles.container}>
      {/* Balance Card */}
      <Card style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{balance.toFixed(2)} RWF</Text>
        <View style={styles.balanceActions}>
          {/* Wallet actions removed */}
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  balanceCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  balanceActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  transactionRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
  status: {
    fontSize: 10,
  },
});
