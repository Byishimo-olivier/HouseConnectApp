import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TopUpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTopUp = () => {
        if (!amount) return Alert.alert('Error', 'Please enter an amount');
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', `$${amount} added to your wallet!`);
            router.back();
        }, 1500);
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Top Up Wallet</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Add funds to pay for services</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                <Input
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    leftIcon="cash-outline"
                />

                <Text style={[styles.label, { color: theme.text, marginTop: Spacing.md }]}>Payment Method</Text>
                <TouchableOpacity style={[styles.paymentMethod, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}>
                    <View style={styles.methodLeft}>
                        <Ionicons name="card" size={24} color={theme.primary} />
                        <Text style={[styles.methodText, { color: theme.text }]}>Visa ending in 4242</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <Button
                title="Confirm Top Up"
                onPress={handleTopUp}
                isLoading={loading}
                style={styles.button}
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
    },
    subtitle: {
        fontSize: FontSize.sm,
    },
    card: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    paymentMethod: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    methodText: {
        fontWeight: '500',
    },
    button: {
        marginTop: 'auto',
    },
});
