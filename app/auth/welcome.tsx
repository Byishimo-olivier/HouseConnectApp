import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const features = [
        { icon: 'shield-checkmark-outline', text: 'Verified Professionals' },
        { icon: 'star-outline', text: 'Rated & Reviewed' },
        { icon: 'flash-outline', text: 'Quick Matching' },
    ];

    return (
        <LinearGradient
            colors={['#1a237e', '#1565c0', '#0288d1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleTopRight]} />
            <View style={[styles.circle, styles.circleBottomLeft]} />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                {/* Logo */}
                <Animated.View
                    style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.logoGradient}
                    >
                        <Ionicons name="home" size={48} color="#fff" />
                    </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Text style={styles.appName}>MaidConnect</Text>
                <Text style={styles.tagline}>
                    Connecting trusted house helps{'\n'}with families who need them
                </Text>

                {/* Feature pills */}
                <View style={styles.featuresRow}>
                    {features.map((f, i) => (
                        <View key={i} style={styles.featurePill}>
                            <Ionicons name={f.icon as any} size={14} color="#fff" />
                            <Text style={styles.featureText}>{f.text}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push('/auth/role-selection')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#1565c0" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/auth/login')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.secondaryButtonText}>I already have an account</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.termsText}>
                    By continuing, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    circleTopRight: {
        width: 280,
        height: 280,
        top: -80,
        right: -80,
    },
    circleBottomLeft: {
        width: 220,
        height: 220,
        bottom: -60,
        left: -60,
    },
    content: {
        width: '100%',
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    appName: {
        fontSize: 38,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 44,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    featureText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    buttonsContainer: {
        width: '100%',
        gap: 14,
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#1565c0',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryButton: {
        borderRadius: 14,
        paddingVertical: 15,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    termsText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
