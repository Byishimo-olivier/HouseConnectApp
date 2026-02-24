import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function FileDisputeScreen() {
    const { contractId, contractTitle } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason || !description) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        // In a real app, we would call the API here:
        // const response = await fetch(`${API_URL}/disputes`, { ... })

        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                'Success',
                'Your dispute has been filed and will be reviewed by an administrator.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }, 1500);
    };

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="warning-outline" size={32} color={theme.warning} />
                <Text style={[styles.title, { color: theme.text }]}>File a Dispute</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Regarding: {contractTitle || `Contract #${contractId}`}
                </Text>
            </View>

            <Card style={styles.formCard}>
                <Input
                    label="Reason for Dispute"
                    placeholder="e.g. Unfinished work, Payment issue..."
                    value={reason}
                    onChangeText={setReason}
                    leftIcon="help-circle-outline"
                />

                <Input
                    label="Detalled Description"
                    placeholder="Provide as much detail as possible about the issue..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    style={styles.textArea}
                    containerStyle={styles.textAreaContainer}
                />

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Our team will review your claim and contact both parties for a resolution.
                    </Text>
                </View>

                <Button
                    title="Submit Dispute"
                    onPress={handleSubmit}
                    isLoading={loading}
                    variant="danger"
                    style={styles.submitButton}
                />

                <Button
                    title="Cancel"
                    onPress={() => router.back()}
                    variant="outline"
                    disabled={loading}
                />
            </Card>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        marginTop: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    formCard: {
        padding: Spacing.lg,
    },
    textAreaContainer: {
        height: 150,
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: Spacing.md,
        borderRadius: 8,
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    infoText: {
        fontSize: FontSize.xs,
        flex: 1,
    },
    submitButton: {
        marginBottom: Spacing.md,
    },
});
