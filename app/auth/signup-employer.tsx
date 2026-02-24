import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '@/context/ProfileContext';

import { apiFetch } from '../../utils/api';

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    confirmPassword: string;
    maidsNeeded: string;
}

export default function EmployerSignupScreen() {
    const router = useRouter();
    const { refreshProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        maidsNeeded: '1',
    });

    const update = (key: keyof FormData, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSignup = async () => {
        if (!form.fullName || !form.email || !form.password) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    role: 'EMPLOYER',
                    fullName: form.fullName,
                    phone: form.phone,
                    address: form.address,
                    description: `Needs ${form.maidsNeeded} maid(s)`
                }),
            });

            // Persist token and role
            if (data.token) {
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userRole', 'EMPLOYER');
                await refreshProfile();
            }

            Alert.alert('Success! 🎉', 'Your employer account has been created.', [
                { text: 'Go to Dashboard', onPress: () => router.replace('/employee') },
            ]);
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Title */}
                <View style={styles.header}>
                    <View style={styles.roleBadge}>
                        <Ionicons name="business-outline" size={18} color="#1565c0" />
                        <Text style={styles.roleBadgeText}>Employer Account</Text>
                    </View>
                    <Text style={styles.title}>Create Your Account</Text>
                    <Text style={styles.subtitle}>Find the perfect house help for your home</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Field
                        label="Full Name *"
                        icon="person-outline"
                        placeholder="e.g. Jean Pierre Habimana"
                        value={form.fullName}
                        onChangeText={v => update('fullName', v)}
                    />
                    <Field
                        label="Email Address *"
                        icon="mail-outline"
                        placeholder="your@email.com"
                        value={form.email}
                        onChangeText={v => update('email', v)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Field
                        label="Phone Number *"
                        icon="call-outline"
                        placeholder="+250 7XX XXX XXX"
                        value={form.phone}
                        onChangeText={v => update('phone', v)}
                        keyboardType="phone-pad"
                    />
                    <Field
                        label="Home / Office Address"
                        icon="location-outline"
                        placeholder="e.g. Kigali, Gasabo District"
                        value={form.address}
                        onChangeText={v => update('address', v)}
                    />
                    <Field
                        label="Number of Maids Needed"
                        icon="people-outline"
                        placeholder="e.g. 1"
                        value={form.maidsNeeded}
                        onChangeText={v => update('maidsNeeded', v)}
                        keyboardType="numeric"
                    />

                    {/* Password */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Password *</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.inputFlex}
                                placeholder="Create a strong password"
                                placeholderTextColor="#9CA3AF"
                                value={form.password}
                                onChangeText={v => update('password', v)}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Confirm Password *</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.inputFlex}
                                placeholder="Repeat your password"
                                placeholderTextColor="#9CA3AF"
                                value={form.confirmPassword}
                                onChangeText={v => update('confirmPassword', v)}
                                secureTextEntry={!showConfirm}
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
                                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.submitBtnText}>
                            {loading ? 'Creating Account...' : 'Create Employer Account'}
                        </Text>
                        {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/login')}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function Field({
    label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
}: {
    label: string; icon: string; placeholder: string; value: string;
    onChangeText: (v: string) => void; keyboardType?: any; autoCapitalize?: any;
}) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
                <Ionicons name={icon as any} size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                    style={styles.inputFlex}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize ?? 'words'}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    topBar: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8 },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { marginBottom: 24 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#E3F2FD', paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12,
    },
    roleBadgeText: { color: '#1565c0', fontWeight: '700', fontSize: 13 },
    title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    form: {},
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
        borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12,
    },
    inputIcon: { marginRight: 10 },
    inputFlex: { flex: 1, fontSize: 15, color: '#1F2937' },
    submitBtn: {
        backgroundColor: '#1565c0', borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 8, marginBottom: 20,
        shadowColor: '#1565c0', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#6B7280', fontSize: 14 },
    footerLink: { color: '#1565c0', fontSize: 14, fontWeight: '700' },
});
