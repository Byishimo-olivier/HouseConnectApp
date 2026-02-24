import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';

export default function VerifyResetCodeScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');
    const { email } = useLocalSearchParams<{ email: string }>();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerifyPin = async () => {
        if (!pin || pin.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit PIN');
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/auth/verify-reset-pin', {
                method: 'POST',
                body: JSON.stringify({ email, pin }),
            });

            router.push({
                pathname: '/auth/new-password',
                params: { email, pin }
            });
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message || 'The PIN you entered is invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Verify PIN</Text>
                        <Text style={styles.subtitle}>Enter the 6-digit PIN sent to {email}</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>6-Digit PIN</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="123456"
                                placeholderTextColor="#ccc"
                                value={pin}
                                onChangeText={setPin}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerifyPin}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: tint }]}>
                                {loading ? 'Verifying...' : 'Verify PIN'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.linkText}>Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#eee',
        textAlign: 'center',
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#fff',
        marginBottom: 5,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 10,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    linkText: {
        color: '#fff',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
