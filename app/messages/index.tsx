import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../utils/api';
import { useProfile } from '@/context/ProfileContext';
import { sanitizeProfileImage } from '../../utils/image';

export default function InboxScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile, refreshUnreadChatCount } = useProfile();

    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = async () => {
        try {
            const data = await apiFetch('/chat/conversations');
            const { getOrCreateKeyPair, decryptMessage, initCrypto } = await import('../../utils/crypto');
            await initCrypto();
            const keys = await getOrCreateKeyPair();

            const decryptedConversations = await Promise.all(data.map(async (conv: any) => {
                // Sanitize participant images
                if (conv.participants) {
                    conv.participants.forEach((p: any) => {
                        p.profileImage = sanitizeProfileImage(p.profileImage);
                    });
                }

                if (conv.messages && conv.messages[0]) {
                    const msg = conv.messages[0];
                    const decrypted = await decryptMessage(
                        (msg.senderId === profile?.id && msg.senderKey) ? msg.senderKey : msg.content,
                        msg.encryptedKey,
                        keys.privateKey
                    );
                    conv.lastMessageDecrypted = decrypted;
                }
                return conv;
            }));

            setConversations(decryptedConversations);
            // Sync global unread badge
            refreshUnreadChatCount();
        } catch (error) {
            console.error('Fetch Conversations Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const renderItem = ({ item }: { item: any }) => {
        const otherParticipant = item.participants.find((p: any) => p.id !== profile?.id);
        const lastMessage = item.messages[0];
        const isMyLastMessage = lastMessage?.senderId === profile?.id;

        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/messages/[id]' as any,
                    params: { id: otherParticipant.id.toString() }
                })}
                activeOpacity={0.7}
            >
                <Card style={styles.chatCard}>
                    <View style={styles.chatRow}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                            {otherParticipant?.profileImage ? (
                                <Image source={{ uri: otherParticipant.profileImage }} style={styles.avatar} />
                            ) : (
                                <Ionicons name="person" size={24} color={theme.primary} />
                            )}
                        </View>
                        <View style={styles.chatInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.name, { color: theme.text }]}>{otherParticipant?.fullName}</Text>
                                <Text style={styles.time}>
                                    {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Text>
                            </View>
                            <View style={styles.messageRow}>
                                <View style={styles.lastMessageContainer}>
                                    {isMyLastMessage && (
                                        <Ionicons
                                            name={lastMessage?.isRead ? "checkmark-done" : "checkmark"}
                                            size={16}
                                            color={lastMessage?.isRead ? theme.primary : theme.textSecondary}
                                            style={styles.statusTick}
                                        />
                                    )}
                                    <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                                        {item.lastMessageDecrypted || (lastMessage ? '[Encrypted Message]' : 'Start a conversation')}
                                    </Text>
                                </View>
                                {item.unreadCount > 0 && (
                                    <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <ScreenWrapper style={styles.centered}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
                <View style={styles.securityBadge}>
                    <Ionicons name="lock-closed" size={12} color="#059669" />
                    <Text style={styles.securityText}>End-to-End Encrypted</Text>
                </View>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color={theme.textSecondary + '50'} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No messages yet</Text>
                        <Text style={styles.emptySubText}>Unlock a maid's profile to start chatting!</Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: '800' },
    securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    securityText: { fontSize: 11, color: '#059669', fontWeight: '600' },
    listContent: { padding: 15, gap: 10 },
    chatCard: { padding: 12 },
    chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    chatInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '700' },
    time: { fontSize: 12, color: '#94A3B8' },
    messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessageContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusTick: { marginRight: 2 },
    lastMessage: { fontSize: 14, flex: 1 },
    unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    chevron: { opacity: 0.3 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: '700', marginTop: 15 },
    emptySubText: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});
