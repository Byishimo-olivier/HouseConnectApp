
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Cells, Districts, Sectors, Villages } from 'rwanda';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '../../utils/api';

type ProvinceKey = 'East' | 'Kigali' | 'North' | 'South' | 'West';
type PickerField = 'dob' | 'preferredStartTime' | 'preferredEndTime';

interface MaidFormData {
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
    country: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    currentAddress: string;
    willingToRelocate: boolean;
    yearsExperience: string;
    prevEmployer: string;
    prevEmployerContact: string;
    workTypes: string[];
    reasonForLeaving: string;
    highestEducation: string;
    languages: string;
    specialSkills: string[];
    drivingLicense: boolean;
    availabilityType: string;
    startDate: string;
    preferredStartTime: string;
    preferredEndTime: string;
    expectedSalary: string;
    salaryNegotiable: boolean;
    nidPhoto: string | null;
    insurancePhoto: string | null;
    emergencyName: string;
    emergencyRelation: string;
    emergencyPhone: string;
}

const RWANDA_COUNTRY = 'Rwanda';
const WORK_TYPES = ['Cleaning', 'Cooking', 'Babysitting', 'Elderly Care', 'Laundry', 'Gardening'];
const SPECIAL_SKILLS = ['First Aid', 'Child Care Training', 'Cooking Specialties'];
const GENDERS = ['Female', 'Male', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced'];
const EDU_LEVELS = ['None', 'Primary', 'Secondary', 'Vocational', 'University'];
const AVAIL_TYPES = ['Full-Time', 'Part-Time', 'Live-in'];
const START_AVAILABILITY_OPTIONS = ['Immediately', 'On day of hire', 'Within a week of hire', 'Within a month of hire'];

const PROVINCE_LABELS: Record<ProvinceKey, string> = {
    East: 'Eastern Province',
    Kigali: 'Kigali City',
    North: 'Northern Province',
    South: 'Southern Province',
    West: 'Western Province',
};

const PROVINCE_ALIASES: Record<string, ProvinceKey> = {
    east: 'East',
    eastern: 'East',
    'eastern province': 'East',
    kigali: 'Kigali',
    'kigali city': 'Kigali',
    north: 'North',
    northern: 'North',
    'northern province': 'North',
    south: 'South',
    southern: 'South',
    'southern province': 'South',
    west: 'West',
    western: 'West',
    'western province': 'West',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RWANDA_PHONE_REGEX = /^(?:\+?250|250|0)?7[2389]\d{7}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const unique = (arr: string[]) => Array.from(new Set(arr));

const parseIsoDate = (value: string) => {
    if (!DATE_REGEX.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
};

const parseHHMM = (value: string) => {
    const match = value.match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hh = Number(match[1]);
    const mm = Number(match[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    const date = new Date();
    date.setHours(hh, mm, 0, 0);
    return date;
};
const toIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const toHHMM = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

const formatTimeLabel = (value: string) => {
    const parsed = parseHHMM(value);
    if (!parsed) return value;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const resolveProvince = (value: string): ProvinceKey | null => PROVINCE_ALIASES[normalize(value)] || null;
const findMatch = (options: string[], value: string) => options.find((v) => normalize(v) === normalize(value)) || null;

export default function MaidSignupScreen() {
    const router = useRouter();
    const { refreshProfile } = useProfile();

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pickerState, setPickerState] = useState<{ field: PickerField; mode: 'date' | 'time'; value: Date } | null>(null);

    const [form, setForm] = useState<MaidFormData>({
        fullName: '', profilePhoto: null, dob: '', age: '', gender: 'Female',
        nidNumber: '', phone: '', email: '', password: '', confirmPassword: '',
        maritalStatus: 'Single', childrenCount: '0',
        country: RWANDA_COUNTRY, province: '', district: '', sector: '', cell: '', village: '',
        currentAddress: '', willingToRelocate: false,
        yearsExperience: '', prevEmployer: '', prevEmployerContact: '', workTypes: [], reasonForLeaving: '',
        highestEducation: 'Secondary', languages: '', specialSkills: [], drivingLicense: false,
        availabilityType: 'Full-Time', startDate: '', preferredStartTime: '', preferredEndTime: '',
        expectedSalary: '', salaryNegotiable: true,
        nidPhoto: null, insurancePhoto: null,
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
    });

    const update = (key: keyof MaidFormData, value: MaidFormData[keyof MaidFormData]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const selectedProvince = useMemo(() => resolveProvince(form.province), [form.province]);

    const districtOptions = useMemo(() => {
        if (!selectedProvince) return [];
        return Districts({ provinces: selectedProvince }) || [];
    }, [selectedProvince]);

    const matchedDistrict = useMemo(() => findMatch(districtOptions, form.district), [districtOptions, form.district]);

    const sectorOptions = useMemo(() => {
        if (!selectedProvince || !matchedDistrict) return [];
        const candidates = unique(Sectors({ province: selectedProvince, district: matchedDistrict as any }) || []);
        return candidates.filter((sectorName) => {
            const cells = Cells({ province: selectedProvince, district: matchedDistrict as any, sector: sectorName });
            return Boolean(cells && cells.length > 0);
        });
    }, [selectedProvince, matchedDistrict]);

    const matchedSector = useMemo(() => findMatch(sectorOptions, form.sector), [sectorOptions, form.sector]);

    const cellOptions = useMemo(() => {
        if (!selectedProvince || !matchedDistrict || !matchedSector) return [];
        return Cells({ province: selectedProvince, district: matchedDistrict as any, sector: matchedSector }) || [];
    }, [selectedProvince, matchedDistrict, matchedSector]);

    const matchedCell = useMemo(() => findMatch(cellOptions, form.cell), [cellOptions, form.cell]);

    const villageOptions = useMemo(() => {
        if (!selectedProvince || !matchedDistrict || !matchedSector || !matchedCell) return [];
        return Villages({
            province: selectedProvince,
            district: matchedDistrict as any,
            sector: matchedSector,
            cell: matchedCell,
        }) || [];
    }, [selectedProvince, matchedDistrict, matchedSector, matchedCell]);

    const matchedVillage = useMemo(() => findMatch(villageOptions, form.village), [villageOptions, form.village]);
    const showPreferredHours = form.availabilityType === 'Full-Time' || form.availabilityType === 'Part-Time';

    useEffect(() => {
        setForm((prev) => {
            const dob = parseIsoDate(prev.dob);
            if (!dob) {
                if (!prev.age) return prev;
                return { ...prev, age: '' };
            }

            const today = new Date();
            let years = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) years -= 1;
            const nextAge = years >= 0 ? String(years) : '';
            if (prev.age === nextAge) return prev;
            return { ...prev, age: nextAge };
        });
    }, [form.dob]);

    const pickImage = async (field: 'profilePhoto' | 'nidPhoto' | 'insurancePhoto') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: field === 'profilePhoto' ? [1, 1] : [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) update(field, result.assets[0].uri);
    };
    const openPicker = (field: PickerField, mode: 'date' | 'time', currentValue?: string) => {
        let value = new Date();
        if (mode === 'date' && currentValue) {
            const parsed = parseIsoDate(currentValue);
            if (parsed) value = parsed;
        }
        if (mode === 'time' && currentValue) {
            const parsed = parseHHMM(currentValue);
            if (parsed) value = parsed;
        }
        setPickerState({ field, mode, value });
    };

    const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!pickerState) return;
        if (Platform.OS === 'android') setPickerState(null);
        if (event.type === 'dismissed' || !selectedDate) return;

        if (pickerState.mode === 'date') {
            const value = toIsoDate(selectedDate);
            if (pickerState.field === 'dob') update('dob', value);
        } else {
            const value = toHHMM(selectedDate);
            if (pickerState.field === 'preferredStartTime') update('preferredStartTime', value);
            if (pickerState.field === 'preferredEndTime') update('preferredEndTime', value);
        }
    };

    const validateStep = () => {
        if (currentStep === 0) {
            if (!form.fullName.trim()) return Alert.alert('Validation Error', 'Full name is required.'), false;
            if (!form.dob) return Alert.alert('Validation Error', 'Date of birth is required.'), false;
            const dob = parseIsoDate(form.dob);
            if (!dob) return Alert.alert('Validation Error', 'Date of birth is invalid. Use the calendar picker.'), false;
            if (dob > new Date()) return Alert.alert('Validation Error', 'Date of birth cannot be in the future.'), false;
            if (Number(form.age || 0) < 18) return Alert.alert('Validation Error', 'You must be at least 18 years old.'), false;
            if (form.nidNumber.replace(/\D/g, '').length !== 16) return Alert.alert('Validation Error', 'National ID must be exactly 16 digits.'), false;
            if (!RWANDA_PHONE_REGEX.test(form.phone.replace(/\s+/g, ''))) return Alert.alert('Validation Error', 'Enter a valid Rwanda phone number.'), false;
            if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) return Alert.alert('Validation Error', 'Enter a valid email address.'), false;
            if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return Alert.alert('Validation Error', 'Password must be at least 8 chars with letters and numbers.'), false;
            if (form.password !== form.confirmPassword) return Alert.alert('Validation Error', 'Passwords do not match.'), false;
            if (Number.isNaN(Number(form.childrenCount)) || Number(form.childrenCount) < 0) return Alert.alert('Validation Error', 'Children count must be 0 or more.'), false;
        }

        if (currentStep === 1) {
            if (normalize(form.country) !== normalize(RWANDA_COUNTRY)) return Alert.alert('Validation Error', 'Country must be Rwanda.'), false;
            if (!selectedProvince) return Alert.alert('Validation Error', 'Province is not in Rwanda.'), false;
            if (!matchedDistrict) return Alert.alert('Validation Error', 'District is not in Rwanda for this province.'), false;
            if (!matchedSector) return Alert.alert('Validation Error', 'Sector is not in Rwanda for this district.'), false;
            if (!matchedCell) return Alert.alert('Validation Error', 'Cell is not in Rwanda for this sector.'), false;
            if (!matchedVillage) return Alert.alert('Validation Error', 'Village is not in Rwanda for this cell.'), false;
            if (!form.currentAddress.trim()) return Alert.alert('Validation Error', 'Current address is required.'), false;
        }

        if (currentStep === 2) {
            const years = Number(form.yearsExperience);
            if (Number.isNaN(years) || years < 0 || years > 60) return Alert.alert('Validation Error', 'Years of experience must be between 0 and 60.'), false;
            if (!form.prevEmployer.trim()) return Alert.alert('Validation Error', 'Previous employer name is required.'), false;
            if (form.prevEmployerContact.trim() && !RWANDA_PHONE_REGEX.test(form.prevEmployerContact.replace(/\s+/g, ''))) return Alert.alert('Validation Error', 'Employer contact must be a valid Rwanda phone.'), false;
            if (form.workTypes.length === 0) return Alert.alert('Validation Error', 'Select at least one work type.'), false;
            if (!form.reasonForLeaving.trim()) return Alert.alert('Validation Error', 'Reason for leaving is required.'), false;
        }

        if (currentStep === 3) {
            if (!form.languages.trim()) return Alert.alert('Validation Error', 'Languages spoken are required.'), false;
            if (form.specialSkills.length === 0) return Alert.alert('Validation Error', 'Select at least one special skill.'), false;
        }

        if (currentStep === 4) {
            if (!form.startDate) return Alert.alert('Validation Error', 'Choose when you can start after being hired.'), false;
            if (!START_AVAILABILITY_OPTIONS.includes(form.startDate)) return Alert.alert('Validation Error', 'Choose a valid start availability option.'), false;

            if (showPreferredHours) {
                const start = parseHHMM(form.preferredStartTime);
                const end = parseHHMM(form.preferredEndTime);
                if (!start) return Alert.alert('Validation Error', 'Choose preferred start time.'), false;
                if (!end) return Alert.alert('Validation Error', 'Choose preferred end time.'), false;
                if (start >= end) return Alert.alert('Validation Error', 'End time must be after start time.'), false;
            }
        }

        if (currentStep === 5) {
            const salary = Number(form.expectedSalary);
            if (Number.isNaN(salary) || salary <= 0) return Alert.alert('Validation Error', 'Expected salary must be greater than 0.'), false;
        }

        if (currentStep === 6) {
            if (!form.nidPhoto) return Alert.alert('Validation Error', 'National ID document is required.'), false;
            if (!form.insurancePhoto) return Alert.alert('Validation Error', 'Insurance document is required.'), false;
        }

        if (currentStep === 7) {
            if (!form.emergencyName.trim()) return Alert.alert('Validation Error', 'Emergency contact name is required.'), false;
            if (!form.emergencyRelation.trim()) return Alert.alert('Validation Error', 'Emergency contact relationship is required.'), false;
            if (!RWANDA_PHONE_REGEX.test(form.emergencyPhone.replace(/\s+/g, ''))) return Alert.alert('Validation Error', 'Emergency phone must be a valid Rwanda phone number.'), false;
        }

        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (currentStep < 7) setCurrentStep((s) => s + 1);
        else handleSubmit();
    };
    const handleSubmit = async () => {
        if (!validateStep()) return;
        if (!selectedProvince || !matchedDistrict || !matchedSector || !matchedCell || !matchedVillage) {
            Alert.alert('Validation Error', 'Location details are incomplete.');
            return;
        }

        setLoading(true);
        try {
            const authData = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    role: 'MAID',
                    fullName: form.fullName,
                    phone: form.phone,
                }),
            });

            await AsyncStorage.setItem('userToken', authData.token);
            await AsyncStorage.setItem('userRole', 'MAID');
            if (form.profilePhoto) await AsyncStorage.setItem('localProfileImage', form.profilePhoto);

            const provinceDistrict = `${PROVINCE_LABELS[selectedProvince]} / ${matchedDistrict}`;
            const sectorCellVillage = `${matchedSector} / ${matchedCell} / ${matchedVillage}`;
            const preferredHours = showPreferredHours ? `${form.preferredStartTime} - ${form.preferredEndTime}` : '';

            await apiFetch('/profile/me', {
                method: 'PUT',
                body: JSON.stringify({
                    fullName: form.fullName,
                    phone: form.phone,
                    address: form.currentAddress,
                    profileImage: form.profilePhoto,
                    dob: form.dob,
                    gender: form.gender,
                    nidNumber: form.nidNumber.replace(/\D/g, ''),
                    maritalStatus: form.maritalStatus,
                    childrenCount: parseInt(form.childrenCount, 10) || 0,
                    country: RWANDA_COUNTRY,
                    provinceDistrict,
                    sectorCellVillage,
                    willingToRelocate: form.willingToRelocate,
                    yearsExperience: parseInt(form.yearsExperience, 10) || 0,
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
                    preferredHours,
                    expectedSalary: parseFloat(form.expectedSalary) || 0,
                    salaryNegotiable: form.salaryNegotiable,
                    nidPhoto: form.nidPhoto,
                    insurancePhoto: form.insurancePhoto,
                    emergencyName: form.emergencyName,
                    emergencyRelation: form.emergencyRelation,
                    emergencyPhone: form.emergencyPhone,
                }),
            });

            await refreshProfile();
            Alert.alert('Account Perfected!', 'Your detailed profile has been created.', [
                { text: 'Go to Dashboard', onPress: () => router.replace('/maid') },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

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
                    <PressableField label="Date of Birth *" icon="calendar-outline" value={form.dob || 'Select date'} onPress={() => openPicker('dob', 'date', form.dob)} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Field label="Age" icon="time-outline" value={form.age} editable={false} />
                </View>
            </View>
            <Selector label="Gender" options={GENDERS} selected={form.gender} onSelect={(v: string) => update('gender', v)} />
            <Field label="National ID Number *" icon="card-outline" value={form.nidNumber} onChangeText={(v: string) => update('nidNumber', v.replace(/\D/g, ''))} keyboardType="numeric" />
            <Field label="Phone Number *" icon="call-outline" value={form.phone} onChangeText={(v: string) => update('phone', v)} keyboardType="phone-pad" />
            <Field label="Email Address (Optional)" icon="mail-outline" value={form.email} onChangeText={(v: string) => update('email', v)} autoCapitalize="none" />
            <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Create a password" placeholderTextColor="#94a3b8" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Confirm your password" placeholderTextColor="#94a3b8" value={form.confirmPassword} onChangeText={(v) => update('confirmPassword', v)} secureTextEntry={!showConfirm} />
                    <TouchableOpacity onPress={() => setShowConfirm((p) => !p)}>
                        <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <Selector label="Marital Status" options={MARITAL_STATUSES} selected={form.maritalStatus} onSelect={(v: string) => update('maritalStatus', v)} />
            <Field label="Number of Children" icon="people-outline" value={form.childrenCount} onChangeText={(v: string) => update('childrenCount', v.replace(/[^\d]/g, ''))} keyboardType="numeric" />
        </View>
    );

    const renderLocation = () => {
        const preview = (values: string[]) => (values.length ? values.slice(0, 5).join(', ') : 'No options yet');
        return (
            <View>
                <Field label="Country" icon="globe-outline" value={form.country} onChangeText={(v: string) => update('country', v)} />
                <Field label="Province *" icon="map-outline" placeholder="e.g. Kigali City, Eastern Province" value={form.province} onChangeText={(v: string) => {
                    update('province', v);
                    update('district', '');
                    update('sector', '');
                    update('cell', '');
                    update('village', '');
                }} />
                <HintText text={`Rwanda provinces: ${Object.values(PROVINCE_LABELS).join(', ')}`} />

                <Field label="District *" icon="business-outline" value={form.district} onChangeText={(v: string) => {
                    update('district', v);
                    update('sector', '');
                    update('cell', '');
                    update('village', '');
                }} />
                <HintText text={`District options: ${preview(districtOptions)}`} />

                <Field label="Sector *" icon="navigate-outline" value={form.sector} onChangeText={(v: string) => {
                    update('sector', v);
                    update('cell', '');
                    update('village', '');
                }} />
                <HintText text={`Sector options: ${preview(sectorOptions)}`} />

                <Field label="Cell *" icon="grid-outline" value={form.cell} onChangeText={(v: string) => {
                    update('cell', v);
                    update('village', '');
                }} />
                <HintText text={`Cell options: ${preview(cellOptions)}`} />

                <Field label="Village *" icon="location-outline" value={form.village} onChangeText={(v: string) => update('village', v)} />
                <HintText text={`Village options: ${preview(villageOptions)}`} />

                <Field label="Current Address *" icon="home-outline" value={form.currentAddress} onChangeText={(v: string) => update('currentAddress', v)} />
                <View style={styles.switchRow}>
                    <Text style={styles.label}>Willing to relocate?</Text>
                    <Switch value={form.willingToRelocate} onValueChange={(v) => update('willingToRelocate', v)} trackColor={{ true: '#2563eb' }} />
                </View>
            </View>
        );
    };

    const renderExperience = () => (
        <View>
            <Field label="Years of Experience *" icon="ribbon-outline" value={form.yearsExperience} onChangeText={(v: string) => update('yearsExperience', v.replace(/[^\d]/g, ''))} keyboardType="numeric" />
            <Field label="Previous Employer Name *" icon="business-outline" value={form.prevEmployer} onChangeText={(v: string) => update('prevEmployer', v)} />
            <Field label="Employer Contact (Optional)" icon="call-outline" value={form.prevEmployerContact} onChangeText={(v: string) => update('prevEmployerContact', v)} keyboardType="phone-pad" />
            <Text style={styles.sectionLabel}>Type of Work Done *</Text>
            <View style={styles.chipsRow}>
                {WORK_TYPES.map((type) => (
                    <TouchableOpacity key={type} style={[styles.chip, form.workTypes.includes(type) && styles.chipActive]} onPress={() => {
                        const updated = form.workTypes.includes(type) ? form.workTypes.filter((t) => t !== type) : [...form.workTypes, type];
                        update('workTypes', updated);
                    }}>
                        <Text style={[styles.chipText, form.workTypes.includes(type) && styles.chipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Field label="Reason for Leaving Previous Job *" icon="exit-outline" value={form.reasonForLeaving} onChangeText={(v: string) => update('reasonForLeaving', v)} multiline />
        </View>
    );

    const renderSkills = () => (
        <View>
            <Selector label="Highest Education Level" options={EDU_LEVELS} selected={form.highestEducation} onSelect={(v: string) => update('highestEducation', v)} />
            <Field label="Languages Spoken *" icon="chatbubbles-outline" value={form.languages} onChangeText={(v: string) => update('languages', v)} />
            <Text style={styles.sectionLabel}>Special Skills *</Text>
            <View style={styles.chipsRow}>
                {SPECIAL_SKILLS.map((skill) => (
                    <TouchableOpacity key={skill} style={[styles.chip, form.specialSkills.includes(skill) && styles.chipActive]} onPress={() => {
                        const updated = form.specialSkills.includes(skill) ? form.specialSkills.filter((s) => s !== skill) : [...form.specialSkills, skill];
                        update('specialSkills', updated);
                    }}>
                        <Text style={[styles.chipText, form.specialSkills.includes(skill) && styles.chipTextActive]}>{skill}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.switchRow}>
                <Text style={styles.label}>Driving License?</Text>
                <Switch value={form.drivingLicense} onValueChange={(v) => update('drivingLicense', v)} trackColor={{ true: '#2563eb' }} />
            </View>
        </View>
    );

    const renderAvailability = () => (
        <View>
            <Selector
                label="Availability Type"
                options={AVAIL_TYPES}
                selected={form.availabilityType}
                onSelect={(v: string) => {
                    update('availabilityType', v);
                    if (v === 'Live-in') {
                        update('preferredStartTime', '');
                        update('preferredEndTime', '');
                    }
                }}
            />
            <Selector
                label="Available Start Timing *"
                options={START_AVAILABILITY_OPTIONS}
                selected={form.startDate}
                onSelect={(v: string) => update('startDate', v)}
            />
            {showPreferredHours && (
                <>
                    <PressableField label="Preferred Start Time *" icon="time-outline" value={form.preferredStartTime ? formatTimeLabel(form.preferredStartTime) : 'Select time'} onPress={() => openPicker('preferredStartTime', 'time', form.preferredStartTime)} />
                    <PressableField label="Preferred End Time *" icon="time-outline" value={form.preferredEndTime ? formatTimeLabel(form.preferredEndTime) : 'Select time'} onPress={() => openPicker('preferredEndTime', 'time', form.preferredEndTime)} />
                </>
            )}
        </View>
    );

    const renderSalary = () => (
        <View>
            <Field label="Expected Monthly Salary (RWF) *" icon="cash-outline" value={form.expectedSalary} onChangeText={(v: string) => update('expectedSalary', v.replace(/[^\d.]/g, ''))} keyboardType="numeric" />
            <View style={styles.switchRow}>
                <Text style={styles.label}>Salary Negotiable?</Text>
                <Switch value={form.salaryNegotiable} onValueChange={(v) => update('salaryNegotiable', v)} trackColor={{ true: '#2563eb' }} />
            </View>
        </View>
    );

    const renderVerification = () => (
        <View>
            <Text style={styles.sectionLabel}>Document Uploads</Text>
            <View style={styles.uploadCards}>
                <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('nidPhoto')}>
                    {form.nidPhoto ? <Image source={{ uri: form.nidPhoto }} style={styles.uploadedDoc} /> : <UploadPlaceholder icon="card-outline" text="National ID (Front/Back)" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('insurancePhoto')}>
                    {form.insurancePhoto ? <Image source={{ uri: form.insurancePhoto }} style={styles.uploadedDoc} /> : <UploadPlaceholder icon="shield-outline" text="Insurance Document" />}
                </TouchableOpacity>
            </View>
            <HintText text="Both National ID and Insurance documents are required." />
        </View>
    );

    const renderEmergency = () => (
        <View>
            <Field label="Contact Name *" icon="person-outline" value={form.emergencyName} onChangeText={(v: string) => update('emergencyName', v)} />
            <Field label="Relationship *" icon="heart-outline" value={form.emergencyRelation} onChangeText={(v: string) => update('emergencyRelation', v)} />
            <Field label="Phone Number *" icon="call-outline" value={form.emergencyPhone} onChangeText={(v: string) => update('emergencyPhone', v)} keyboardType="phone-pad" />
        </View>
    );

    const stepTitles = ['Personal Info', 'Location', 'Experience', 'Education', 'Availability', 'Salary', 'Verification', 'Emergency'];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => (currentStep > 0 ? setCurrentStep((s) => s - 1) : router.back())}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
                <Text style={styles.headerStep}>{currentStep + 1}/8</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentStep + 1) / 8) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {currentStep === 0 && renderPersonal()}
                {currentStep === 1 && renderLocation()}
                {currentStep === 2 && renderExperience()}
                {currentStep === 3 && renderSkills()}
                {currentStep === 4 && renderAvailability()}
                {currentStep === 5 && renderSalary()}
                {currentStep === 6 && renderVerification()}
                {currentStep === 7 && renderEmergency()}

                <TouchableOpacity style={[styles.nextButton, loading && styles.buttonDisabled]} onPress={handleNext} disabled={loading}>
                    <Text style={styles.nextButtonText}>{currentStep === 7 ? 'Complete Profile' : 'Continue'}</Text>
                    {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/maid/profile')}>
                    <Text style={styles.skipText}>Complete Later</Text>
                </TouchableOpacity>
            </ScrollView>

            {pickerState && Platform.OS === 'ios' && (
                <View style={styles.pickerBackdrop}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>
                                {pickerState.mode === 'date' ? 'Select Date' : 'Select Time'}
                            </Text>
                            <TouchableOpacity onPress={() => setPickerState(null)}>
                                <Text style={styles.pickerDone}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={pickerState.value}
                            mode={pickerState.mode}
                            display="spinner"
                            onChange={onPickerChange}
                            themeVariant="light"
                            textColor="#0f172a"
                            accentColor="#2563eb"
                        />
                    </View>
                </View>
            )}

            {pickerState && Platform.OS !== 'ios' && (
                <DateTimePicker
                    value={pickerState.value}
                    mode={pickerState.mode}
                    display="default"
                    onChange={onPickerChange}
                />
            )}
        </View>
    );
}
function Field({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, editable }: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputContainer, multiline && { height: 96, alignItems: 'flex-start', paddingTop: 10 }]}>
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

function PressableField({ label, icon, value, onPress }: { label: string; icon: string; value: string; onPress: () => void }) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
                <Ionicons name={icon as any} size={18} color="#64748b" style={styles.inputIcon} />
                <Text style={[styles.input, { color: value.includes('Select') ? '#94a3b8' : '#1e293b' }]}>{value}</Text>
            </TouchableOpacity>
        </View>
    );
}

function Selector({ label, options, selected, onSelect }: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.selectorRow}>
                {options.map((opt: string) => (
                    <TouchableOpacity key={opt} style={[styles.option, selected === opt && styles.optionActive]} onPress={() => onSelect(opt)}>
                        <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function HintText({ text }: { text: string }) {
    return <Text style={styles.hintText}>{text}</Text>;
}

function UploadPlaceholder({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.uploadInner}>
            <Ionicons name={icon as any} size={28} color="#2563eb" />
            <Text style={styles.uploadCardText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    headerStep: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    progressBar: { height: 4, backgroundColor: '#f1f5f9' },
    progressFill: { height: 4, backgroundColor: '#2563eb' },
    scrollContent: { padding: 24, paddingBottom: 50 },
    fieldWrapper: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 14,
        height: 55,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#1e293b', fontSize: 15 },
    hintText: { fontSize: 12, color: '#64748b', marginTop: -8, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center' },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    optionActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    optionText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    optionTextActive: { color: '#fff' },
    photoUpload: {
        alignSelf: 'center',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    uploadedPhoto: { width: '100%', height: '100%' },
    photoPlaceholder: { alignItems: 'center' },
    photoText: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 4 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    chipTextActive: { color: '#2563eb', fontWeight: '700' },
    uploadCards: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    uploadCard: {
        flex: 1,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadInner: { alignItems: 'center', padding: 10 },
    uploadCardText: { fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 6, fontWeight: '600' },
    uploadedDoc: { width: '100%', height: '100%' },
    nextButton: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 18,
    },
    buttonDisabled: { opacity: 0.6 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipButton: { alignSelf: 'center', marginTop: 20 },
    skipText: { fontSize: 14, color: '#64748b', fontWeight: '600', textDecorationLine: 'underline' },
    pickerBackdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.25)',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 20,
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    pickerTitle: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
    pickerDone: { color: '#2563eb', fontSize: 15, fontWeight: '700' },
});
