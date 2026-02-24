import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function MaidJobsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [search, setSearch] = React.useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const handleApply = (jobId: string | number) => {
    Alert.alert('Apply', 'Are you sure you want to apply for this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Apply',
        onPress: async () => {
          try {
            await apiFetch(`/jobs/${jobId}/apply`, {
              method: 'POST',
              body: JSON.stringify({ coverLetter: 'I am interested in this job.' })
            });
            Alert.alert('Success', 'Application submitted successfully!');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to apply.');
          }
        }
      }
    ]);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.location.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.jobTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.jobLocation, { color: theme.textSecondary }]}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} /> {item.location}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.jobPay, { color: theme.primary }]}>
            {item.salaryMax ? `Frw ${item.salaryMax}` : 'Negotiable'}
          </Text>
          {item.salaryMin && (
            <Text style={{ fontSize: 10, color: theme.textSecondary }}>Starts Frw {item.salaryMin}</Text>
          )}
        </View>
      </View>

      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: theme.background }]}>
          <Text style={[styles.tagText, { color: theme.textSecondary }]}>
            Posted {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: theme.secondary + '20' }]}>
          <Text style={[styles.tagText, { color: theme.secondary }]}>OPEN</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.applyButton, { backgroundColor: theme.primary }]}
        onPress={() => handleApply(item.id)}
      >
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find Jobs</Text>
        <Input
          placeholder="Search for jobs..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search"
          containerStyle={{ marginBottom: Spacing.sm }}
        />
      </View>

      {isLoading && !refreshing && (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      )}

      <FlatList
        data={filteredJobs}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No jobs found</Text>
          </View>
        ) : null}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  jobCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: FontSize.sm,
  },
  jobPay: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: FontSize.md,
  },
});
