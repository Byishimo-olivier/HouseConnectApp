import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetRequest = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();
        try {
            await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });

            router.push({
                pathname: '/auth/verify-reset-code',
                params: { email }
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to process request. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Forgot Password</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a password reset pin</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#ccc"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleResetRequest}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: tint }]}>
                                {loading ? 'Sending...' : 'Send Reset Pin'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.linkText}>Back to Login</Text>
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
