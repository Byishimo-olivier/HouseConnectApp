import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CameraScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Camera</ThemedText>
      <ThemedText>Mobile camera integration placeholder (use expo-camera).</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 8 } });
