import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
    Dimensions,
    Image,
    Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../utils/api';
import { useProfile } from '@/context/ProfileContext';

const { width } = Dimensions.get('window');

// ─── Types and Constants ──────────────────────────────────────────────────────
interface MaidFormData {
    // 1. Personal
    fullName: string;
    profilePhoto: string | null;
    dob: string;
    age: string;
    gender: string;
    nidNumber: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    maritalStatus: string;
    childrenCount: string;
    // 2. Location
    country: string;
    provinceDistrict: string;
    sectorCellVillage: string;
    currentAddress: string;
    willingToRelocate: boolean;
    // 3. Experience
    yearsExperience: string;
    prevEmployer: string;
    prevEmployerContact: string;
    workTypes: string[];
    reasonForLeaving: string;
    // 4. Skills & Education
    highestEducation: string;
    languages: string;
    specialSkills: string[];
    drivingLicense: boolean;
    // 5. Availability
    availabilityType: string;
    startDate: string;
    preferredHours: string;
    // 6. Salary
    expectedSalary: string;
    salaryNegotiable: boolean;
    // 7. Verification
    nidPhoto: string | null;
    insurancePhoto: string | null;
    // 8. Emergency
    emergencyName: string;
    emergencyRelation: string;
    emergencyPhone: string;
}

const WORK_TYPES = [
    'Cleaning', 'Cooking', 'Babysitting', 'Elderly Care',
    'Laundry', 'Gardening'
];

const SPECIAL_SKILLS = [
    'First Aid', 'Child Care Training', 'Cooking Specialties'
];

const GENDERS = ['Female', 'Male', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced'];
const EDU_LEVELS = ['None', 'Primary', 'Secondary', 'Vocational', 'University'];
const AVAIL_TYPES = ['Full-Time', 'Part-Time', 'Live-in'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MaidSignupScreen() {
    const router = useRouter();
    const { refreshProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState<MaidFormData>({
        fullName: '', profilePhoto: null, dob: '', age: '', gender: 'Female',
        nidNumber: '', phone: '', email: '', password: '', confirmPassword: '',
        maritalStatus: 'Single', childrenCount: '0',
        country: 'Rwanda', provinceDistrict: '', sectorCellVillage: '', currentAddress: '', willingToRelocate: false,
        yearsExperience: '', prevEmployer: '', prevEmployerContact: '', workTypes: [], reasonForLeaving: '',
        highestEducation: 'Secondary', languages: '', specialSkills: [], drivingLicense: false,
        availabilityType: 'Full-Time', startDate: '', preferredHours: '',
        expectedSalary: '', salaryNegotiable: true,
        nidPhoto: null, insurancePhoto: null,
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
    });

    const update = (key: keyof MaidFormData, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // Auto-calculate age from DOB (Format: YYYY-MM-DD or DD/MM/YYYY)
    useEffect(() => {
        if (form.dob && form.dob.length >= 4) {
            const year = parseInt(form.dob.split(/[-/]/).find(s => s.length === 4) || '0');
            if (year > 1900 && year < new Date().getFullYear()) {
                const calculatedAge = new Date().getFullYear() - year;
                update('age', calculatedAge.toString());
            }
        }
    }, [form.dob]);

    const pickImage = async (field: 'profilePhoto' | 'nidPhoto' | 'insurancePhoto') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: field === 'profilePhoto' ? [1, 1] : [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            update(field, result.assets[0].uri);
        }
    };

    const validateStep = (): boolean => {
        // Simple validation for now, can be expanded
        if (currentStep === 0) {
            if (!form.fullName || !form.nidNumber || !form.phone || !form.password || !form.confirmPassword) {
                Alert.alert('Required', 'Please fill in Name, NID, Phone, and Password.');
                return false;
            }
            if (form.password !== form.confirmPassword) {
                Alert.alert('Password Mismatch', 'Passwords do not match.');
                return false;
            }
            if (form.password.length < 6) {
                Alert.alert('Weak Password', 'Password should be at least 6 characters.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (currentStep < 7) setCurrentStep(s => s + 1);
        else handleSubmit();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Register Account
            const authData = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    role: 'MAID',
                    fullName: form.fullName,
                    phone: form.phone
                }),
            });

            const token = authData.token;
            // Persist token for subsequent calls
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', 'MAID');

            // Save local photo for immediate UI feedback
            if (form.profilePhoto) {
                await AsyncStorage.setItem('localProfileImage', form.profilePhoto);
            }

            // 2. Update Detailed Profile
            await apiFetch('/profile/me', {
                method: 'PUT',
                body: JSON.stringify({
                    fullName: form.fullName,
                    phone: form.phone,
                    address: form.currentAddress,
                    profileImage: form.profilePhoto,
                    dob: form.dob,
                    gender: form.gender,
                    nidNumber: form.nidNumber,
                    maritalStatus: form.maritalStatus,
                    childrenCount: parseInt(form.childrenCount) || 0,
                    country: form.country,
                    provinceDistrict: form.provinceDistrict,
                    sectorCellVillage: form.sectorCellVillage,
                    willingToRelocate: form.willingToRelocate,
                    yearsExperience: parseInt(form.yearsExperience) || 0,
                    prevEmployer: form.prevEmployer,
                    prevEmployerContact: form.prevEmployerContact,
                    workTypes: form.workTypes,
                    reasonForLeaving: form.reasonForLeaving,
                    highestEducation: form.highestEducation,
                    languages: form.languages,
                    specialSkills: form.specialSkills,
                    drivingLicense: form.drivingLicense,
                    availabilityType: form.availabilityType,
                    startDate: form.startDate,
                    preferredHours: form.preferredHours,
                    expectedSalary: parseFloat(form.expectedSalary) || 0,
                    salaryNegotiable: form.salaryNegotiable,
                    nidPhoto: form.nidPhoto,
                    insurancePhoto: form.insurancePhoto,
                    emergencyName: form.emergencyName,
                    emergencyRelation: form.emergencyRelation,
                    emergencyPhone: form.emergencyPhone
                }),
            });

            // 3. Refresh global profile state
            await refreshProfile();

            Alert.alert('Account Perfected! 🎉', 'Your detailed profile has been created.', [
                { text: 'Go to Dashboard', onPress: () => router.replace('/maid') },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return renderPersonal();
            case 1: return renderLocation();
            case 2: return renderExperience();
            case 3: return renderSkillsEdu();
            case 4: return renderAvailability();
            case 5: return renderSalary();
            case 6: return renderVerification();
            case 7: return renderEmergency();
            default: return null;
        }
    };

    // ─── Step Content Renderers ───────────────────────────────────────────────

    const renderPersonal = () => (
        <View>
            <TouchableOpacity style={styles.photoUpload} onPress={() => pickImage('profilePhoto')}>
                {form.profilePhoto ? (
                    <Image source={{ uri: form.profilePhoto }} style={styles.uploadedPhoto} />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera" size={32} color="#94A3B8" />
                        <Text style={styles.photoText}>Upload Profile Photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Field label="Full Name *" icon="person-outline" value={form.fullName} onChangeText={(v: string) => update('fullName', v)} />
            <View style={styles.row}>
                <View style={{ flex: 1.5 }}>
                    <Field label="Date of Birth" icon="calendar-outline" placeholder="YYYY-MM-DD" value={form.dob} onChangeText={(v: string) => update('dob', v)} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Field label="Age" icon="time-outline" value={form.age} editable={false} />
                </View>
            </View>

            <Selector label="Gender" options={GENDERS} selected={form.gender} onSelect={(v: string) => update('gender', v)} />
            <Field label="National ID Number *" icon="card-outline" value={form.nidNumber} onChangeText={(v: string) => update('nidNumber', v)} />
            <Field label="Phone Number *" icon="call-outline" value={form.phone} onChangeText={(v: string) => update('phone', v)} keyboardType="phone-pad" />
            <Field label="Email Address (Optional)" icon="mail-outline" value={form.email} onChangeText={(v: string) => update('email', v)} autoCapitalize="none" />

            <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor="#94a3b8"
                        value={form.password}
                        onChangeText={(v: string) => update('password', v)}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="#94a3b8"
                        value={form.confirmPassword}
                        onChangeText={(v: string) => update('confirmPassword', v)}
                        secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <Selector label="Marital Status" options={MARITAL_STATUSES} selected={form.maritalStatus} onSelect={(v: string) => update('maritalStatus', v)} />
            <Field label="Number of Children" icon="people-outline" value={form.childrenCount} onChangeText={(v: string) => update('childrenCount', v)} keyboardType="numeric" />
        </View>
    );

    const renderLocation = () => (
        <View>
            <Field label="Country" icon="globe-outline" value={form.country} onChangeText={(v: string) => update('country', v)} />
            <Field label="Province / District" icon="map-outline" value={form.provinceDistrict} onChangeText={(v: string) => update('provinceDistrict', v)} />
            <Field label="Sector / Cell / Village" icon="location-outline" value={form.sectorCellVillage} onChangeText={(v: string) => update('sectorCellVillage', v)} />
            <Field label="Current Address" icon="home-outline" value={form.currentAddress} onChangeText={(v: string) => update('currentAddress', v)} />
            <View style={styles.switchRow}>
                <Text style={styles.label}>Willing to relocate?</Text>
                <Switch value={form.willingToRelocate} onValueChange={(v: boolean) => update('willingToRelocate', v)} trackColor={{ true: '#2563eb' }} />
            </View>
        </View>
    );

    const renderExperience = () => (
        <View>
            <Field label="Years of Experience" icon="ribbon-outline" value={form.yearsExperience} onChangeText={(v: string) => update('yearsExperience', v)} keyboardType="numeric" />
            <Field label="Previous Employer Name" icon="business-outline" value={form.prevEmployer} onChangeText={(v: string) => update('prevEmployer', v)} />
            <Field label="Employer Contact (Optional)" icon="call-outline" value={form.prevEmployerContact} onChangeText={(v: string) => update('prevEmployerContact', v)} keyboardType="phone-pad" />

            <Text style={styles.sectionLabel}>Type of Work Done</Text>
            <View style={styles.chipsRow}>
                {WORK_TYPES.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.chip, form.workTypes.includes(type) && styles.chipActive]}
                        onPress={() => {
                            const newTypes = form.workTypes.includes(type)
                                ? form.workTypes.filter(t => t !== type)
                                : [...form.workTypes, type];
                            update('workTypes', newTypes);
                        }}
                    >
                        <Text style={[styles.chipText, form.workTypes.includes(type) && styles.chipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Field label="Reason for Leaving Previous Job" icon="exit-outline" value={form.reasonForLeaving} onChangeText={(v: string) => update('reasonForLeaving', v)} multiline />
        </View>
    );

    const renderSkillsEdu = () => (
        <View>
            <Selector label="Highest Education Level" options={EDU_LEVELS} selected={form.highestEducation} onSelect={(v: string) => update('highestEducation', v)} />
            <Field label="Languages Spoken" icon="chatbubbles-outline" value={form.languages} onChangeText={(v: string) => update('languages', v)} />

            <Text style={styles.sectionLabel}>Special Skills</Text>
            <View style={styles.chipsRow}>
                {SPECIAL_SKILLS.map(skill => (
                    <TouchableOpacity
                        key={skill}
                        style={[styles.chip, form.specialSkills.includes(skill) && styles.chipActive]}
                        onPress={() => {
                            const newSkills = form.specialSkills.includes(skill)
                                ? form.specialSkills.filter(s => s !== skill)
                                : [...form.specialSkills, skill];
                            update('specialSkills', newSkills);
                        }}
                    >
                        <Text style={[styles.chipText, form.specialSkills.includes(skill) && styles.chipTextActive]}>{skill}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.switchRow}>
                <Text style={styles.label}>Driving License?</Text>
                <Switch value={form.drivingLicense} onValueChange={(v: boolean) => update('drivingLicense', v)} trackColor={{ true: '#2563eb' }} />
            </View>
        </View>
    );

    const renderAvailability = () => (
        <View>
            <Selector label="Availability Type" options={AVAIL_TYPES} selected={form.availabilityType} onSelect={(v: string) => update('availabilityType', v)} />
            <Field label="Available Start Date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={form.startDate} onChangeText={(v: string) => update('startDate', v)} />
            <Field label="Preferred Working Hours" icon="time-outline" placeholder="e.g. 7 AM - 6 PM" value={form.preferredHours} onChangeText={(v: string) => update('preferredHours', v)} />
        </View>
    );

    const renderSalary = () => (
        <View>
            <Field label="Expected Monthly Salary (RWF)" icon="cash-outline" value={form.expectedSalary} onChangeText={(v: string) => update('expectedSalary', v)} keyboardType="numeric" />
            <View style={styles.switchRow}>
                <Text style={styles.label}>Salary Negotiable?</Text>
                <Switch value={form.salaryNegotiable} onValueChange={(v: boolean) => update('salaryNegotiable', v)} trackColor={{ true: '#2563eb' }} />
            </View>
        </View>
    );

    const renderVerification = () => (
        <View>
            <Text style={styles.sectionLabel}>Document Uploads</Text>
            <View style={styles.uploadCards}>
                <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('nidPhoto')}>
                    {form.nidPhoto ? (
                        <Image source={{ uri: form.nidPhoto }} style={styles.uploadedDoc} />
                    ) : (
                        <View style={styles.uploadInner}>
                            <Ionicons name="card-outline" size={28} color="#2563eb" />
                            <Text style={styles.uploadCardText}>National ID (Front/Back)</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('insurancePhoto')}>
                    {form.insurancePhoto ? (
                        <Image source={{ uri: form.insurancePhoto }} style={styles.uploadedDoc} />
                    ) : (
                        <View style={styles.uploadInner}>
                            <Ionicons name="shield-outline" size={28} color="#2563eb" />
                            <Text style={styles.uploadCardText}>Insurance Document</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
                <Text style={styles.infoText}>Only Insurance and National ID are required for verification.</Text>
            </View>
        </View>
    );

    const renderEmergency = () => (
        <View>
            <Field label="Contact Name" icon="person-outline" value={form.emergencyName} onChangeText={(v: string) => update('emergencyName', v)} />
            <Field label="Relationship" icon="heart-outline" value={form.emergencyRelation} onChangeText={(v: string) => update('emergencyRelation', v)} />
            <Field label="Phone Number" icon="call-outline" value={form.emergencyPhone} onChangeText={(v: string) => update('emergencyPhone', v)} keyboardType="phone-pad" />
        </View>
    );

    const stepTitles = [
        'Personal Info', 'Location', 'Experience', 'Education',
        'Availability', 'Salary', 'Verification', 'Emergency'
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => currentStep > 0 ? setCurrentStep(s => s - 1) : router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
                <Text style={styles.headerStep}>{currentStep + 1}/8</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentStep + 1) / 8) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderStepContent()}

                <TouchableOpacity
                    style={[styles.nextButton, loading && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={loading}
                >
                    <Text style={styles.nextButtonText}>{currentStep === 7 ? 'Complete Profile' : 'Continue'}</Text>
                    {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/maid/profile')}>
                    <Text style={styles.skipText}>Complete Later</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, editable }: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputContainer, multiline && { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                <Ionicons name={icon} size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize || 'none'}
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
            <Text style={styles.label}>{label}</Text>
            <View style={styles.selectorRow}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    headerStep: { fontSize: 13, fontWeight: '600', color: '#64748b', opacity: 0.8 },
    progressBar: { height: 4, backgroundColor: '#f1f5f9', width: '100%' },
    progressFill: { height: '100%', backgroundColor: '#2563eb' },
    scrollContent: { padding: 25, paddingBottom: 50 },
    fieldWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 15, height: 55,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#1e293b', fontSize: 15 },
    row: { flexDirection: 'row', alignItems: 'center' },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    option: {
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    },
    optionActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    optionText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    optionTextActive: { color: '#fff' },
    photoUpload: {
        alignSelf: 'center', width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0',
        borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
        marginBottom: 30, overflow: 'hidden',
    },
    uploadedPhoto: { width: '100%', height: '100%' },
    photoPlaceholder: { alignItems: 'center' },
    photoText: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 20,
    },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12, marginTop: 5 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    chipTextActive: { color: '#2563eb', fontWeight: '700' },
    uploadCards: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    uploadCard: {
        flex: 1, height: 120, borderRadius: 12, backgroundColor: '#f8fafc',
        borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    uploadInner: { alignItems: 'center', padding: 10 },
    uploadCardText: { fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 8, fontWeight: '600' },
    uploadedDoc: { width: '100%', height: '100%' },
    infoBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
        backgroundColor: '#eff6ff', borderRadius: 10,
    },
    infoText: { fontSize: 12, color: '#2563eb', flex: 1, lineHeight: 18 },
    nextButton: {
        backgroundColor: '#2563eb', borderRadius: 15, height: 58,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, marginTop: 20,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    buttonDisabled: { opacity: 0.6 },
    nextButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    skipButton: { alignSelf: 'center', marginTop: 20 },
    skipText: { fontSize: 15, color: '#64748b', fontWeight: '600', textDecorationLine: 'underline' },
});
