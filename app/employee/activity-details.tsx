import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityDetailsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { activity } = useLocalSearchParams();
  
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    if (activity) {
      try {
        const parsed = typeof activity === 'string' ? JSON.parse(activity) : activity;
        setActivityData(parsed);
      } catch (error) {
        console.error('Failed to parse activity data:', error);
      }
    }
  }, [activity]);

  if (!activityData) {
    return (
      <ScreenWrapper>
        <Text style={[styles.title, { color: theme.text }]}>Activity not found</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Activity Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Activity Icon and Status */}
      <Card style={styles.iconCard}>
        <View style={[styles.largeIcon, { backgroundColor: theme.primary }]}>
          <Ionicons name={activityData.icon as any} size={48} color="#fff" />
        </View>
        <Text style={[styles.activityTitle, { color: theme.text }]}>{activityData.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
          <Text style={[styles.statusText, { color: theme.primary }]}>{activityData.status}</Text>
        </View>
      </Card>

      {/* Activity Information */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Date & Time</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(activityData.date).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.infoRow}>
          <Ionicons name="list-outline" size={20} color={theme.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Type</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{activityData.type || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Description</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{activityData.description || 'No description provided'}</Text>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  iconCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  largeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  activityTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  infoCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
