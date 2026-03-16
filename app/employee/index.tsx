import React from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { sanitizeProfileImage } from '@/utils/image';

export default function EmployeeDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const profileContext = useProfile();
  const profile = profileContext?.profile;
  const [activeJobsCount, setActiveJobsCount] = React.useState(0);
  const [applicantsCount, setApplicantsCount] = React.useState(0);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [activities, setActivities] = React.useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchStats = async () => {
        try {
          const [jobs, applications, activityResponse] = await Promise.all([
            apiFetch('/jobs/my-jobs'),
            apiFetch('/jobs/employer/applications'),
            apiFetch('/profile/activity')
          ]);

          if (Array.isArray(jobs)) {
            const active = jobs.filter((j: any) => j.status === 'OPEN').length;
            setActiveJobsCount(active);
          }

          if (Array.isArray(applications)) {
            setApplicantsCount(applications.length);
            const pending = applications.filter((app: any) => app.status === 'PENDING').length;
            setPendingCount(pending);
          }

          if (activityResponse?.activities) {
            setActivities(activityResponse.activities);
          }

          // Also refresh the global unread count
          profileContext.refreshUnreadCount();
        } catch (error: any) {
          if (error.message !== 'AUTHENTICATION_REQUIRED') {
            console.error('Failed to fetch dashboard data:', error);
          }
        }
      };
      fetchStats();
    }, [profileContext])
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

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <ScreenWrapper scrollable style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{profile?.fullName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/employee/profile')}>
          {sanitizeProfileImage(profile?.profileImage) ? (
            <Image source={{ uri: sanitizeProfileImage(profile?.profileImage)! }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{getInitials(profile?.fullName || 'User')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <TouchableOpacity onPress={() => router.push('/jobs/list')}>
          <Card style={[styles.statsCard, { backgroundColor: theme.primary }]}>
            <Ionicons name="briefcase" size={24} color="#fff" />
            <Text style={styles.statsValue}>{activeJobsCount}</Text>
            <Text style={styles.statsLabel}>Active Jobs</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/applications/list')}>
          <Card style={[styles.statsCard, { backgroundColor: theme.secondary }]}>
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.statsValue}>{applicantsCount}</Text>
            <Text style={styles.statsLabel}>Applicants</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/applications/list')}>
          <Card style={[styles.statsCard, { backgroundColor: theme.warning }]}>
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.statsValue}>{pendingCount}</Text>
            <Text style={styles.statsLabel}>Pending</Text>
          </Card>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/employee/find-maids')}>
          <View style={[styles.actionIcon, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="search" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Find Maids</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/employee/post-job')}>
          <View style={[styles.actionIcon, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="add" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Post Job</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/employee/payments')}>
          <View style={[styles.actionIcon, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="card" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Pay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/employee/notifications')}>
          <View style={[styles.actionIcon, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="notifications" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/employee/messages')}>
          <View style={[styles.actionIcon, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="chatbubbles" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
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
    paddingTop: Spacing.lg,
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
  statsContainer: {
    marginBottom: Spacing.xl,
    overflow: 'visible',
  },
  statsCard: {
    width: 120,
    height: 100,
    marginRight: Spacing.md,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: Spacing.xs,
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
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
