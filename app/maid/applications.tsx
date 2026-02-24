import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function MaidApplicationsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const applications = [
    { id: '1', job: 'Office Cleaning', company: 'Tech Corp', date: 'Applied 2d ago', status: 'Pending' },
    { id: '2', job: 'Housekeeping', company: 'Mrs. Williams', date: 'Applied 1w ago', status: 'Rejected' },
    { id: '3', job: 'Nanny Service', company: 'The Johnsons', date: 'Applied 3d ago', status: 'Interview' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return theme.warning;
      case 'Rejected': return theme.danger;
      case 'Interview': return theme.primary;
      case 'Accepted': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: theme.text }]}>{item.job}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.company, { color: theme.textSecondary }]}>{item.company}</Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{item.date}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </View>
    </Card>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>My Applications</Text>
      <FlatList
        data={applications}
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
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  company: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  date: {
    fontSize: FontSize.xs,
  },
});
