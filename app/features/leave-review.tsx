import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function LeaveReviewScreen() {
    const { contractId, contractTitle, revieweeName } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        setLoading(true);
        // In a real app: await fetch(...)

        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                'Success',
                'Your review has been submitted. Thank you for your feedback!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }, 1200);
    };

    return (
        <ScreenWrapper scrollable style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="star" size={40} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Rate Your Experience</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    How was your experience with {revieweeName || 'this contact'} for "{contractTitle}"?
                </Text>
            </View>

            <Card style={styles.formCard}>
                <Text style={[styles.label, { color: theme.text }]}>Rating</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Ionicons
                                name={s <= rating ? "star" : "star-outline"}
                                size={44}
                                color={s <= rating ? "#FFD700" : theme.border}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label="Comment (Optional)"
                    placeholder="Share your experience..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                    containerStyle={styles.textAreaContainer}
                />

                <Button
                    title="Submit Review"
                    onPress={handleSubmit}
                    isLoading={loading}
                    style={styles.submitButton}
                />

                <Button
                    title="Not Now"
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
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.sm,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
    },
    formCard: {
        padding: Spacing.lg,
    },
    label: {
        fontSize: FontSize.md,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    textAreaContainer: {
        height: 120,
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
    },
    submitButton: {
        marginBottom: Spacing.md,
    },
});
