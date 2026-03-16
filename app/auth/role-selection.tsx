
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const tint = useThemeColor({}, 'tint');

    const handleRoleSelect = (role: 'maid' | 'employer') => {
        router.push(`/auth/signup-${role}` as any);
    };

    return (
        <LinearGradient colors={[tint, tint]} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Choose Account Type</Text>
                <Text style={styles.subtitle}>Select how you want to use MaidConnect</Text>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('employer')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="home" size={32} color={tint} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.roleTitle}>I'm an Employer</Text>
                        <Text style={styles.roleDescription}>Find reliable house helps for your home needs</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={tint} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('maid')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="briefcase" size={32} color={tint} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.roleTitle}>I'm a House Maid</Text>
                        <Text style={styles.roleDescription}>Find jobs and connect with employers</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={tint} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#eee',
        textAlign: 'center',
        marginBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
            },
        }),
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e8f0fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    roleDescription: {
        fontSize: 14,
        color: '#666',
    },
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
