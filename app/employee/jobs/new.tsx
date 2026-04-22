import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';

export default function PostJobScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic Validation
    if (!title || !description || !location) {
      Alert.alert('Error', 'Please fill in at least the Title, Description, and Location.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        requirements: requirements || null,
        location,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
      };

      await apiFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Job Posting Error:', error);
      Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const SectionHeader = ({ icon, title }: { icon: any, title: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create New Job</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Basic Info */}
        <Card style={styles.card}>
          <SectionHeader icon="information-circle" title="Basic Information" />

          <Input
            label="Job Title"
            placeholder="e.g. Full-time Housekeeper"
            value={title}
            onChangeText={setTitle}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Job Description"
            placeholder="What needs to be done?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Job Requirements"
            placeholder="e.g. 2+ years experience, speaks French"
            value={requirements}
            onChangeText={setRequirements}
            multiline
            numberOfLines={3}
            style={styles.textAreaSmall}
          />
        </Card>

        {/* Step 2: Location & Pay */}
        <Card style={styles.card}>
          <SectionHeader icon="cash" title="Location & Salary" />

          <Input
            label="Location (Area/District)"
            placeholder="e.g. Kiyovu, Kigali"
            value={location}
            onChangeText={setLocation}
            containerStyle={styles.inputSpacing}
            leftIcon="location-sharp"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Salary Range (Optional)</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                placeholder="Min RWF"
                value={salaryMin}
                onChangeText={setSalaryMin}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Frw</Text>}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Input
                placeholder="Max RWF"
                value={salaryMax}
                onChangeText={setSalaryMax}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Frw</Text>}
              />
            </View>
          </View>
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your job post will be visible to all verified maids immediately after submission.
          </Text>
        </View>

        <Button
          title="Publish Job Post"
          onPress={handleSubmit}
          isLoading={isLoading}
          style={styles.submitButton}
          size="lg"
          icon={<Ionicons name="planet" size={20} color="#fff" />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  textAreaSmall: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
});
