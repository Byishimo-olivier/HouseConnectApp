import React from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from 'expo-router';

export default function MaidApplicationsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/jobs/maid/applications');
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchApplications();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return theme.warning;
      case 'REJECTED': return theme.danger;
      case 'INTERVIEW': return theme.primary;
      case 'ACCEPTED': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: theme.text }]}>{item.job?.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.company, { color: theme.textSecondary }]}>{item.job?.employer?.fullName}</Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>Applied on {formatDate(item.createdAt)}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </View>
    </Card>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>My Applications</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={applications}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchApplications}
          refreshing={loading}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, marginTop: Spacing.md }}>No applications yet</Text>
            </View>
          }
        />
      )}
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

