
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Job {
  id: string;
  title: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/jobs/${job.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.location}>
                <Ionicons name="location-outline" size={14} color="#666" /> {job.location}
            </Text>
        </View>
        <View style={[styles.badge, job.status === 'OPEN' ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.badgeText, job.status === 'OPEN' ? styles.openText : styles.closedText]}>
                {job.status}
            </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.salary, { color: tint }]}>{job.salary}</Text>
        <Text style={styles.type}>{job.type}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadge: {
    backgroundColor: '#e6f4ea',
  },
  closedBadge: {
    backgroundColor: '#fce8e6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  openText: {
    color: '#137333',
  },
  closedText: {
    color: '#c5221f',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  salary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b5998',
  },
  type: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
