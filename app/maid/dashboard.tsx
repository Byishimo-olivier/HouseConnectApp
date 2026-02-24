import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../../components/JobCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';

// Mock Data removed for database fetch

export default function MaidDashboardDetail() {
  const router = useRouter();
  const { profile } = useProfile();
  const tint = useThemeColor({}, 'tint');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/jobs');
      setJobs(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (error) {
      console.error('Failed to fetch dashboard jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.fullName?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.subGreeting}>Find your next job</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push('/maid/profile')}
        >
          {profile?.profileImage ? (
            <Image
              source={{ uri: profile.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: tint }]}>
              <Text style={styles.avatarText}>{getInitials(profile?.fullName || 'User')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={[styles.statCard, { backgroundColor: '#e8f0fe' }]}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Active Applications</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#e6f4ea' }]}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fce8e6' }]}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>New Messages</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/maid/disputes')} style={[styles.statCard, { backgroundColor: '#fef7e0' }]}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Disputes</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Main Content Area */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Jobs</Text>
          <TouchableOpacity onPress={() => router.push('/maid/jobs')}>
            <Text style={[styles.seeAll, { color: tint }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={tint} style={{ marginTop: 20 }} />
        ) : jobs.length > 0 ? (
          jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No recommended jobs found</Text>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsScroll: {
    padding: 20,
  },
  statCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontWeight: '600',
  },
});
