import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotificationCenter() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Notification Center</ThemedText>
      <ThemedText>Push notification center placeholder (use expo-notifications).</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 8 } });
