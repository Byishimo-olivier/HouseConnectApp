import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { apiFetch } from '@/utils/api';

type Section = 'overview' | 'users' | 'jobs' | 'applications' | 'contracts' | 'payments' | 'disputes' | 'reviews';
type ListRes<T> = { items: T[]; pagination: { total: number; page: number; limit: number; totalPages: number } };

type FilterState = {
  usersRole: string;
  jobsStatus: string;
  applicationsStatus: string;
  contractsStatus: string;
  paymentsStatus: string;
  paymentsType: string;
  disputesStatus: string;
  reviewsRating: string;
};

type FilterGroupDef = { key: keyof FilterState; label: string; options: string[] };
type TableColumn = { key: string; label: string; width: number; render: (item: any) => React.ReactNode };
type AnalyticsItem = { label: string; value: number; color: string };

const NAV: Array<{ key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
  { key: 'applications', label: 'Applications', icon: 'reader-outline' },
  { key: 'contracts', label: 'Contracts', icon: 'document-text-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
  { key: 'disputes', label: 'Disputes', icon: 'warning-outline' },
  { key: 'reviews', label: 'Reviews', icon: 'star-outline' }
];

const INITIAL_FILTERS: FilterState = {
  usersRole: 'ALL',
  jobsStatus: 'ALL',
  applicationsStatus: 'ALL',
  contractsStatus: 'ALL',
  paymentsStatus: 'ALL',
  paymentsType: 'ALL',
  disputesStatus: 'ALL',
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
  icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Ionicons name={icon} size={14} color="#1E3A8A" />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelp}>{helper}</Text>
    </View>
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

function AnalyticsBars({ title, items }: { title: string; items: AnalyticsItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsTitle}>{title}</Text>
      {items.map((item) => {
        const widthPct = Math.round((item.value / max) * 100);
        return (
          <View key={`${title}-${item.label}`} style={styles.analyticsRow}>
            <View style={styles.analyticsHead}>
              <Text style={styles.analyticsLabel}>{item.label}</Text>
              <Text style={styles.analyticsValue}>{item.value}</Text>
            </View>
            <View style={styles.analyticsTrack}>
              <View style={[styles.analyticsFill, { width: `${widthPct}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BarChart({ title, data }: { title: string; data: AnalyticsItem[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.barChart}>
        {data.map((item) => {
          const height = Math.max(18, Math.round((item.value / max) * 120));
          return (
            <View key={item.label} style={styles.barChartColumn}>
              <View style={[styles.barChartBar, { height, backgroundColor: item.color }]} />
              <Text style={styles.chartLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LineChart({ title, data }: { title: string; data: AnalyticsItem[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineChartContainer}>
        <View style={styles.lineChartAxis} />
        <View style={styles.lineChartPoints}>
          {data.map((item, index) => {
            const pos = Math.round((1 - item.value / max) * 100);
            return (
              <View key={item.label} style={styles.lineChartPointColumn}>
                <View style={[styles.lineChartPoint, { bottom: `${pos}%`, backgroundColor: item.color }]} />
                <Text style={styles.chartLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ChartLegend({ items }: { items: AnalyticsItem[] }) {
  return (
    <View style={styles.legendRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
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
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const loadAll = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [o, u, j, a, c, p, d, r] = await Promise.all([
        apiFetch('/admin/overview'),
        apiFetch('/admin/users?limit=100'),
        apiFetch('/admin/jobs?limit=100'),
        apiFetch('/admin/applications?limit=100'),
        apiFetch('/admin/contracts?limit=100'),
        apiFetch('/admin/payments?limit=100'),
        apiFetch('/admin/disputes?limit=100'),
        apiFetch('/admin/reviews?limit=100')
      ]) as [any, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>, ListRes<any>];

      setOverview(o);
      setUsers(u.items || []);
      setJobs(j.items || []);
      setApplications(a.items || []);
      setContracts(c.items || []);
      setPayments(p.items || []);
      setDisputes(d.items || []);
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
    () => ({ users, jobs, applications, contracts, payments, disputes, reviews }),
    [users, jobs, applications, contracts, payments, disputes, reviews]
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
    if (section === 'contracts' && filters.contractsStatus !== 'ALL') {
      list = list.filter((item) => q(item.status) === q(filters.contractsStatus));
    }
    if (section === 'payments') {
      if (filters.paymentsStatus !== 'ALL') {
        list = list.filter((item) => q(item.status) === q(filters.paymentsStatus));
      }
      if (filters.paymentsType !== 'ALL') {
        list = list.filter((item) => q(item.type) === q(filters.paymentsType));
      }
    }
    if (section === 'disputes' && filters.disputesStatus !== 'ALL') {
      list = list.filter((item) => q(item.status) === q(filters.disputesStatus));
    }
    if (section === 'reviews' && filters.reviewsRating !== 'ALL') {
      list = list.filter((item) => String(Math.round(Number(item.rating || 0))) === filters.reviewsRating);
    }

    return list;
  }, [section, dataBySection, search, filters]);

  const stats = overview?.stats || {};

  const analytics = useMemo(() => {
    const roles: AnalyticsItem[] = [
      { label: 'Admins', value: num(stats.adminsCount) || users.filter((u) => u.role === 'ADMIN').length, color: '#2563EB' },
      { label: 'Employers', value: num(stats.employersCount) || users.filter((u) => u.role === 'EMPLOYER').length, color: '#0EA5E9' },
      { label: 'Maids', value: num(stats.maidsCount) || users.filter((u) => u.role === 'MAID').length, color: '#10B981' }
    ];

    const jobStatus: AnalyticsItem[] = [
      { label: 'Open', value: jobs.filter((item) => item.status === 'OPEN').length, color: '#16A34A' },
      { label: 'Filled', value: jobs.filter((item) => item.status === 'FILLED').length, color: '#0EA5E9' },
      { label: 'Closed', value: jobs.filter((item) => item.status === 'CLOSED').length, color: '#64748B' }
    ];

    const paymentStatus: AnalyticsItem[] = [
      { label: 'Successful', value: payments.filter((item) => q(item.status) === 'successful').length, color: '#16A34A' },
      { label: 'Pending', value: payments.filter((item) => q(item.status) === 'pending').length, color: '#F59E0B' },
      { label: 'Failed', value: payments.filter((item) => q(item.status) === 'failed').length, color: '#DC2626' }
    ];

    const applicationsStatus: AnalyticsItem[] = [
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

    const insightCards = [
      { title: 'Application Approval Rate', value: `${Math.round((acceptedApplications / Math.max(totalApplications, 1)) * 100)}%` },
      { title: 'Payment Success Rate', value: `${Math.round((successfulPayments / Math.max(totalPayments, 1)) * 100)}%` },
      { title: 'Average Review Rating', value: `${avgRating} / 5` },
      { title: 'Open Disputes', value: String(num(stats.openDisputesCount) || disputes.filter((item) => item.status === 'OPEN').length) }
    ];

    return {
      roles,
      jobStatus,
      paymentStatus,
      applicationsStatus,
      insightCards
    };
  }, [stats, users, jobs, applications, payments, disputes, reviews]);

  const paymentChartData = useMemo(() => {
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

    const volumeData: AnalyticsItem[] = months.map((month) => ({ label: month, value: volumeMap[month] || 0, color: '#1D4ED8' }));
    const countData: AnalyticsItem[] = months.map((month) => ({ label: month, value: countMap[month] || 0, color: '#0EA5E9' }));

    return { volumeData, countData };
  }, [payments]);

  const paymentSummary = useMemo(() => {
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
  }, [payments]);

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

    if (section === 'users') return <View style={styles.smallBtnRow}>{['ADMIN', 'EMPLOYER', 'MAID'].map((role) => button(role, `/admin/users/${item.id}/role`, { role }, item.role === role))}</View>;
    if (section === 'jobs') return <View style={styles.smallBtnRow}>{['OPEN', 'CLOSED', 'FILLED'].map((status) => button(status, `/admin/jobs/${item.id}/status`, { status }, item.status === status))}</View>;
    if (section === 'applications') return <View style={styles.smallBtnRow}>{['INTERVIEW', 'ACCEPTED', 'REJECTED'].map((status) => button(status, `/admin/applications/${item.id}/status`, { status }, item.status === status))}</View>;
    if (section === 'contracts') return <View style={styles.smallBtnRow}>{['ACTIVE', 'COMPLETED', 'TERMINATED'].map((status) => button(status, `/admin/contracts/${item.id}/status`, { status }, item.status === status))}</View>;
    if (section === 'disputes') return <View style={styles.smallBtnRow}>{['OPEN', 'RESOLVED', 'CLOSED'].map((status) => button(status, `/admin/disputes/${item.id}/status`, { status, resolution: status === 'RESOLVED' ? 'Resolved from admin dashboard' : '' }, item.status === status))}</View>;
    return null;
  }, [acting, runAction, section]);

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
        { key: 'actions', label: 'Actions', width: 290, render: (item) => renderActionButtons(item) }
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
        { key: 'actions', label: 'Actions', width: 260, render: (item) => renderActionButtons(item) }
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
        { key: 'actions', label: 'Actions', width: 290, render: (item) => renderActionButtons(item) }
      ];
    }
    if (section === 'contracts') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'title', label: 'Contract', width: 220, render: (item) => cellText(item.title) },
        { key: 'employer', label: 'Employer', width: 180, render: (item) => cellText(item?.employer?.fullName) },
        { key: 'maid', label: 'Maid', width: 180, render: (item) => cellText(item?.maid?.fullName) },
        { key: 'salary', label: 'Salary', width: 130, render: (item) => cellText(money(item.salary, item.currency)) },
        { key: 'duration', label: 'Duration', width: 100, render: (item) => cellText(`${item.durationMonths || '-'} months`) },
        { key: 'status', label: 'Status', width: 120, render: (item) => <Pill value={item.status} /> },
        { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 290, render: (item) => renderActionButtons(item) }
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
        { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) }
      ];
    }
    if (section === 'disputes') {
      return [
        { key: 'id', label: 'ID', width: 70, render: (item) => cellText(item.id) },
        { key: 'reason', label: 'Reason', width: 220, render: (item) => cellText(item.reason) },
        { key: 'contract', label: 'Contract', width: 180, render: (item) => cellText(item?.contract?.title) },
        { key: 'complainant', label: 'Complainant', width: 180, render: (item) => cellText(item?.complainant?.fullName) },
        { key: 'respondent', label: 'Respondent', width: 180, render: (item) => cellText(item?.respondent?.fullName) },
        { key: 'status', label: 'Status', width: 120, render: (item) => <Pill value={item.status} /> },
        { key: 'resolution', label: 'Resolution', width: 260, render: (item) => cellText(item.resolution, 2) },
        { key: 'createdAt', label: 'Created', width: 170, render: (item) => cellText(fmtDate(item.createdAt)) },
        { key: 'actions', label: 'Actions', width: 260, render: (item) => renderActionButtons(item) }
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
    if (section === 'contracts') return [{ key: 'contractsStatus', label: 'Status', options: ['ALL', 'ACTIVE', 'COMPLETED', 'TERMINATED'] }];
    if (section === 'payments') return [
      { key: 'paymentsStatus', label: 'Status', options: ['ALL', 'SUCCESSFUL', 'PENDING', 'FAILED', 'CANCELLED'] },
      { key: 'paymentsType', label: 'Type', options: ['ALL', 'DEPOSIT', 'PAYOUT', 'REFUND'] }
    ];
    if (section === 'disputes') return [{ key: 'disputesStatus', label: 'Status', options: ['ALL', 'OPEN', 'RESOLVED', 'CLOSED'] }];
    if (section === 'reviews') return [{ key: 'reviewsRating', label: 'Rating', options: ['ALL', '5', '4', '3', '2', '1'] }];
    return [];
  }, [section]);

  const setFilter = (key: keyof FilterState, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

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
    <View style={[styles.page, { backgroundColor: colorScheme === 'dark' ? '#0A1325' : '#EEF3FF' }]}>
      <View style={styles.shell}>
        {desktop && (
          <View style={[styles.sidebar, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.brand, { color: theme.text }]}>MaidConnect</Text>
            <Text style={[styles.brandSub, { color: theme.textSecondary }]}>Admin Command Center</Text>
            <View style={styles.navCol}>
              {NAV.map((item) => (
                <NavButton
                  key={item.key}
                  active={section === item.key}
                  onPress={() => setSection(item.key)}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </View>
            <TouchableOpacity style={[styles.logout, { borderColor: theme.border }]} onPress={leave}>
              <Ionicons name="log-out-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.logoutText, { color: theme.textSecondary }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.main}>
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
                    <Metric label="Users" value={String(stats.usersCount || 0)} helper={`${stats.adminsCount || 0} admins`} icon="people-outline" />
                    <Metric label="Jobs" value={String(stats.jobsCount || 0)} helper={`${stats.openJobsCount || 0} open`} icon="briefcase-outline" />
                    <Metric label="Payments" value={String(stats.paymentsCount || 0)} helper={`${stats.successfulPaymentsCount || 0} successful`} icon="card-outline" />
                    <Metric label="Volume" value={String(stats.paymentVolume || 0)} helper="Total processed value" icon="cash-outline" />
                  </View>

                  <View style={styles.insightGrid}>
                    {analytics.insightCards.map((item) => (
                      <View key={item.title} style={styles.insightCard}>
                        <Text style={styles.insightTitle}>{item.title}</Text>
                        <Text style={styles.insightValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.analyticsGrid}>
                    <AnalyticsBars title="User Roles" items={analytics.roles} />
                    <AnalyticsBars title="Jobs Pipeline" items={analytics.jobStatus} />
                    <AnalyticsBars title="Payments Status" items={analytics.paymentStatus} />
                    <AnalyticsBars title="Applications Funnel" items={analytics.applicationsStatus} />
                  </View>

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
                    <Text style={styles.sectionCount}>{filteredRows.length} records</Text>
                  </View>

                      {section === 'payments' && (
                    <>
                      <View style={styles.sectionStatsRow}>
                        <ChartLegend items={[
                          { label: 'Revenue', value: 0, color: '#1D4ED8' },
                          { label: 'Transactions', value: 0, color: '#0EA5E9' }
                        ]} />
                        <View style={styles.summaryGrid}>
                          {paymentSummary.slice(1, 5).map((item) => (
                            <SummaryCard key={item.title} title={item.title} value={item.value} />
                          ))}
                        </View>
                      </View>

                      <View style={styles.chartGrid}>
                        <BarChart title="Payments Overview" data={paymentChartData.volumeData} />
                        <LineChart title="Transactions Trend" data={paymentChartData.countData} />
                      </View>
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
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  shell: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
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
  metricCard: {
    minWidth: 220,
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 13
  },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  metricValue: { marginTop: 9, fontSize: 24, fontWeight: '800', color: '#0F172A' },
  metricHelp: { marginTop: 3, fontSize: 11, color: '#64748B' },
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionCount: { fontSize: 12, color: '#64748B' },
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
  smallBtnDisabled: { opacity: 0.45 },
  smallBtnText: { fontSize: 10, fontWeight: '800', color: '#1D4ED8' },
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
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 150, paddingHorizontal: 4 },
  barChartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barChartBar: { width: '70%', borderRadius: 8 },
  chartLabel: { fontSize: 10, color: '#475569', marginTop: 8, textAlign: 'center' },
  lineChartContainer: { minHeight: 160, justifyContent: 'center' },
  lineChartAxis: { position: 'absolute', left: 0, right: 0, top: '50%', borderTopWidth: 1, borderColor: '#CBD5E1' },
  lineChartPoints: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 150 },
  lineChartPointColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  lineChartPoint: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#1D4ED8', borderWidth: 2, borderColor: '#FFFFFF' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F8FAFF', borderRadius: 999, borderWidth: 1, borderColor: '#D8E4F8' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  summaryGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { minWidth: 150, flex: 1, borderWidth: 1, borderColor: '#D8E4F8', borderRadius: 14, backgroundColor: '#F8FAFF', padding: 12 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#475569' },
  summaryValue: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionStatsRow: { marginTop: 14, gap: 10, flexDirection: 'column' },
});
