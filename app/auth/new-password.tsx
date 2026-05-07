import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';

export default function NewPasswordScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');
    const { email, pin } = useLocalSearchParams<{ email: string; pin: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        // Extract and normalize params - handle array format from router
        const rawEmail = Array.isArray(email) ? email[0] : email;
        const rawPin = Array.isArray(pin) ? pin[0] : pin;
        
        const normalizedEmail = rawEmail?.toString().trim().toLowerCase();
        const normalizedPin = rawPin?.toString().replace(/\D/g, '');

        console.log('[Password Reset] Starting reset with:', {
            receivedEmail: rawEmail,
            receivedPin: rawPin,
            normalizedEmail,
            normalizedPin: normalizedPin?.substring(0, 3) + '***', // Log first 3 digits only
        });

        if (!normalizedEmail || !normalizedPin) {
            console.error('[Password Reset] Missing email or pin:', { normalizedEmail, normalizedPin });
            Alert.alert('Error', 'Reset session is missing. Please request a new PIN.');
            router.replace('/auth/forgot-password');
            return;
        }

        if (normalizedPin.length !== 6) {
            console.error('[Password Reset] PIN length invalid:', normalizedPin.length);
            Alert.alert('Error', 'Reset PIN is invalid. Please verify your PIN again.');
            router.replace({ pathname: '/auth/verify-reset-code', params: { email: normalizedEmail } });
            return;
        }

        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            console.log('[Password Reset] Sending request to backend...');
            const response = await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: normalizedEmail,
                    token: normalizedPin,
                    newPassword,
                }),
            });

            console.log('[Password Reset] Success response:', response);
            Alert.alert(
                'Success',
                'Your password has been successfully reset.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
        } catch (error: any) {
            console.error('[Password Reset] Error occurred:', {
                message: error.message,
                error: error.toString(),
            });
            Alert.alert('Reset Failed', error.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>New Password</Text>
                        <Text style={styles.subtitle}>Create a new secure password for your account</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter new password"
                                placeholderTextColor="#ccc"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm new password"
                                placeholderTextColor="#ccc"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: tint }]}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Text>
                        </TouchableOpacity>
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
        fontSize: 16,
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
});
