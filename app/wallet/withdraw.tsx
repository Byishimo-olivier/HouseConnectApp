import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function WithdrawScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = () => {
        if (!amount) return Alert.alert('Error', 'Please enter an amount');
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', `Withdrawal of $${amount} initiated!`);
            router.back();
        }, 1500);
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Withdraw Funds</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Transfer to your bank account</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.available, { color: theme.textSecondary }]}>Available Balance: <Text style={{ color: theme.success, fontWeight: 'bold' }}>$1,250.00</Text></Text>

                <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                <Input
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    leftIcon="cash-outline"
                />

                <Text style={[styles.label, { color: theme.text, marginTop: Spacing.md }]}>Withdraw To</Text>
                <TouchableOpacity style={[styles.paymentMethod, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <View style={styles.methodLeft}>
                        <Ionicons name="business" size={24} color={theme.text} />
                        <Text style={[styles.methodText, { color: theme.text }]}>Bank Account (**** 9876)</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <Button
                title="Confirm Withdraw"
                onPress={handleWithdraw}
                isLoading={loading}
                variant="secondary"
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
    available: {
        marginBottom: Spacing.md,
        fontSize: FontSize.md,
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
