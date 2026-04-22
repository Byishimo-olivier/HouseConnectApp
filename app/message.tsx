import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { apiFetch, BACKEND_URL } from '@/utils/api';
import { useProfile } from '@/context/ProfileContext';
import { encryptForBoth, decryptMessage, getOrCreateKeyPair, initCrypto } from '@/utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeProfileImage } from '@/utils/image';

export default function ChatScreen() {
    const { id: recipientId, username } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { profile, refreshUnreadChatCount } = useProfile();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversation, setConversation] = useState<any>(null);
    const [recipient, setRecipient] = useState<any>(null);
    const [socket, setSocket] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);

    const setupChat = async () => {
        try {
            await initCrypto();
            const keys = await getOrCreateKeyPair();

            // 1. Start/Get Conversation
            const conv = await apiFetch('/chat/start', {
                method: 'POST',
                body: JSON.stringify({ recipientId })
            });
            setConversation(conv);

            const other = conv.participants.find((p: any) => p.id !== profile?.id);
            if (other) {
                other.profileImage = sanitizeProfileImage(other.profileImage);
            }
            setRecipient(other);

            // 2. Fetch & Decrypt Messages
            const history = await apiFetch(`/chat/messages/${conv.id}`);
            const decryptedHistory = await Promise.all(history.map(async (m: any) => ({
                ...m,
                content: await decryptMessage(
                    (m.senderId === profile?.id && m.senderKey) ? m.senderKey : m.content,
                    m.encryptedKey,
                    keys.privateKey
                )
            })));
            setMessages(decryptedHistory);

            // Mark as read on enter
            await apiFetch(`/chat/mark-as-read/${conv.id}`, { method: 'POST' });
            refreshUnreadChatCount();

            // 3. Setup Socket
            const s = io(BACKEND_URL);
            s.emit('join', profile?.id);

            // Notify sender that I've read them
            s.emit('read_messages', {
                conversationId: conv.id,
                senderId: other.id,
                readerId: profile?.id
            });

            s.on('new_message', async (msg) => {
                if (msg.conversationId === conv.id) {
                    const decrypted = await decryptMessage(
                        (msg.senderId === profile?.id && msg.senderKey) ? msg.senderKey : msg.content,
                        msg.encryptedKey,
                        keys.privateKey
                    );
                    setMessages(prev => [...prev, { ...msg, content: decrypted }]);

                    // Mark as read immediately
                    await apiFetch(`/chat/mark-as-read/${conv.id}`, { method: 'POST' });
                    refreshUnreadChatCount();
                    s.emit('read_messages', {
                        conversationId: conv.id,
                        senderId: msg.senderId,
                        readerId: profile?.id
                    });
                }
            });

            s.on('messages_read', (data) => {
                if (data.conversationId === conv.id) {
                    setMessages(prev => prev.map(m =>
                        m.senderId === profile?.id ? { ...m, isRead: true } : m
                    ));
                }
            });

            s.on('message_sent', async (msg) => {
                // For the sender, we already have the local version or can decrypt it
                // But typically we just update the status if we had optimistic UI
            });

            s.on('user_typing', (data) => {
                if (data.conversationId === conv.id) {
                    setIsTyping(data.isTyping);
                }
            });

            setSocket(s);
        } catch (error) {
            console.error('Chat Setup Error:', error);
            Alert.alert('Error', 'Failed to connect to chat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setupChat();
        return () => {
            if (socket) socket.disconnect();
        };
    }, [recipientId]);

    const sendMessage = async () => {
        if (!inputText.trim() || !socket || !profile || !recipient) return;

        const originalText = inputText;
        setInputText('');

        try {
            // Optimize UI update
            const tempId = Date.now().toString();

            // Encrypt for both parties
            console.log(`[E2EE send] Encrypting with keys - Me (Sender): ${profile?.publicKey?.substring(0, 10)}... Recipient: ${recipient?.publicKey?.substring(0, 10)}...`);
            const encryptedData = await encryptForBoth(originalText, recipient.publicKey, profile.publicKey);

            socket.emit('send_message', {
                conversationId: conversation.id,
                senderId: profile?.id,
                recipientId: recipient.id,
                content: encryptedData.content,
                encryptedKey: encryptedData.ephemeralPublicKey,
                senderKey: encryptedData.contentForSender
            });

            setMessages(prev => [...prev, {
                id: Date.now(),
                senderId: profile?.id,
                content: originalText,
                createdAt: new Date(),
                isRead: false
            }]);
        } catch (error) {
            console.error('Send Error:', error);
            Alert.alert('Error', 'Failed to send message.');
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMine = item.senderId === profile?.id;
        return (
            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage, { backgroundColor: isMine ? theme.primary : '#E2E8F0' }]}>
                <Text style={[styles.messageText, { color: isMine ? '#fff' : '#1E293B' }]}>{item.content}</Text>
                <View style={styles.messageFooter}>
                    <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.7)' : '#64748B' }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMine && (
                        <Ionicons
                            name={item.isRead ? "checkmark-done" : "checkmark"}
                            size={16}
                            color={item.isRead ? "#fff" : "rgba(255,255,255,0.5)"}
                            style={styles.statusTick}
                        />
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.centered}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerAvatarContainer}>
                    {recipient?.profileImage ? (
                        <Image source={{ uri: recipient.profileImage }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="person" size={20} color={theme.primary} />
                        </View>
                    )}
                </View>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerName, { color: theme.text }]}>{username || recipient?.fullName}</Text>
                    <Text style={styles.headerStatus}>{isTyping ? 'typing...' : 'End-to-End Encrypted'}</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9', color: theme.text }]}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={(text) => {
                            setInputText(text);
                            socket?.emit('typing', { recipientId: recipient.id, conversationId: conversation.id, isTyping: text.length > 0 });
                        }}
                        multiline
                    />
                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={sendMessage}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 5, marginRight: 10 },
    headerAvatarContainer: { marginRight: 12 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20 },
    headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700' },
    headerStatus: { fontSize: 11, color: '#059669' },
    messageList: { padding: 15, gap: 10 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, elevation: 1 },
    myMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
    messageText: { fontSize: 15, lineHeight: 20 },
    messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
    messageTime: { fontSize: 10 },
    statusTick: { marginLeft: 2 },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
    input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});
