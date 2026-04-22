import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { HomeAssistant } from '@/components/assistant/HomeAssistant';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AssistantRole } from '@/utils/assistant';

interface AssistantScreenProps {
  role: AssistantRole;
}

export function AssistantScreen({ role }: AssistantScreenProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ScreenWrapper scrollable style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Ask the assistant</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Ask about MaidConnect features and use the shortcuts in the replies.
      </Text>
      <HomeAssistant role={role} />
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        This assistant guides people through the app. It does not send live messages to other users.
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  note: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
});
