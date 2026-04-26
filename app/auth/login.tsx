import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Keyboard } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '@/context/ProfileContext';

export default function LoginScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { refreshProfile } = useProfile();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // Save token and user info for authenticated requests
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

            // Refresh global profile state before navigating
            await refreshProfile();

            if (data.user.role === 'MAID') {
                router.replace('/maid');
            } else if (data.user.role === 'ADMIN') {
                router.replace('/admin');
            } else {
                router.replace('/employee');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Check your credentials and try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
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

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#ccc"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <Link href="/auth/forgot-password" asChild>
                            <TouchableOpacity style={styles.forgotPasswordContainer}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                        <Text style={[styles.buttonText, { color: tint }]}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/auth/role-selection" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        color: '#3b5998',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#eee',
    },
    linkText: {
        color: '#fff',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    forgotPasswordContainer: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    forgotPasswordText: {
        color: '#eee',
        fontSize: 13,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});
