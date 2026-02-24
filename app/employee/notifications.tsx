import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';
import { useProfile } from '@/context/ProfileContext';
import { useFocusEffect } from 'expo-router';

export default function NotificationsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { refreshUnreadCount } = useProfile();

    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/notifications');
            setNotifications(data);

            // Mark all as read when opening the screen
            if (data.some((n: any) => !n.read)) {
                await apiFetch('/notifications/read-all', { method: 'PUT' });
                refreshUnreadCount();
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'APPLICATION': return 'person-add';
            case 'CONTRACT': return 'briefcase';
            case 'REVIEW': return 'star';
            default: return 'information-circle';
        }
    };

    const formatDistanceToNow = (date: any) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: item.read ? theme.card : theme.background }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.read ? theme.border : theme.primary + '20' }]}>
                <Ionicons name={getIcon(item.type)} size={20} color={item.read ? theme.icon : theme.primary} />
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text, fontWeight: item.read ? '500' : 'bold' }]}>{item.title}</Text>
                    <Text style={[styles.time, { color: theme.textSecondary }]}>{formatDistanceToNow(item.createdAt)}</Text>
                </View>
                <Text style={[styles.message, { color: theme.textSecondary }]}>{item.message}</Text>
            </View>
            {!item.read && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
        </Card>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onRefresh={fetchNotifications}
                refreshing={loading}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                            <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, marginTop: Spacing.md }}>No notifications yet</Text>
                        </View>
                    ) : null
                }
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
    },
    listContent: {
        paddingVertical: Spacing.md,
    },
    card: {
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    title: {
        fontSize: FontSize.md,
    },
    time: {
        fontSize: 10,
    },
    message: {
        fontSize: FontSize.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
