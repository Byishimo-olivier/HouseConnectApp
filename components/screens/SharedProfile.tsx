import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SharedProfile() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText>View and edit your profile details.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 8 } });
