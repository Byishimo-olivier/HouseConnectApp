import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function MaidHomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const profileContext = useProfile();
  const profile = profileContext?.profile;
  const updateLocalProfile = profileContext?.updateLocalProfile;
  const [isOnline, setIsOnline] = React.useState(true);
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({ rating: '0.0', jobsDone: 0, earned: 0 });
  const [isLoading, setIsLoading] = React.useState(false);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [jobsData, activityResponse] = await Promise.all([
        apiFetch('/jobs'),
        apiFetch('/profile/activity')
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData.slice(0, 3) : []);
      if (activityResponse?.activities) {
        setActivities(activityResponse.activities);
      }
      if (activityResponse?.stats) {
        setStats(activityResponse.stats);
      }
      // Also refresh the global unread count
      profileContext.refreshUnreadCount();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const formatDistanceToNow = (date: any) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <ScreenWrapper scrollable style={styles.container}>
      {/* Welcome & Status */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Hello,</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{profile?.fullName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/maid/profile')}>
          {profile?.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{getInitials(profile?.fullName || 'User')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Availability Toggle Card */}
      <Card style={[styles.statusCard, { backgroundColor: theme.card }]}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: theme.text }]}>Availability Status</Text>
          <Text style={[styles.statusSubtitle, { color: isOnline ? theme.success : theme.textSecondary }]}>
            {isOnline ? 'Online - Accepting Jobs' : 'Offline - Not Accepting Jobs'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: theme.border, true: theme.success }}
        />
      </Card>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.statValue}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: theme.secondary }]}>
          <Text style={styles.statValue}>{stats.jobsDone}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: theme.accent || theme.text }]}>
          <Text style={styles.statValue}>{stats.earned} RWF</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </Card>
      </View>

      {/* Upcoming Jobs */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/maid/jobs')}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.jobsList}>
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                <View style={[styles.timeBadge, { backgroundColor: theme.background }]}>
                  <Text style={[styles.timeText, { color: theme.primary }]}>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {job.employer?.fullName || 'Employer'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>{job.location}</Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No upcoming jobs available</Text>
            <TouchableOpacity onPress={() => router.push('/maid/jobs')}>
              <Text style={{ color: theme.primary, fontWeight: 'bold', marginTop: 8 }}>Find New Jobs</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Recent Activity */}
      <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
      </View>
      <View style={styles.activityList}>
        {activities.length > 0 ? (
          activities.map((item) => (
            <Card key={item.id} style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: theme.background }]}>
                <Ionicons name={item.icon as any} size={20} color={theme.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.activityDate, { color: theme.textSecondary }]}>{formatDistanceToNow(item.date)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
                <Text style={[styles.statusText, { color: theme.primary, fontSize: 10 }]}>{item.status}</Text>
              </View>
            </Card>
          ))
        ) : (
          <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 10 }}>No recent activity</Text>
        )}
      </View>

      <View style={{ height: 80 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.md,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  statusInfo: {
    gap: 4,
  },
  statusTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  statusSubtitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  jobsList: {
    gap: Spacing.md,
  },
  jobCard: {
    padding: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  jobDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: FontSize.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600'
  }
});
