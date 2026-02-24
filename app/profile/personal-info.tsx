import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Switch, Image, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../utils/api';
import { useProfile } from '@/context/ProfileContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_TYPES = ['Cleaning', 'Cooking', 'Babysitting', 'Elderly Care', 'Laundry', 'Gardening'];
const SPECIAL_SKILLS = ['First Aid', 'Child Care Training', 'Cooking Specialties'];
const GENDERS = ['Female', 'Male', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced'];
const EDU_LEVELS = ['None', 'Primary', 'Secondary', 'Vocational', 'University'];
const AVAIL_TYPES = ['Full-Time', 'Part-Time', 'Live-in'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PersonalInfoScreen() {
    const router = useRouter();
    const { updateLocalProfile, profile: contextProfile } = useProfile();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState<string>('EMPLOYER');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Shared fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');

    // MAID-only fields
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('Female');
    const [nidNumber, setNidNumber] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('Single');
    const [childrenCount, setChildrenCount] = useState('0');
    const [country, setCountry] = useState('Rwanda');
    const [provinceDistrict, setProvinceDistrict] = useState('');
    const [sectorCellVillage, setSectorCellVillage] = useState('');
    const [willingToRelocate, setWillingToRelocate] = useState(false);
    const [yearsExperience, setYearsExperience] = useState('');
    const [prevEmployer, setPrevEmployer] = useState('');
    const [prevEmployerContact, setPrevEmployerContact] = useState('');
    const [workTypes, setWorkTypes] = useState<string[]>([]);
    const [reasonForLeaving, setReasonForLeaving] = useState('');
    const [highestEducation, setHighestEducation] = useState('Secondary');
    const [languages, setLanguages] = useState('');
    const [specialSkills, setSpecialSkills] = useState<string[]>([]);
    const [drivingLicense, setDrivingLicense] = useState(false);
    const [availabilityType, setAvailabilityType] = useState('Full-Time');
    const [startDate, setStartDate] = useState('');
    const [preferredHours, setPreferredHours] = useState('');
    const [expectedSalary, setExpectedSalary] = useState('');
    const [salaryNegotiable, setSalaryNegotiable] = useState(true);
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await apiFetch('/profile/me');
            setRole(data.role || 'EMPLOYER');
            setFullName(data.fullName || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setDescription(data.description || '');
            // Use the locally stored image from ProfileContext (not the DB value)
            setProfileImage(contextProfile?.profileImage || null);

            if (data.role === 'MAID') {
                setDob(data.dob ? data.dob.split('T')[0] : '');
                setGender(data.gender || 'Female');
                setNidNumber(data.nidNumber || '');
                setMaritalStatus(data.maritalStatus || 'Single');
                setChildrenCount(data.childrenCount != null ? String(data.childrenCount) : '0');
                setCountry(data.country || 'Rwanda');
                setProvinceDistrict(data.provinceDistrict || '');
                setSectorCellVillage(data.sectorCellVillage || '');
                setWillingToRelocate(data.willingToRelocate || false);
                setYearsExperience(data.yearsExperience != null ? String(data.yearsExperience) : '');
                setPrevEmployer(data.prevEmployer || '');
                setPrevEmployerContact(data.prevEmployerContact || '');
                setWorkTypes(data.workTypes || []);
                setReasonForLeaving(data.reasonForLeaving || '');
                setHighestEducation(data.highestEducation || 'Secondary');
                setLanguages(Array.isArray(data.languages) ? data.languages.join(', ') : data.languages || '');
                setSpecialSkills(data.specialSkills || []);
                setDrivingLicense(data.drivingLicense || false);
                setAvailabilityType(data.availabilityType || 'Full-Time');
                setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
                setPreferredHours(data.preferredHours || '');
                setExpectedSalary(data.expectedSalary != null ? String(data.expectedSalary) : '');
                setSalaryNegotiable(data.salaryNegotiable ?? true);
                setEmergencyName(data.emergencyName || '');
                setEmergencyRelation(data.emergencyRelation || '');
                setEmergencyPhone(data.emergencyPhone || '');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const toggleChip = (list: string[], setList: (v: string[]) => void, item: string) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Required', 'Full name is required');
            return;
        }
        setSaving(true);
        try {
            const body: any = {
                fullName, phone, address, description, profileImage,
            };

            if (role === 'MAID') {
                Object.assign(body, {
                    dob, gender, nidNumber, maritalStatus, childrenCount,
                    country, provinceDistrict, sectorCellVillage, willingToRelocate,
                    yearsExperience, prevEmployer, prevEmployerContact, workTypes,
                    reasonForLeaving, highestEducation,
                    languages: languages.split(',').map(l => l.trim()).filter(Boolean),
                    specialSkills, drivingLicense, availabilityType, startDate,
                    preferredHours, expectedSalary, salaryNegotiable,
                    emergencyName, emergencyRelation, emergencyPhone,
                });
            }

            await apiFetch('/profile/me', {
                method: 'PUT',
                body: JSON.stringify(body),
            });

            // Instantly update the tab icon and profile screen
            updateLocalProfile({
                fullName,
                phone,
                profileImage,
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                    {saving
                        ? <ActivityIndicator size="small" color="#2563eb" />
                        : <Text style={styles.saveBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Avatar */}
                <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitials}>{getInitials(fullName)}</Text>
                        </View>
                    )}
                    <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>

                {/* ── SHARED FIELDS ── */}
                <SectionHeader title="Basic Information" icon="person-outline" />
                <Field label="Full Name *" icon="person-outline" value={fullName} onChangeText={setFullName} />
                <Field label="Phone Number" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Field label="Address" icon="location-outline" value={address} onChangeText={setAddress} />
                {role === 'EMPLOYER' && (
                    <Field label="Description / Notes" icon="document-text-outline" value={description} onChangeText={setDescription} multiline />
                )}

                {/* ── MAID-ONLY FIELDS ── */}
                {role === 'MAID' && (
                    <>
                        {/* Personal */}
                        <SectionHeader title="Personal Details" icon="id-card-outline" />
                        <Field label="Date of Birth" icon="calendar-outline" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} />
                        <Selector label="Gender" options={GENDERS} selected={gender} onSelect={setGender} />
                        <Field label="National ID Number" icon="card-outline" value={nidNumber} onChangeText={setNidNumber} />
                        <Selector label="Marital Status" options={MARITAL_STATUSES} selected={maritalStatus} onSelect={setMaritalStatus} />
                        <Field label="Number of Children" icon="people-outline" value={childrenCount} onChangeText={setChildrenCount} keyboardType="numeric" />

                        {/* Location */}
                        <SectionHeader title="Location" icon="location-outline" />
                        <Field label="Country" icon="globe-outline" value={country} onChangeText={setCountry} />
                        <Field label="Province / District" icon="map-outline" value={provinceDistrict} onChangeText={setProvinceDistrict} />
                        <Field label="Sector / Cell / Village" icon="location-outline" value={sectorCellVillage} onChangeText={setSectorCellVillage} />
                        <SwitchRow label="Willing to Relocate?" value={willingToRelocate} onValueChange={setWillingToRelocate} />

                        {/* Experience */}
                        <SectionHeader title="Experience" icon="briefcase-outline" />
                        <Field label="Years of Experience" icon="ribbon-outline" value={yearsExperience} onChangeText={setYearsExperience} keyboardType="numeric" />
                        <Field label="Previous Employer" icon="business-outline" value={prevEmployer} onChangeText={setPrevEmployer} />
                        <Field label="Employer Contact" icon="call-outline" value={prevEmployerContact} onChangeText={setPrevEmployerContact} keyboardType="phone-pad" />
                        <Field label="Reason for Leaving" icon="exit-outline" value={reasonForLeaving} onChangeText={setReasonForLeaving} multiline />
                        <Text style={styles.chipLabel}>Type of Work Done</Text>
                        <ChipGroup items={WORK_TYPES} selected={workTypes} onToggle={(item) => toggleChip(workTypes, setWorkTypes, item)} />

                        {/* Skills & Education */}
                        <SectionHeader title="Skills & Education" icon="school-outline" />
                        <Selector label="Highest Education Level" options={EDU_LEVELS} selected={highestEducation} onSelect={setHighestEducation} />
                        <Field label="Languages Spoken (comma-separated)" icon="chatbubbles-outline" value={languages} onChangeText={setLanguages} />
                        <Text style={styles.chipLabel}>Special Skills</Text>
                        <ChipGroup items={SPECIAL_SKILLS} selected={specialSkills} onToggle={(item) => toggleChip(specialSkills, setSpecialSkills, item)} />
                        <SwitchRow label="Driving License?" value={drivingLicense} onValueChange={setDrivingLicense} />

                        {/* Availability */}
                        <SectionHeader title="Availability" icon="calendar-outline" />
                        <Selector label="Availability Type" options={AVAIL_TYPES} selected={availabilityType} onSelect={setAvailabilityType} />
                        <Field label="Available Start Date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
                        <Field label="Preferred Working Hours" icon="time-outline" placeholder="e.g. 7 AM - 6 PM" value={preferredHours} onChangeText={setPreferredHours} />

                        {/* Salary */}
                        <SectionHeader title="Salary Expectations" icon="cash-outline" />
                        <Field label="Expected Monthly Salary (RWF)" icon="cash-outline" value={expectedSalary} onChangeText={setExpectedSalary} keyboardType="numeric" />
                        <SwitchRow label="Salary Negotiable?" value={salaryNegotiable} onValueChange={setSalaryNegotiable} />

                        {/* Emergency Contact */}
                        <SectionHeader title="Emergency Contact" icon="alert-circle-outline" />
                        <Field label="Contact Name" icon="person-outline" value={emergencyName} onChangeText={setEmergencyName} />
                        <Field label="Relationship" icon="heart-outline" value={emergencyRelation} onChangeText={setEmergencyRelation} />
                        <Field label="Phone Number" icon="call-outline" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
                    </>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveButtonText}>Save Changes</Text>
                    }
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon as any} size={18} color="#2563eb" />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function Field({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, editable }: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputRow, multiline && { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
                {typeof icon === 'string' ? (
                    <Ionicons name={icon as any} size={18} color="#94a3b8" style={styles.inputIcon} />
                ) : (
                    <View style={styles.inputIcon}>{icon}</View>
                )}
                <TextInput
                    style={[styles.inputText, multiline && { height: '100%', textAlignVertical: 'top' }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    multiline={multiline}
                    editable={editable}
                />
            </View>
        </View>
    );
}

function Selector({ label, options, selected, onSelect }: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.optionsRow}>
                {options.map((opt: string) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.option, selected === opt && styles.optionActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function ChipGroup({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) {
    return (
        <View style={styles.chipsRow}>
            {items.map(item => (
                <TouchableOpacity
                    key={item}
                    style={[styles.chip, selected.includes(item) && styles.chipActive]}
                    onPress={() => onToggle(item)}
                >
                    <Text style={[styles.chipText, selected.includes(item) && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
    return (
        <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#e2e8f0', true: '#2563eb' }} thumbColor="#fff" />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#eff6ff', borderRadius: 10 },
    saveBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
    scroll: { padding: 20, paddingBottom: 40 },

    // Avatar
    avatarWrapper: { alignItems: 'center', marginBottom: 28 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
    avatarFallback: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    cameraBadge: {
        position: 'absolute', bottom: 32, right: '35%',
        width: 30, height: 30, borderRadius: 15, backgroundColor: '#2563eb',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    changePhotoText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },

    // Section header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 24, marginBottom: 14,
        paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

    // Fields
    fieldWrapper: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
        borderColor: '#e2e8f0', paddingHorizontal: 14, height: 52,
    },
    inputIcon: { marginRight: 10 },
    inputText: { flex: 1, fontSize: 15, color: '#1e293b' },

    // Selector
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    },
    optionActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    optionText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    optionTextActive: { color: '#fff' },

    // Chips
    chipLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    chipTextActive: { color: '#2563eb', fontWeight: '700' },

    // Switch
    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', padding: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 16,
    },

    // Save button
    saveButton: {
        backgroundColor: '#2563eb', borderRadius: 14, height: 56,
        justifyContent: 'center', alignItems: 'center', marginTop: 24,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
