import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');
    const [step, setStep] = useState(1); // 1: Request, 2: Reset
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestToken = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const data = await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            Alert.alert('PIN Sent', 'If an account exists, a 6-digit PIN has been sent. Check your backend console (Mock Email).');
            setStep(2);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!token || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const data = await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email, token, newPassword }),
            });
            Alert.alert('Success', 'Your password has been reset successfully.', [
                { text: 'Login Now', onPress: () => router.replace('/auth/login') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>{step === 1 ? 'Reset Password' : 'Create New Password'}</Text>
                    <Text style={styles.subtitle}>
                        {step === 1
                            ? "Enter your email and we'll send a 6-digit PIN to your email address."
                            : "Enter the PIN sent to your email and choose a strong new password."}
                    </Text>
                </View>

                <View style={styles.form}>
                    {step === 1 ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john@example.com"
                                placeholderTextColor="#ccc"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Reset PIN (6 digits)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123456"
                                    placeholderTextColor="#ccc"
                                    value={token}
                                    onChangeText={setToken}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
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
                                    placeholder="••••••••"
                                    placeholderTextColor="#ccc"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={step === 1 ? handleRequestToken : handleResetPassword}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, { color: tint }]}>
                            {loading ? 'Processing...' : (step === 1 ? 'Send Reset PIN' : 'Reset Password')}
                        </Text>
                    </TouchableOpacity>

                    {step === 2 && (
                        <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                            <Text style={styles.resendText}>Didn't get a PIN? Request again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 60 },
    backBtn: { marginBottom: 20 },
    header: { marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#eee', opacity: 0.9, lineHeight: 22 },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20, borderRadius: 15, borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    inputContainer: { marginBottom: 20 },
    label: { color: '#fff', marginBottom: 5, fontSize: 14, fontWeight: '600' },
    input: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16 },
    button: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontSize: 16, fontWeight: 'bold' },
    resendBtn: { marginTop: 20, alignItems: 'center' },
    resendText: { color: '#fff', fontSize: 14, opacity: 0.8 },
});
