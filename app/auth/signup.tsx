import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiFetch } from '../../utils/api';

export default function SignupScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = (params.role as string)?.toUpperCase() || 'MAID';
    const tint = useThemeColor({}, 'tint');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignup = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: role,
                    fullName: formData.name,
                    phone: formData.phone
                }),
            });

            Alert.alert('Success', 'Account created successfully! Please sign in.', [
                { text: 'OK', onPress: () => router.replace('/auth/login') }
            ]);
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Sign up as {role === 'employer' ? 'an Employer' : 'a House Maid'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#ccc"
                            value={formData.name}
                            onChangeText={(val) => handleChange('name', val)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="john@example.com"
                            placeholderTextColor="#ccc"
                            value={formData.email}
                            onChangeText={(val) => handleChange('email', val)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+250 ..."
                            placeholderTextColor="#ccc"
                            value={formData.phone}
                            onChangeText={(val) => handleChange('phone', val)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            placeholderTextColor="#ccc"
                            value={formData.password}
                            onChangeText={(val) => handleChange('password', val)}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            placeholderTextColor="#ccc"
                            value={formData.confirmPassword}
                            onChangeText={(val) => handleChange('confirmPassword', val)}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                        <Text style={[styles.buttonText, { color: tint }]}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
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
        padding: 20,
        paddingTop: 60,
    },
    backBtn: {
        marginBottom: 20,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#eee',
        opacity: 0.9,
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 15,
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
});
