import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/utils/api';

const WORK_TYPES = ['Cleaning', 'Cooking', 'Babysitting', 'Elderly Care', 'Gardening'];

export default function FindMaidsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [maids, setMaids] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMaids = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('location', search);
            if (selectedType) queryParams.append('workType', selectedType);

            const data = await apiFetch(`/profile/maids?${queryParams.toString()}`);
            setMaids(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaids();
    }, [search, selectedType]);

    const renderMaid = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => router.push(`/employee/maids/${item.id}`)}>
            <Card style={styles.maidCard}>
                <View style={styles.maidInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                        {item.profileImage ? (
                            <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={30} color={theme.primary} />
                        )}
                    </View>
                    <View style={styles.details}>
                        <Text style={[styles.name, { color: theme.text }]}>{item.fullName}</Text>
                        <Text style={[styles.location, { color: theme.textSecondary }]}>
                            <Ionicons name="location-outline" size={12} /> {item.address}
                        </Text>
                        <View style={styles.tags}>
                            {item.workTypes.slice(0, 2).map((t: string) => (
                                <View key={t} style={[styles.tag, { backgroundColor: theme.primary + '10' }]}>
                                    <Text style={[styles.tagText, { color: theme.primary }]}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.salaryInfo}>
                        <Text style={[styles.salary, { color: theme.primary }]}>{item.expectedSalary} RWF</Text>
                        <Text style={[styles.experience, { color: theme.textSecondary }]}>{item.yearsExperience} yrs exp</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Find a Maid</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search by location..."
                    placeholderTextColor={theme.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedType && { backgroundColor: theme.primary }]}
                        onPress={() => setSelectedType(null)}
                    >
                        <Text style={[styles.filterText, !selectedType && { color: '#fff' }]}>All</Text>
                    </TouchableOpacity>
                    {WORK_TYPES.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.filterChip, selectedType === type && { backgroundColor: theme.primary }]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.filterText, selectedType === type && { color: '#fff' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={maids}
                    renderItem={renderMaid}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={60} color={theme.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No maids found matching your criteria.</Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
    title: { fontSize: FontSize.lg, fontWeight: 'bold' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', margin: Spacing.md,
        paddingHorizontal: Spacing.md, height: 50, borderRadius: BorderRadius.md, borderWidth: 1
    },
    searchIcon: { marginRight: Spacing.sm },
    searchInput: { flex: 1, fontSize: FontSize.md },
    filterSection: { marginBottom: Spacing.md },
    filterList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    filterChip: {
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0'
    },
    filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    list: { padding: Spacing.md, paddingBottom: 100 },
    loader: { marginTop: 100 },
    maidCard: { marginBottom: Spacing.md, padding: Spacing.md },
    maidInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    details: { flex: 1 },
    name: { fontSize: FontSize.md, fontWeight: 'bold', marginBottom: 2 },
    location: { fontSize: 12, marginBottom: 6 },
    tags: { flexDirection: 'row', gap: 4 },
    tag: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: '600' },
    salaryInfo: { alignItems: 'flex-end', justifyContent: 'center' },
    salary: { fontSize: 14, fontWeight: 'bold' },
    experience: { fontSize: 10, marginTop: 4 },
    empty: { alignItems: 'center', marginTop: 100, gap: Spacing.md },
    emptyText: { fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: 40 }
});
