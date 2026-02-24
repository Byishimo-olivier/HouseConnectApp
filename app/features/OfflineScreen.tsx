import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OfflineScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Offline</ThemedText>
      <ThemedText>Offline capability placeholder (cache important data).</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 8 } });
