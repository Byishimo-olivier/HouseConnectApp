import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [cards, setCards] = useState([
        { id: '1', type: 'Visa', last4: '4242', expiry: '12/24', isDefault: true },
        { id: '2', type: 'Mastercard', last4: '8888', expiry: '09/25', isDefault: false },
    ]);

    const handleAddCard = () => {
        Alert.alert('Info', 'Add Card feature coming soon');
    };

    const renderCard = ({ item }: { item: any }) => (
        <Card style={[styles.cardItem, { borderColor: item.isDefault ? theme.primary : 'transparent', borderWidth: item.isDefault ? 1.5 : 0 }]}>
            <View style={styles.cardLeft}>
                <View style={[styles.cardIcon, { backgroundColor: theme.background }]}>
                    <Ionicons name="card" size={24} color={theme.text} />
                </View>
                <View>
                    <Text style={[styles.cardType, { color: theme.text }]}>{item.type} ending in {item.last4}</Text>
                    <Text style={[styles.cardExpiry, { color: theme.textSecondary }]}>Expires {item.expiry}</Text>
                </View>
            </View>
            {item.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.defaultText, { color: theme.primary }]}>Default</Text>
                </View>
            )}
        </Card>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Payment Methods</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your saved cards</Text>
            </View>

            <FlatList
                data={cards}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />

            <Button
                title="Add New Card"
                onPress={handleAddCard}
                icon={<Ionicons name="add" size={20} color="#fff" />}
                style={styles.addButton}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSize.sm,
    },
    list: {
        gap: Spacing.md,
    },
    cardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    cardIcon: {
        width: 48,
        height: 32,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardType: {
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    cardExpiry: {
        fontSize: FontSize.sm,
    },
    defaultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    addButton: {
        marginTop: Spacing.xl,
    },
});
