import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminOverviewCharts from '@/components/charts/AdminOverviewCharts';
import AdminPaymentsCharts from '@/components/charts/AdminPaymentsCharts';
import AdminSidebar, { type AdminSidebarItem } from '@/components/admin/AdminSidebar';
import type { ChartDatum, PaymentTrendDatum } from '@/components/charts/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';

type Section = 'overview' | 'users' | 'jobs' | 'applications' | 'payments' | 'reviews';
type FocusSection = Exclude<Section, 'overview'>;
type ListRes<T> = { items: T[]; pagination: { total: number; page: number; limit: number; totalPages: number } };

type FilterState = {
  usersRole: string;
  jobsStatus: string;
  applicationsStatus: string;
  paymentsStatus: string;
  paymentsType: string;
  reviewsRating: string;
};

type FilterGroupDef = { key: keyof FilterState; label: string; options: string[] };
type TableColumn = { key: string; label: string; width: number; render: (item: any) => React.ReactNode };
type OverviewTone = {
  surface: string;
  border: string;
  accent: string;
  icon: string;
  label: string;
  value: string;
  helper: string;
};
type InsightCardItem = {
  title: string;
  value: string;
  section: FocusSection;
  chip: string;
};

const USER_ROLES = ['ADMIN', 'EMPLOYER', 'MAID'] as const;
type UserRole = typeof USER_ROLES[number];
type UserCrudMode = 'create' | 'edit';
type AdminPaymentsOverview = {
  months: number;
  generatedAt: string;
  trendData: PaymentTrendDatum[];
  summary: {
    transactions: number;
    totalVolume: number;
    successful: number;
    pending: number;
    failed: number;
  };
};
type AdminUserDraft = {
  id?: number;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  password: string;
  dob: string;
  gender: string;
  nidNumber: string;
  maritalStatus: string;
  childrenCount: string;
  country: string;
  provinceDistrict: string;
  sectorCellVillage: string;
  willingToRelocate: boolean;
  yearsExperience: string;
  prevEmployer: string;
  prevEmployerContact: string;
  workTypes: string;
  reasonForLeaving: string;
  highestEducation: string;
  languages: string;
  specialSkills: string;
  drivingLicense: boolean;
  availabilityType: string;
  startDate: string;
  preferredHours: string;
  expectedSalary: string;
  salaryNegotiable: boolean;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
};

const NAV: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
  { key: 'applications', label: 'Applications', icon: 'reader-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
  { key: 'reviews', label: 'Reviews', icon: 'star-outline' }
];

const INITIAL_FILTERS: FilterState = {
  usersRole: 'ALL',
  jobsStatus: 'ALL',
  applicationsStatus: 'ALL',
  paymentsStatus: 'ALL',
  paymentsType: 'ALL',
  reviewsRating: 'ALL'
};

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const money = (amount: unknown, currency: unknown) =>
  `${Number(amount || 0).toLocaleString()} ${String(currency || 'RWF').toUpperCase()}`;

const q = (value: unknown) => String(value || '').toLowerCase();
const pretty = (value: string) => value.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase());
const num = (value: unknown) => Number(value || 0);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseDateInput = (value: unknown) => {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};
const listToComma = (value: unknown) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '');
};
const emptyUserDraft = (): AdminUserDraft => ({
  role: 'EMPLOYER',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  password: '',
  dob: '',
  gender: '',
  nidNumber: '',
  maritalStatus: '',
  childrenCount: '',
  country: 'Rwanda',
  provinceDistrict: '',
  sectorCellVillage: '',
  willingToRelocate: false,
  yearsExperience: '',
  prevEmployer: '',
  prevEmployerContact: '',
  workTypes: '',
  reasonForLeaving: '',
  highestEducation: '',
  languages: '',
  specialSkills: '',
  drivingLicense: false,
  availabilityType: '',
  startDate: '',
  preferredHours: '',
  expectedSalary: '',
  salaryNegotiable: true,
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: ''
});
const draftFromUser = (item: any): AdminUserDraft => ({
  id: item.id,
  role: (String(item.role || 'EMPLOYER').toUpperCase() as UserRole),
  fullName: String(item.fullName || ''),
  email: String(item.email || ''),
  phone: String(item.phone || ''),
  address: String(item.address || ''),
  description: String(item.description || ''),
  password: '',
  dob: parseDateInput(item.dob),
  gender: String(item.gender || ''),
  nidNumber: String(item.nidNumber || ''),
  maritalStatus: String(item.maritalStatus || ''),
  childrenCount: item.childrenCount === null || item.childrenCount === undefined ? '' : String(item.childrenCount),
  country: String(item.country || 'Rwanda'),
  provinceDistrict: String(item.provinceDistrict || ''),
  sectorCellVillage: String(item.sectorCellVillage || ''),
  willingToRelocate: Boolean(item.willingToRelocate),
  yearsExperience: item.yearsExperience === null || item.yearsExperience === undefined ? '' : String(item.yearsExperience),
  prevEmployer: String(item.prevEmployer || ''),
  prevEmployerContact: String(item.prevEmployerContact || ''),
  workTypes: listToComma(item.workTypes),
  reasonForLeaving: String(item.reasonForLeaving || ''),
  highestEducation: String(item.highestEducation || ''),
  languages: String(item.languages || ''),
  specialSkills: listToComma(item.specialSkills),
  drivingLicense: Boolean(item.drivingLicense),
  availabilityType: String(item.availabilityType || ''),
  startDate: parseDateInput(item.startDate),
  preferredHours: String(item.preferredHours || ''),
  expectedSalary: item.expectedSalary === null || item.expectedSalary === undefined ? '' : String(item.expectedSalary),
  salaryNegotiable: item.salaryNegotiable === null || item.salaryNegotiable === undefined ? true : Boolean(item.salaryNegotiable),
  emergencyName: String(item.emergencyName || ''),
  emergencyRelation: String(item.emergencyRelation || ''),
  emergencyPhone: String(item.emergencyPhone || '')
});

function Pill({ value }: { value: unknown }) {
  const text = String(value || 'N/A').toUpperCase();
  const state = q(value);
  const tone =
    state.includes('success') || state.includes('admin') || state.includes('active') || state.includes('accepted') || state.includes('open') || state.includes('resolved') || state.includes('completed')
      ? styles.pillSuccess
      : state.includes('pending') || state.includes('interview')
        ? styles.pillWarn
        : state.includes('failed') || state.includes('rejected') || state.includes('closed') || state.includes('terminated')
          ? styles.pillDanger
          : styles.pillInfo;

  return (
    <View style={[styles.pill, tone]}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  helper,
  icon,
  tone,
  onPress
}: {
  label: string;
  value: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: OverviewTone;
  onPress: () => void;
}) {
  const card = (
    <View style={[styles.metricCard, { backgroundColor: tone.surface, borderColor: tone.border }]}>
      <View style={[styles.metricAccent, { backgroundColor: tone.accent }]} />
      <View style={styles.metricHead}>
        <Text style={[styles.metricLabel, { color: tone.label }]}>{label}</Text>
        <View style={[styles.metricIconWrap, { backgroundColor: tone.border }]}>
          <Ionicons name={icon} size={15} color={tone.icon} />
        </View>
      </View>
      <Text style={[styles.metricValue, { color: tone.value }]}>{value}</Text>
      <Text style={[styles.metricHelp, { color: tone.helper }]}>{helper}</Text>
      <Text style={[styles.metricHint, { color: tone.icon }]}>Tap to open</Text>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.metricTap}>
      {card}
    </TouchableOpacity>
  );
}

function NavButton({
  active,
  onPress,
  label,
  icon,
  compact
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.navButton, active && styles.navButtonActive, compact && styles.navButtonCompact]}>
      <Ionicons name={icon} size={16} color={active ? '#FFFFFF' : '#64748B'} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onSelect
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (next: string) => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChips}>
        {options.map((option) => (
          <TouchableOpacity
            key={`${label}-${option}`}
            style={[styles.filterChip, option === value && styles.filterChipActive]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.filterChipText, option === value && styles.filterChipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function formatLastSixMonths() {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return months;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const { profile, isLoading: profileLoading, logout } = useProfile();
  const desktop = width >= 1100;

  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsOverview, setPaymentsOverview] = useState<AdminPaymentsOverview | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userCrudMode, setUserCrudMode] = useState<UserCrudMode>('create');
  const [userSaving, setUserSaving] = useState(false);
  const [userDraft, setUserDraft] = useState<AdminUserDraft>(emptyUserDraft);

  const loadAll = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [o, u, j, a, p, po, r] = await Promise.all([
        apiFetch('/admin/overview'),
        apiFetch('/admin/users?limit=100'),
        apiFetch('/admin/jobs?limit=100'),
        apiFetch('/admin/applications?limit=100'),
        apiFetch('/admin/payments?limit=100'),
        apiFetch('/admin/payments/overview?months=6'),
        apiFetch('/admin/reviews?limit=100')
      ]) as [any, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>, AdminPaymentsOverview, ListRes<any>];

      setOverview(o);
      setUsers(u.items || []);
      setJobs(j.items || []);
      setApplications(a.items || []);
      setPayments(p.items || []);
      setPaymentsOverview(po || null);
      setReviews(r.items || []);
      setUpdatedAt(new Date());
    } catch (error: any) {
      Alert.alert('Admin Error', error?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile || profile.role !== 'ADMIN') return;
    loadAll();
  }, [profileLoading, profile, loadAll]);

  useEffect(() => {
    setSearch('');
  }, [section]);

  const dataBySection = useMemo(
    () => ({ users, jobs, applications, payments, reviews }),
    [users, jobs, applications, payments, reviews]
  );

  const filteredRows = useMemo(() => {
    if (section === 'overview') return [];
    let list = dataBySection[section] || [];

    if (search.trim()) {
      const query = q(search.trim());
      list = list.filter((item) => q(JSON.stringify(item)).includes(query));
    }

    if (section === 'users' && filters.usersRole !== 'ALL') {
      list = list.filter((item) => q(item.role) === q(filters.usersRole));
    }
    if (section === 'jobs' && filters.jobsStatus !== 'ALL') {
      list = list.filter((item) => q(item.status) === q(filters.jobsStatus));
    }
    if (section === 'applications' && filters.applicationsStatus !== 'ALL') {
      list = list.filter((item) => q(item.status) === q(filters.applicationsStatus));
    }
    if (section === 'payments') {
      if (filters.paymentsStatus !== 'ALL') {
        list = list.filter((item) => q(item.status) === q(filters.paymentsStatus));
      }
      if (filters.paymentsType !== 'ALL') {
        list = list.filter((item) => q(item.type) === q(filters.paymentsType));
      }
    }
    if (section === 'reviews' && filters.reviewsRating !== 'ALL') {
      list = list.filter((item) => String(Math.round(Number(item.rating || 0))) === filters.reviewsRating);
    }

    return list;
  }, [section, dataBySection, search, filters]);

  const stats = useMemo(() => overview?.stats || {}, [overview]);

  const analytics = useMemo(() => {
    const roles: ChartDatum[] = [
      { label: 'Admins', value: num(stats.adminsCount) || users.filter((u) => u.role === 'ADMIN').length, color: '#2563EB' },
      { label: 'Employers', value: num(stats.employersCount) || users.filter((u) => u.role === 'EMPLOYER').length, color: '#0EA5E9' },
      { label: 'Maids', value: num(stats.maidsCount) || users.filter((u) => u.role === 'MAID').length, color: '#10B981' }
    ];

    const jobStatus: ChartDatum[] = [
      { label: 'Open', value: jobs.filter((item) => item.status === 'OPEN').length, color: '#16A34A' },
      { label: 'Filled', value: jobs.filter((item) => item.status === 'FILLED').length, color: '#0EA5E9' },
      { label: 'Closed', value: jobs.filter((item) => item.status === 'CLOSED').length, color: '#64748B' }
    ];

    const paymentStatus: ChartDatum[] = [
      { label: 'Successful', value: payments.filter((item) => q(item.status) === 'successful').length, color: '#16A34A' },
      { label: 'Pending', value: payments.filter((item) => q(item.status) === 'pending').length, color: '#F59E0B' },
      { label: 'Failed', value: payments.filter((item) => q(item.status) === 'failed').length, color: '#DC2626' }
    ];

    const applicationsStatus: ChartDatum[] = [
      { label: 'Pending', value: applications.filter((item) => q(item.status) === 'pending').length, color: '#F59E0B' },
      { label: 'Interview', value: applications.filter((item) => q(item.status) === 'interview').length, color: '#0EA5E9' },
      { label: 'Accepted', value: applications.filter((item) => q(item.status) === 'accepted').length, color: '#16A34A' },
      { label: 'Rejected', value: applications.filter((item) => q(item.status) === 'rejected').length, color: '#DC2626' }
    ];

    const totalApplications = applications.length || num(stats.applicationsCount);
    const acceptedApplications = applications.filter((item) => q(item.status) === 'accepted').length;
    const totalPayments = payments.length || num(stats.paymentsCount);
    const successfulPayments = payments.filter((item) => q(item.status) === 'successful').length;
    const avgRating = reviews.length
      ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(reviews.length, 1)).toFixed(2)
      : '0.00';

    const insightCards: InsightCardItem[] = [
      { title: 'Application Approval Rate', value: `${Math.round((acceptedApplications / Math.max(totalApplications, 1)) * 100)}%`, section: 'applications', chip: 'Applications' },
      { title: 'Payment Success Rate', value: `${Math.round((successfulPayments / Math.max(totalPayments, 1)) * 100)}%`, section: 'payments', chip: 'Payments' },
      { title: 'Average Review Rating', value: `${avgRating} / 5`, section: 'reviews', chip: 'Reviews' },
      { title: 'Open Jobs', value: String(num(stats.openJobsCount) || jobs.filter((item) => item.status === 'OPEN').length), section: 'jobs', chip: 'Jobs' }
    ];

    return {
      roles,
      jobStatus,
      paymentStatus,
      applicationsStatus,
      insightCards
    };
  }, [stats, users, jobs, applications, payments, reviews]);

  const paymentChartData = useMemo(() => {
    if (paymentsOverview?.trendData?.length) {
      return { trendData: paymentsOverview.trendData };
    }

    const months = formatLastSixMonths();
    const volumeMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    months.forEach((month) => {
      volumeMap[month] = 0;
      countMap[month] = 0;
    });

    payments.forEach((payment) => {
      const createdAt = new Date(String(payment.createdAt || payment.createdAt));
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const monthKey = createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!volumeMap[monthKey]) return;
      volumeMap[monthKey] += num(payment.amount);
      countMap[monthKey] += 1;
    });

    const trendData: PaymentTrendDatum[] = months.map((month) => ({
      label: month,
      volume: volumeMap[month] || 0,
      transactions: countMap[month] || 0
    }));

    return { trendData };
  }, [payments, paymentsOverview?.trendData]);

  const paymentSummary = useMemo(() => {
    if (paymentsOverview?.summary) {
      const backendSummary = paymentsOverview.summary;
      return [
        { title: 'Total Volume', value: `${Number(backendSummary.totalVolume || 0).toLocaleString()} RWF` },
        { title: 'Transactions', value: String(backendSummary.transactions || 0) },
        { title: 'Successful', value: String(backendSummary.successful || 0) },
        { title: 'Pending', value: String(backendSummary.pending || 0) },
        { title: 'Failed', value: String(backendSummary.failed || 0) }
      ];
    }

    const totalVolume = payments.reduce((sum, item) => sum + num(item.amount), 0);
    const successfulPayments = payments.filter((item) => q(item.status) === 'successful').length;
    const pendingPayments = payments.filter((item) => q(item.status) === 'pending').length;
    const failedPayments = payments.filter((item) => q(item.status) === 'failed').length;
    return [
      { title: 'Total Volume', value: `${totalVolume.toLocaleString()} RWF` },
      { title: 'Transactions', value: String(payments.length) },
      { title: 'Successful', value: String(successfulPayments) },
      { title: 'Pending', value: String(pendingPayments) },
      { title: 'Failed', value: String(failedPayments) }
    ];
  }, [payments, paymentsOverview?.summary]);

  const updateUserDraft = useCallback(
    <K extends keyof AdminUserDraft>(key: K, value: AdminUserDraft[K]) => {
      setUserDraft((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const closeUserModal = useCallback(() => {
    if (userSaving) return;
    setUserModalVisible(false);
  }, [userSaving]);

  const openCreateUserModal = useCallback(() => {
    setUserCrudMode('create');
    setUserDraft(emptyUserDraft());
    setUserModalVisible(true);
  }, []);

  const openEditUserModal = useCallback((item: any) => {
    setUserCrudMode('edit');
    setUserDraft(draftFromUser(item));
    setUserModalVisible(true);
  }, []);

  const buildUserPayload = useCallback((draft: AdminUserDraft, mode: UserCrudMode) => {
    const payload: any = {
      role: draft.role,
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      phone: draft.phone.trim() || null,
      address: draft.address.trim() || null,
      description: draft.description.trim() || null,
      dob: draft.dob.trim() || null,
      gender: draft.gender.trim() || null,
      nidNumber: draft.nidNumber.trim() || null,
      maritalStatus: draft.maritalStatus.trim() || null,
      childrenCount: draft.childrenCount.trim() || null,
      country: draft.country.trim() || null,
      provinceDistrict: draft.provinceDistrict.trim() || null,
      sectorCellVillage: draft.sectorCellVillage.trim() || null,
      willingToRelocate: draft.willingToRelocate,
      yearsExperience: draft.yearsExperience.trim() || null,
      prevEmployer: draft.prevEmployer.trim() || null,
      prevEmployerContact: draft.prevEmployerContact.trim() || null,
      workTypes: draft.workTypes.split(',').map((item) => item.trim()).filter(Boolean),
      reasonForLeaving: draft.reasonForLeaving.trim() || null,
      highestEducation: draft.highestEducation.trim() || null,
      languages: draft.languages.trim() || null,
      specialSkills: draft.specialSkills.split(',').map((item) => item.trim()).filter(Boolean),
      drivingLicense: draft.drivingLicense,
      availabilityType: draft.availabilityType.trim() || null,
      startDate: draft.startDate.trim() || null,
      preferredHours: draft.preferredHours.trim() || null,
      expectedSalary: draft.expectedSalary.trim() || null,
      salaryNegotiable: draft.salaryNegotiable,
      emergencyName: draft.emergencyName.trim() || null,
      emergencyRelation: draft.emergencyRelation.trim() || null,
      emergencyPhone: draft.emergencyPhone.trim() || null
    };

    if (mode === 'create' || draft.password.trim()) {
      payload.password = draft.password.trim();
    }

    return payload;
  }, []);

  const submitUserModal = useCallback(async () => {
    const name = userDraft.fullName.trim();
    const email = userDraft.email.trim().toLowerCase();
    const password = userDraft.password.trim();

    if (!name) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }
    if (!emailPattern.test(email)) {
      Alert.alert('Validation', 'A valid email is required.');
      return;
    }
    if (userCrudMode === 'create' && password.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters for new users.');
      return;
    }
    if (userCrudMode === 'edit' && password && password.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters.');
      return;
    }

    setUserSaving(true);
    try {
      const payload = buildUserPayload({ ...userDraft, email, fullName: name }, userCrudMode);
      if (userCrudMode === 'create') {
        await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        if (!userDraft.id) {
          throw new Error('Missing user id for edit operation.');
        }
        await apiFetch(`/admin/users/${userDraft.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      setUserModalVisible(false);
      await loadAll(true);
      Alert.alert('Success', `User ${userCrudMode === 'create' ? 'created' : 'updated'} successfully.`);
    } catch (error: any) {
      Alert.alert('User Operation Failed', error?.message || 'Failed to save user.');
    } finally {
      setUserSaving(false);
    }
  }, [buildUserPayload, loadAll, userCrudMode, userDraft]);

  const runAction = useCallback(async (key: string, action: () => Promise<void>) => {
    setActing(key);
    try {
      await action();
      await loadAll(true);
    } catch (error: any) {
      Alert.alert('Action Failed', error?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  }, [loadAll]);

  const confirmDeleteUser = useCallback((item: any) => {
    Alert.alert(
      'Delete User',
      `Delete ${item?.fullName || item?.email || `User #${item?.id}`}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            runAction(`delete-user-${item.id}`, async () => {
              await apiFetch(`/admin/users/${item.id}`, { method: 'DELETE' });
            })
        }
      ]
    );
  }, [runAction]);

  const confirmDeleteJob = useCallback((item: any) => {
    Alert.alert(
      'Delete Job',
      `Delete "${item?.title || `Job #${item?.id}`}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            runAction(`delete-job-${item.id}`, async () => {
              await apiFetch(`/admin/jobs/${item.id}`, { method: 'DELETE' });
            })
        }
      ]
    );
  }, [runAction]);

  const confirmDeleteApplication = useCallback((item: any) => {
    Alert.alert(
      'Delete Application',
      `Delete application #${item?.id}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            runAction(`delete-application-${item.id}`, async () => {
              await apiFetch(`/admin/applications/${item.id}`, { method: 'DELETE' });
            })
        }
      ]
    );
  }, [runAction]);

  const confirmDeletePayment = useCallback((item: any) => {
    Alert.alert(
      'Delete Payment',
      `Delete payment "${item?.transactionId || `#${item?.id}`}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            runAction(`delete-payment-${item.id}`, async () => {
              await apiFetch(`/admin/payments/${item.id}`, { method: 'DELETE' });
            })
        }
      ]
    );
  }, [runAction]);

  const renderActionButtons = useCallback((item: any) => {
    const busy = Boolean(acting);
    const button = (label: string, endpoint: string, body: any, active: boolean) => (
      <TouchableOpacity
        key={`${endpoint}-${label}-${item.id}`}
        style={[styles.smallBtn, active && styles.smallBtnActive, (busy || active) && styles.smallBtnDisabled]}
        disabled={busy || active}
        onPress={() =>
          runAction(`${endpoint}-${label}-${item.id}`, async () => {
            await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
          })
        }
      >
        <Text style={styles.smallBtnText}>{label}</Text>
      </TouchableOpacity>
    );

    if (section === 'users') {
      return (
        <View style={styles.userActionsWrap}>
          <View style={styles.smallBtnRow}>
            {['ADMIN', 'EMPLOYER', 'MAID'].map((role) =>
              button(role, `/admin/users/${item.id}/role`, { role }, item.role === role)
            )}
          </View>
          <View style={styles.smallBtnRow}>
            <TouchableOpacity
              style={[styles.smallBtn, busy && styles.smallBtnDisabled]}
              disabled={busy}
              onPress={() => openEditUserModal(item)}
            >
              <Text style={styles.smallBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnDanger, busy && styles.smallBtnDisabled]}
              disabled={busy}
              onPress={() => confirmDeleteUser(item)}
            >
              <Text style={styles.smallBtnDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (section === 'jobs') {
      return (
        <View style={styles.userActionsWrap}>
          <View style={styles.smallBtnRow}>
            {['OPEN', 'CLOSED', 'FILLED'].map((status) =>
              button(status, `/admin/jobs/${item.id}/status`, { status }, item.status === status)
            )}
          </View>
          <View style={styles.smallBtnRow}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnDanger, busy && styles.smallBtnDisabled]}
              disabled={busy}
              onPress={() => confirmDeleteJob(item)}
            >
              <Text style={styles.smallBtnDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (section === 'applications') {
      return (
        <View style={styles.userActionsWrap}>
          <View style={styles.smallBtnRow}>
            {['INTERVIEW', 'ACCEPTED', 'REJECTED'].map((status) =>
              button(status, `/admin/applications/${item.id}/status`, { status }, item.status === status)
            )}
          </View>
          <View style={styles.smallBtnRow}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnDanger, busy && styles.smallBtnDisabled]}
              disabled={busy}
              onPress={() => confirmDeleteApplication(item)}
            >
              <Text style={styles.smallBtnDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (section === 'payments') {
      return (
        <View style={styles.smallBtnRow}>
          <TouchableOpacity
            style={[styles.smallBtn, styles.smallBtnDanger, busy && styles.smallBtnDisabled]}
            disabled={busy}
            onPress={() => confirmDeletePayment(item)}
          >
            <Text style={styles.smallBtnDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }, [acting, confirmDeleteApplication, confirmDeleteJob, confirmDeletePayment, confirmDeleteUser, openEditUserModal, runAction, section]);

  const cellText = useCallback((value: unknown, lines = 1) => {
    const text = String(value ?? '').trim();
    return <Text numberOfLines={lines} style={styles.tableText}>{text || '-'}</Text>;
  }, []);

  const columns = useMemo<TableColumn[]>(() => {
    if (section === 'users') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'name', label: 'Full Name', width: 180, render: (item) => cellText(item.fullName) },
        { key: 'email', label: 'Email', width: 220, render: (item) => cellText(item.email) },
        { key: 'phone', label: 'Phone', width: 140, render: (item) => cellText(item.phone) },
        { key: 'role', label: 'Role', width: 120, render: (item) => <Pill value={item.role} /> },
        { key: 'jobs', label: 'Jobs', width: 80, render: (item) => cellText(item?._count?.jobs || 0) },
        { key: 'apps', label: 'Applications', width: 100, render: (item) => cellText(item?._count?.applications || 0) },
        { key: 'createdAt', label: 'Joined', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 390, render: (item) => renderActionButtons(item) }
      ];
    }
    if (section === 'jobs') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'title', label: 'Title', width: 240, render: (item) => cellText(item.title) },
        { key: 'employer', label: 'Employer', width: 180, render: (item) => cellText(item?.employer?.fullName) },
        { key: 'location', label: 'Location', width: 160, render: (item) => cellText(item.location) },
        { key: 'salary', label: 'Salary', width: 130, render: (item) => cellText(money(item.salary, item.currency)) },
        { key: 'status', label: 'Status', width: 120, render: (item) => <Pill value={item.status} /> },
        { key: 'applicants', label: 'Applicants', width: 90, render: (item) => cellText(item?._count?.applications || 0) },
        { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 330, render: (item) => renderActionButtons(item) }
      ];
    }
    if (section === 'applications') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'job', label: 'Job', width: 220, render: (item) => cellText(item?.job?.title) },
        { key: 'maid', label: 'Applicant', width: 180, render: (item) => cellText(item?.maid?.fullName) },
        { key: 'maidEmail', label: 'Applicant Email', width: 230, render: (item) => cellText(item?.maid?.email) },
        { key: 'employer', label: 'Employer', width: 180, render: (item) => cellText(item?.job?.employer?.fullName) },
        { key: 'status', label: 'Status', width: 120, render: (item) => <Pill value={item.status} /> },
        { key: 'createdAt', label: 'Submitted', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 320, render: (item) => renderActionButtons(item) }
      ];
    }
    if (section === 'payments') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'tx', label: 'Transaction', width: 240, render: (item) => cellText(item.transactionId) },
        { key: 'payer', label: 'Payer', width: 180, render: (item) => cellText(item?.employer?.fullName) },
        { key: 'type', label: 'Type', width: 120, render: (item) => cellText(item.type) },
        { key: 'amount', label: 'Amount', width: 130, render: (item) => cellText(money(item.amount, item.currency)) },
        { key: 'status', label: 'Status', width: 120, render: (item) => <Pill value={item.status} /> },
        { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 150, render: (item) => renderActionButtons(item) }
      ];
    }

    return [
      { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
      { key: 'contract', label: 'Contract', width: 180, render: (item) => cellText(item?.contract?.title) },
      { key: 'reviewer', label: 'Reviewer', width: 180, render: (item) => cellText(item?.reviewer?.fullName) },
      { key: 'reviewee', label: 'Reviewee', width: 180, render: (item) => cellText(item?.reviewee?.fullName) },
      { key: 'rating', label: 'Rating', width: 100, render: (item) => cellText(`${item.rating || '-'} / 5`) },
      { key: 'comment', label: 'Comment', width: 300, render: (item) => cellText(item.comment, 2) },
      { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) }
    ];
  }, [section, cellText, renderActionButtons]);

  const tableWidth = useMemo(() => columns.reduce((sum, column) => sum + column.width, 0), [columns]);

  const filterGroups = useMemo<FilterGroupDef[]>(() => {
    if (section === 'users') return [{ key: 'usersRole', label: 'Role', options: ['ALL', 'ADMIN', 'EMPLOYER', 'MAID'] }];
    if (section === 'jobs') return [{ key: 'jobsStatus', label: 'Status', options: ['ALL', 'OPEN', 'FILLED', 'CLOSED'] }];
    if (section === 'applications') return [{ key: 'applicationsStatus', label: 'Status', options: ['ALL', 'PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED'] }];
    if (section === 'payments') return [
      { key: 'paymentsStatus', label: 'Status', options: ['ALL', 'SUCCESSFUL', 'PENDING', 'FAILED', 'CANCELLED'] },
      { key: 'paymentsType', label: 'Type', options: ['ALL', 'DEPOSIT', 'PAYOUT', 'REFUND'] }
    ];
    if (section === 'reviews') return [{ key: 'reviewsRating', label: 'Rating', options: ['ALL', '5', '4', '3', '2', '1'] }];
    return [];
  }, [section]);

  const setFilter = (key: keyof FilterState, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const openSection = useCallback((next: FocusSection) => {
    setSection(next);
  }, []);

  const sidebarItems = useMemo<AdminSidebarItem[]>(
    () => NAV.map((item) => ({ key: item.key, label: item.label, icon: item.icon })),
    []
  );

  const overviewMetricCards = useMemo(() => {
    const isDark = colorScheme === 'dark';

    return [
      {
        label: 'Users',
        value: String(stats.usersCount || 0),
        helper: `${stats.adminsCount || 0} admins`,
        icon: 'people-outline' as const,
        section: 'users' as const,
        tone: {
          surface: isDark ? '#1F2A44' : '#E8F7EE',
          border: isDark ? '#1F8F6A' : '#AFEAC8',
          accent: '#10B981',
          icon: isDark ? '#6EE7B7' : '#047857',
          label: isDark ? '#D1FAE5' : '#065F46',
          value: isDark ? '#ECFDF5' : '#064E3B',
          helper: isDark ? '#9FE5CB' : '#0F766E'
        }
      },
      {
        label: 'Jobs',
        value: String(stats.jobsCount || 0),
        helper: `${stats.openJobsCount || 0} open`,
        icon: 'briefcase-outline' as const,
        section: 'jobs' as const,
        tone: {
          surface: isDark ? '#2F223F' : '#F8ECFF',
          border: isDark ? '#8B5CF6' : '#D8B4FE',
          accent: '#A855F7',
          icon: isDark ? '#D8B4FE' : '#6B21A8',
          label: isDark ? '#E9D5FF' : '#6B21A8',
          value: isDark ? '#F5E8FF' : '#581C87',
          helper: isDark ? '#D9BDFB' : '#7E22CE'
        }
      },
      {
        label: 'Payments',
        value: String(stats.paymentsCount || 0),
        helper: `${stats.successfulPaymentsCount || 0} successful`,
        icon: 'card-outline' as const,
        section: 'payments' as const,
        tone: {
          surface: isDark ? '#1E2D46' : '#EAF2FF',
          border: isDark ? '#3B82F6' : '#A9C8FF',
          accent: '#2563EB',
          icon: isDark ? '#93C5FD' : '#1E40AF',
          label: isDark ? '#DBEAFE' : '#1E3A8A',
          value: isDark ? '#EFF6FF' : '#1E3A8A',
          helper: isDark ? '#BFD7FF' : '#1D4ED8'
        }
      },
      {
        label: 'Volume',
        value: String(stats.paymentVolume || 0),
        helper: 'Total processed value',
        icon: 'cash-outline' as const,
        section: 'payments' as const,
        tone: {
          surface: isDark ? '#3B241D' : '#FFF2E8',
          border: isDark ? '#F59E0B' : '#F9CDA5',
          accent: '#F97316',
          icon: isDark ? '#FCD08E' : '#9A3412',
          label: isDark ? '#FDE68A' : '#9A3412',
          value: isDark ? '#FEF3C7' : '#7C2D12',
          helper: isDark ? '#FFD89B' : '#C2410C'
        }
      }
    ];
  }, [colorScheme, stats.adminsCount, stats.jobsCount, stats.openJobsCount, stats.paymentVolume, stats.paymentsCount, stats.successfulPaymentsCount, stats.usersCount]);

  const insightToneBySection = useMemo(() => {
    const isDark = colorScheme === 'dark';
    return {
      users: { surface: isDark ? '#192742' : '#EAF2FF', border: isDark ? '#2E5DAA' : '#BFD6FF', text: isDark ? '#DBEAFE' : '#1E3A8A', chipBg: isDark ? '#1F4A94' : '#DCEAFF', chipText: isDark ? '#CFE2FF' : '#1D4ED8' },
      jobs: { surface: isDark ? '#2F223F' : '#F8ECFF', border: isDark ? '#8B5CF6' : '#D8B4FE', text: isDark ? '#E9D5FF' : '#6B21A8', chipBg: isDark ? '#6938B5' : '#F0DDFF', chipText: isDark ? '#E9D5FF' : '#7E22CE' },
      applications: { surface: isDark ? '#213042' : '#E9F5FF', border: isDark ? '#0EA5E9' : '#B2E4FF', text: isDark ? '#D0F0FF' : '#0C4A6E', chipBg: isDark ? '#0F6FA0' : '#D4EEFF', chipText: isDark ? '#C5EBFF' : '#0369A1' },
      payments: { surface: isDark ? '#1E2D46' : '#EAF2FF', border: isDark ? '#3B82F6' : '#A9C8FF', text: isDark ? '#DBEAFE' : '#1E3A8A', chipBg: isDark ? '#244C91' : '#DCE8FF', chipText: isDark ? '#C6DBFF' : '#1D4ED8' },
      reviews: { surface: isDark ? '#3B241D' : '#FFF2E8', border: isDark ? '#F59E0B' : '#F9CDA5', text: isDark ? '#FDE68A' : '#9A3412', chipBg: isDark ? '#915A1E' : '#FFE1C8', chipText: isDark ? '#FED7AA' : '#C2410C' }
    } as Record<FocusSection, { surface: string; border: string; text: string; chipBg: string; chipText: string }>;
  }, [colorScheme]);

  const dashboardShellTone = useMemo(() => ({
    page: colorScheme === 'dark' ? '#091528' : '#F2F7FF',
    sidebar: colorScheme === 'dark' ? '#102846' : '#0E4C84',
    sidebarBorder: colorScheme === 'dark' ? '#1E436E' : '#1762A1',
    sidebarText: '#FFFFFF',
    sidebarMuted: colorScheme === 'dark' ? '#BFD8FF' : '#D8E9FF',
    sidebarDivider: colorScheme === 'dark' ? '#2A4A78' : '#3E79AF'
  }), [colorScheme]);

  const renderUserInput = (
    label: string,
    key: keyof AdminUserDraft,
    options?: { placeholder?: string; multiline?: boolean; secure?: boolean; keyboard?: 'default' | 'numeric' | 'email-address' | 'phone-pad' }
  ) => (
    <View style={styles.userField}>
      <Text style={styles.userFieldLabel}>{label}</Text>
      <TextInput
        value={String(userDraft[key] ?? '')}
        onChangeText={(text) => updateUserDraft(key as any, text as any)}
        placeholder={options?.placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={options?.secure}
        keyboardType={options?.keyboard || 'default'}
        multiline={options?.multiline}
        style={[
          styles.userInput,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          options?.multiline && styles.userInputMulti
        ]}
      />
    </View>
  );

  const leave = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (profileLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!profile || profile.role !== 'ADMIN') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.guardTitle, { color: theme.text }]}>Admin Access Required</Text>
        <Text style={[styles.guardBody, { color: theme.textSecondary }]}>Login with an ADMIN account to access this dashboard.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.primaryBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: dashboardShellTone.page }]}>
      <View style={[styles.shell, desktop && styles.shellDesktop]}>
        {desktop && (
          <AdminSidebar
            brand="MaidConnect"
            subtitle="Admin Command Center"
            items={sidebarItems}
            activeKey={section}
            onSelect={(key) => setSection(key as Section)}
            onLogout={leave}
          />
        )}

        <View style={[styles.main, desktop && styles.mainDesktop]}>
          <View style={[styles.top, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <View style={{ flex: 1, minWidth: 220 }}>
              <Text style={[styles.topTitle, { color: theme.text }]}>Platform Administration</Text>
              <Text style={[styles.topSub, { color: theme.textSecondary }]}>Monitor all activities, filter data, and manage every feature from one dashboard.</Text>
              <Text style={[styles.topSub, { color: theme.textSecondary }]}>Last refresh: {updatedAt ? fmtDate(updatedAt.toISOString()) : 'Not loaded yet'}</Text>
            </View>

            {section !== 'overview' && (
              <View style={[styles.searchWrap, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <Ionicons name="search-outline" size={15} color={theme.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`Search ${section}...`}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.search, { color: theme.text }]}
                />
              </View>
            )}

            <TouchableOpacity style={[styles.refresh, { backgroundColor: theme.primary }]} onPress={() => loadAll(true)} disabled={refreshing}>
              <Ionicons name="refresh-outline" size={14} color="#fff" />
              <Text style={styles.refreshText}>{refreshing ? 'Refreshing' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {!desktop && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
              {NAV.map((item) => (
                <NavButton
                  key={item.key}
                  compact
                  active={section === item.key}
                  onPress={() => setSection(item.key)}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
              <TouchableOpacity style={[styles.mobileOut, { borderColor: theme.border }]} onPress={leave}>
                <Text style={[styles.mobileOutText, { color: theme.textSecondary }]}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {Platform.OS !== 'web' && (
            <Text style={[styles.note, { color: theme.textSecondary }]}>This dashboard is optimized for web browser view.</Text>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 30 }}>
              {section === 'overview' ? (
                <>
                  <View style={styles.metricsGrid}>
                    {overviewMetricCards.map((card) => (
                      <Metric
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        helper={card.helper}
                        icon={card.icon}
                        tone={card.tone}
                        onPress={() => openSection(card.section)}
                      />
                    ))}
                  </View>

                  <View style={styles.insightGrid}>
                    {analytics.insightCards.map((item) => (
                      <TouchableOpacity
                        key={item.title}
                        onPress={() => openSection(item.section)}
                        activeOpacity={0.9}
                        style={[
                          styles.insightCard,
                          {
                            backgroundColor: insightToneBySection[item.section].surface,
                            borderColor: insightToneBySection[item.section].border
                          }
                        ]}
                      >
                        <Text style={[styles.insightTitle, { color: insightToneBySection[item.section].text }]}>{item.title}</Text>
                        <Text style={[styles.insightValue, { color: insightToneBySection[item.section].text }]}>{item.value}</Text>
                        <View style={[styles.insightChip, { backgroundColor: insightToneBySection[item.section].chipBg }]}>
                          <Text style={[styles.insightChipText, { color: insightToneBySection[item.section].chipText }]}>
                            Open {item.chip}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <AdminOverviewCharts
                    roles={analytics.roles}
                    jobs={analytics.jobStatus}
                    payments={analytics.paymentStatus}
                    applications={analytics.applicationsStatus}
                    isDark={colorScheme === 'dark'}
                  />

                  <View style={styles.panelGrid}>
                    <View style={styles.panel}>
                      <Text style={styles.panelTitle}>Recent Activity</Text>
                      {(overview?.recentActivity || []).slice(0, 16).map((item: any) => (
                        <View key={item.id} style={styles.activity}>
                          <View style={styles.dot} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.activityTitle}>{item.title}</Text>
                            <Text style={styles.activitySub}>{item.subtitle}</Text>
                            <Text style={styles.activitySub}>{fmtDate(item.createdAt)}</Text>
                          </View>
                          <Pill value={item.status || item.type} />
                        </View>
                      ))}
                    </View>

                    <View style={styles.panel}>
                      <Text style={styles.panelTitle}>System Snapshot</Text>
                      {Object.entries(stats).map(([key, value]) => (
                        <View key={key} style={styles.snap}>
                          <Text style={styles.snapKey}>{pretty(key)}</Text>
                          <Text style={styles.snapVal}>{String(value)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ gap: 10 }}>
                  <View style={styles.sectionTop}>
                    <Text style={styles.sectionTitle}>{NAV.find((item) => item.key === section)?.label}</Text>
                    <View style={styles.sectionTopActions}>
                      <Text style={styles.sectionCount}>{filteredRows.length} records</Text>
                      {section === 'users' && (
                        <TouchableOpacity style={styles.sectionAddBtn} onPress={openCreateUserModal}>
                          <Ionicons name="add-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.sectionAddBtnText}>Add User</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                      {section === 'payments' && (
                    <>
                      <View style={styles.sectionStatsRow}>
                        <View style={styles.summaryGrid}>
                          {paymentSummary.map((item) => (
                            <SummaryCard key={item.title} title={item.title} value={item.value} />
                          ))}
                        </View>
                      </View>

                      <AdminPaymentsCharts
                        trendData={paymentChartData.trendData}
                        statusData={analytics.paymentStatus}
                        isDark={colorScheme === 'dark'}
                      />
                    </>
                  )}

                  <View style={styles.filterPanel}>
                    {filterGroups.map((group) => (
                      <FilterGroup
                        key={group.key}
                        label={group.label}
                        options={group.options}
                        value={filters[group.key]}
                        onSelect={(next) => setFilter(group.key, next)}
                      />
                    ))}
                  </View>

                  <View style={styles.tableCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View style={{ minWidth: tableWidth }}>
                        <View style={styles.tableHeader}>
                          {columns.map((column) => (
                            <View key={column.key} style={[styles.th, { width: column.width }]}>
                              <Text style={styles.thText}>{column.label}</Text>
                            </View>
                          ))}
                        </View>

                        {filteredRows.length === 0 ? (
                          <View style={[styles.emptyTableRow, { width: tableWidth }]}>
                            <Text style={styles.emptyText}>No records matched your search and filters.</Text>
                          </View>
                        ) : (
                          filteredRows.map((item, index) => (
                            <View
                              key={`${section}-${item.id}-${index}`}
                              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                            >
                              {columns.map((column) => (
                                <View key={`${column.key}-${item.id}`} style={[styles.td, { width: column.width }]}>
                                  {column.render(item)}
                                </View>
                              ))}
                            </View>
                          ))
                        )}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <Modal visible={userModalVisible} transparent animationType="fade" onRequestClose={closeUserModal}>
        <View style={styles.userModalOverlay}>
          <ScrollView
            style={styles.userModalViewport}
            contentContainerStyle={styles.userModalViewportContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.userModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.userModalHeader, { borderColor: theme.border }]}>
                <View>
                  <Text style={[styles.userModalTitle, { color: theme.text }]}>
                    {userCrudMode === 'create' ? 'Add User' : 'Edit User'}
                  </Text>
                  <Text style={[styles.userModalSubtitle, { color: theme.textSecondary }]}>
                    Configure account details and role-specific fields.
                  </Text>
                </View>
                <TouchableOpacity onPress={closeUserModal} disabled={userSaving} style={styles.userCloseBtn}>
                  <Ionicons name="close-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.userModalScroll} contentContainerStyle={styles.userModalBody}>
              <View style={styles.userField}>
                <Text style={styles.userFieldLabel}>Role</Text>
                <View style={styles.userRoleRow}>
                  {USER_ROLES.map((roleOption) => (
                    <TouchableOpacity
                      key={roleOption}
                      onPress={() => updateUserDraft('role', roleOption)}
                      style={[styles.userRoleChip, userDraft.role === roleOption && styles.userRoleChipActive]}
                    >
                      <Text style={[styles.userRoleChipText, userDraft.role === roleOption && styles.userRoleChipTextActive]}>
                        {roleOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderUserInput('Full Name *', 'fullName', { placeholder: 'Enter full name' })}
              {renderUserInput('Email *', 'email', { placeholder: 'user@example.com', keyboard: 'email-address' })}
              {renderUserInput('Phone', 'phone', { placeholder: '+2507...' , keyboard: 'phone-pad' })}
              {renderUserInput('Address', 'address', { placeholder: 'Current address' })}
              {renderUserInput('Description / Bio', 'description', { placeholder: 'Short profile summary', multiline: true })}
              {renderUserInput(
                userCrudMode === 'create' ? 'Password *' : 'Password (leave blank to keep current)',
                'password',
                { placeholder: userCrudMode === 'create' ? 'Create password' : 'Enter new password', secure: true }
              )}

              {userDraft.role === 'MAID' && (
                <>
                  <Text style={[styles.userSectionTitle, { color: theme.text }]}>Maid Profile Fields</Text>
                  {renderUserInput('Date of Birth', 'dob', { placeholder: 'YYYY-MM-DD' })}
                  {renderUserInput('Gender', 'gender', { placeholder: 'Female / Male / Other' })}
                  {renderUserInput('National ID Number', 'nidNumber')}
                  {renderUserInput('Marital Status', 'maritalStatus')}
                  {renderUserInput('Children Count', 'childrenCount', { keyboard: 'numeric' })}
                  {renderUserInput('Country', 'country')}
                  {renderUserInput('Province / District', 'provinceDistrict')}
                  {renderUserInput('Sector / Cell / Village', 'sectorCellVillage')}
                  {renderUserInput('Years Experience', 'yearsExperience', { keyboard: 'numeric' })}
                  {renderUserInput('Previous Employer', 'prevEmployer')}
                  {renderUserInput('Previous Employer Contact', 'prevEmployerContact', { keyboard: 'phone-pad' })}
                  {renderUserInput('Work Types (comma-separated)', 'workTypes', { placeholder: 'Cleaning, Cooking' })}
                  {renderUserInput('Reason For Leaving', 'reasonForLeaving', { multiline: true })}
                  {renderUserInput('Highest Education', 'highestEducation')}
                  {renderUserInput('Languages', 'languages')}
                  {renderUserInput('Special Skills (comma-separated)', 'specialSkills', { placeholder: 'First Aid, Child Care' })}
                  {renderUserInput('Availability Type', 'availabilityType', { placeholder: 'Full-Time / Part-Time / Live-in' })}
                  {renderUserInput('Start Date', 'startDate', { placeholder: 'YYYY-MM-DD' })}
                  {renderUserInput('Preferred Hours', 'preferredHours', { placeholder: '08:00 - 17:00' })}
                  {renderUserInput('Expected Salary', 'expectedSalary', { keyboard: 'numeric' })}
                  {renderUserInput('Emergency Contact Name', 'emergencyName')}
                  {renderUserInput('Emergency Relation', 'emergencyRelation')}
                  {renderUserInput('Emergency Phone', 'emergencyPhone', { keyboard: 'phone-pad' })}

                  <View style={styles.userSwitchRow}>
                    <Text style={styles.userFieldLabel}>Willing to Relocate</Text>
                    <Switch value={userDraft.willingToRelocate} onValueChange={(next) => updateUserDraft('willingToRelocate', next)} />
                  </View>
                  <View style={styles.userSwitchRow}>
                    <Text style={styles.userFieldLabel}>Driving License</Text>
                    <Switch value={userDraft.drivingLicense} onValueChange={(next) => updateUserDraft('drivingLicense', next)} />
                  </View>
                  <View style={styles.userSwitchRow}>
                    <Text style={styles.userFieldLabel}>Salary Negotiable</Text>
                    <Switch value={userDraft.salaryNegotiable} onValueChange={(next) => updateUserDraft('salaryNegotiable', next)} />
                  </View>
                </>
              )}
              </ScrollView>

              <View style={[styles.userModalFooter, { borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.userCancelBtn, { borderColor: theme.border }]}
                  onPress={closeUserModal}
                  disabled={userSaving}
                >
                  <Text style={[styles.userCancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.userSaveBtn, userSaving && styles.userSaveBtnDisabled]}
                  onPress={submitUserModal}
                  disabled={userSaving}
                >
                  <Text style={styles.userSaveBtnText}>{userSaving ? 'Saving...' : userCrudMode === 'create' ? 'Create User' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  shell: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
  shellDesktop: { gap: 18, paddingHorizontal: 20, paddingVertical: 16 },
  sidebar: { width: 275, borderWidth: 1, borderRadius: 16, padding: 16, backgroundColor: '#1D4ED8', borderColor: '#2563EB' },
  brand: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  brandSub: { marginTop: 4, fontSize: 12, color: '#DBEAFE' },
  navCol: { marginTop: 18, gap: 8, flex: 1 },
  navButton: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  navButtonCompact: { minWidth: 130 },
  navButtonActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  navText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  navTextActive: { color: '#FFFFFF' },
  logout: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#CBD5E1' },
  main: { flex: 1 },
  mainDesktop: { paddingRight: 10 },
  top: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },
  topTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  topSub: { marginTop: 3, fontSize: 11, color: '#334155' },
  searchWrap: {
    height: 42,
    minWidth: 240,
    maxWidth: 360,
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  search: { flex: 1, fontSize: 13 },
  refresh: {
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  refreshText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  navRow: { marginTop: 10, gap: 8, paddingRight: 12 },
  mobileOut: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  mobileOutText: { fontSize: 12, fontWeight: '700' },
  note: { marginTop: 8, marginLeft: 2, fontSize: 11 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricTap: { minWidth: 220, flex: 1 },
  metricCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    overflow: 'hidden'
  },
  metricAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7
  },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  metricValue: { marginTop: 9, fontSize: 24, fontWeight: '800', color: '#0F172A' },
  metricHelp: { marginTop: 3, fontSize: 11, color: '#64748B' },
  metricHint: { marginTop: 10, fontSize: 11, fontWeight: '700' },
  insightGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insightCard: {
    minWidth: 220,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 12
  },
  insightTitle: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  insightValue: { marginTop: 6, fontSize: 18, color: '#0F172A', fontWeight: '800' },
  insightChip: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  insightChipText: { fontSize: 10, fontWeight: '700' },
  analyticsGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  analyticsCard: {
    minWidth: 260,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 13
  },
  analyticsTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  analyticsRow: { marginBottom: 8 },
  analyticsHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  analyticsLabel: { fontSize: 11, color: '#475569', fontWeight: '600' },
  analyticsValue: { fontSize: 11, color: '#0F172A', fontWeight: '800' },
  analyticsTrack: { height: 8, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  analyticsFill: { height: '100%', borderRadius: 999 },
  panelGrid: { marginTop: 10, flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  panel: {
    minWidth: 300,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 13
  },
  panelTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  activity: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5EAF5',
    paddingVertical: 8,
    alignItems: 'flex-start'
  },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#60A5FA', marginTop: 6 },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  activitySub: { marginTop: 2, fontSize: 11, color: '#64748B' },
  snap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5EAF5',
    gap: 8
  },
  snapKey: { flex: 1, fontSize: 12, color: '#475569' },
  snapVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  sectionTop: {
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTopActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionCount: { fontSize: 12, color: '#64748B' },
  sectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D4ED8',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  sectionAddBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  filterPanel: {
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10
  },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF'
  },
  filterChipActive: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  filterChipText: { fontSize: 11, color: '#1D4ED8', fontWeight: '700' },
  filterChipTextActive: { color: '#1E3A8A' },
  tableCard: {
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E4F8',
    backgroundColor: '#F8FAFF'
  },
  th: { paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center' },
  thText: { fontSize: 11, fontWeight: '800', color: '#334155', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEF2FF' },
  tableRowAlt: { backgroundColor: '#FCFDFF' },
  td: { paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center' },
  tableText: { fontSize: 12, color: '#1E293B' },
  emptyTableRow: { padding: 14 },
  userActionsWrap: { gap: 6 },
  smallBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallBtn: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  smallBtnActive: { borderColor: '#93C5FD', backgroundColor: '#DBEAFE' },
  smallBtnDanger: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  smallBtnDisabled: { opacity: 0.45 },
  smallBtnText: { fontSize: 10, fontWeight: '800', color: '#1D4ED8' },
  smallBtnDangerText: { fontSize: 10, fontWeight: '800', color: '#B91C1C' },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800', color: '#0F172A' },
  pillInfo: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  pillSuccess: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  pillWarn: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  pillDanger: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  emptyText: { color: '#64748B', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guardTitle: { fontSize: 22, fontWeight: '800' },
  guardBody: { marginTop: 8, marginBottom: 16, fontSize: 14 },
  primaryBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#1D4ED8' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  chartGrid: { marginTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chartCard: {
    minWidth: 260,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14
  },
  chartCanvas: {
    borderRadius: 12,
    marginTop: 6
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F8FAFF', borderRadius: 999, borderWidth: 1, borderColor: '#D8E4F8' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  summaryGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { minWidth: 150, flex: 1, borderWidth: 1, borderColor: '#D8E4F8', borderRadius: 14, backgroundColor: '#F8FAFF', padding: 12 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#475569' },
  summaryValue: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionStatsRow: { marginTop: 14, gap: 10, flexDirection: 'column' },
  userModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    padding: 18
  },
  userModalViewport: { width: '100%' },
  userModalViewportContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8
  },
  userModalCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '94%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  userModalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  userModalTitle: { fontSize: 16, fontWeight: '800' },
  userModalSubtitle: { fontSize: 11, marginTop: 2 },
  userCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF'
  },
  userModalScroll: { flex: 1 },
  userModalBody: { padding: 14, gap: 10 },
  userSectionTitle: { marginTop: 6, fontSize: 13, fontWeight: '800' },
  userField: { gap: 6 },
  userFieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  userInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13
  },
  userInputMulti: { minHeight: 72, textAlignVertical: 'top' },
  userRoleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  userRoleChip: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF'
  },
  userRoleChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  userRoleChipText: { fontSize: 11, fontWeight: '700', color: '#1E3A8A' },
  userRoleChipTextActive: { color: '#FFFFFF' },
  userSwitchRow: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D8E4F8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userModalFooter: {
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  userCancelBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  userCancelBtnText: { fontSize: 12, fontWeight: '700' },
  userSaveBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#1D4ED8'
  },
  userSaveBtnDisabled: { opacity: 0.55 },
  userSaveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});
