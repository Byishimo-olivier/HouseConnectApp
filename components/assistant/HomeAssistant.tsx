import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/context/ProfileContext';
import {
  assistantStarterPrompts,
  AssistantAction,
  AssistantRole,
  getAssistantReply,
  getAssistantWelcome,
} from '@/utils/assistant';

interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  action?: AssistantAction;
}

interface HomeAssistantProps {
  role: AssistantRole;
}

function createMessage(
  sender: AssistantMessage['sender'],
  text: string,
  action?: AssistantAction,
  idPrefix?: string
): AssistantMessage {
  return {
    id: `${idPrefix ?? sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    action,
  };
}

function sanitizeMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const messages = value.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as AssistantMessage).id === 'string' &&
      ((item as AssistantMessage).sender === 'assistant' ||
        (item as AssistantMessage).sender === 'user') &&
      typeof (item as AssistantMessage).text === 'string'
  ) as AssistantMessage[];

  return messages.length > 0 ? messages : null;
}

export function HomeAssistant({ role }: HomeAssistantProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { profile } = useProfile();
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  const storageKey = `home-assistant-v1:${role}:${profile?.id ?? 'guest'}`;
  const starterPrompts = assistantStarterPrompts[role];
  const visibleMessages = messages.slice(-6);

  React.useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      const welcomeMessage = createMessage(
        'assistant',
        getAssistantWelcome(role, profile?.fullName),
        undefined,
        'welcome'
      );

      try {
        const storedValue = await AsyncStorage.getItem(storageKey);
        if (!isMounted) {
          return;
        }

        if (!storedValue) {
          setMessages([welcomeMessage]);
          setIsReady(true);
          return;
        }

        const parsedValue = JSON.parse(storedValue) as unknown;
        const storedMessages = sanitizeMessages(parsedValue);

        setMessages(storedMessages ?? [welcomeMessage]);
      } catch {
        if (isMounted) {
          setMessages([
            createMessage(
              'assistant',
              getAssistantWelcome(role, profile?.fullName),
              undefined,
              'welcome'
            ),
          ]);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    setIsReady(false);
    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [profile?.fullName, role, storageKey]);

  React.useEffect(() => {
    if (!isReady || messages.length === 0) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch(() => {
      // Ignore local persistence failures and keep the chat usable.
    });
  }, [isReady, messages, storageKey]);

  const submitQuestion = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const reply = getAssistantReply(role, trimmedQuestion);
    const userMessage = createMessage('user', trimmedQuestion);
    const assistantMessage = createMessage('assistant', reply.text, reply.action);

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
    setDraft('');
  };

  const resetConversation = () => {
    const welcomeMessage = createMessage(
      'assistant',
      getAssistantWelcome(role, profile?.fullName),
      undefined,
      'welcome'
    );

    setMessages([welcomeMessage]);
    setDraft('');
    AsyncStorage.removeItem(storageKey).catch(() => {
      // Ignore local persistence failures and keep the chat usable.
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>MaidConnect Assistant</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Ask about app features and jump to the right screen.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={resetConversation}
          style={[styles.resetButton, { borderColor: theme.border }]}
        >
          <Ionicons name="refresh" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.promptsRow}>
        {starterPrompts.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            onPress={() => submitQuestion(prompt)}
            style={[styles.promptChip, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            <Text style={[styles.promptText, { color: theme.text }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {messages.length > visibleMessages.length ? (
        <Text style={[styles.historyHint, { color: theme.textSecondary }]}>
          Showing the latest {visibleMessages.length} messages.
        </Text>
      ) : null}

      <View style={styles.messagesList}>
        {visibleMessages.map((message) => {
          const isUser = message.sender === 'user';

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                { justifyContent: isUser ? 'flex-end' : 'flex-start' },
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? { backgroundColor: theme.primary }
                    : {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text style={[styles.messageText, { color: isUser ? '#fff' : theme.text }]}>
                  {message.text}
                </Text>

                {!isUser && message.action ? (
                  <Button
                    title={message.action.label}
                    onPress={() => router.push(message.action.route as any)}
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                    textStyle={styles.actionButtonText}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask a question about the app"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={220}
          style={[styles.input, { color: theme.text }]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => submitQuestion(draft)}
          disabled={!draft.trim()}
          style={[
            styles.sendButton,
            { backgroundColor: draft.trim() ? theme.primary : theme.border },
          ]}
        >
          <Ionicons name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  resetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  promptChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  historyHint: {
    fontSize: FontSize.xs,
  },
  messagesList: {
    gap: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageBubble: {
    maxWidth: '92%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  messageText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    fontSize: FontSize.xs,
  },
  inputRow: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    maxHeight: 100,
    paddingTop: 4,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
